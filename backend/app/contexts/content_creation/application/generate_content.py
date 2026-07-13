"""Caso de uso: generar contenido coherente con la marca.

Flujo: verifica que la marca exista -> recupera reglas relevantes del RAG
(ANTES de generar) -> inyecta esas reglas en el prompt -> genera con el LLM
-> aplica el guard de cumplimiento -> persiste el contenido en PENDIENTE.
"""
from typing import Callable
from uuid import uuid4

from app.contexts.brand_identity.domain.models import BrandRule
from app.contexts.brand_identity.domain.ports import (
    BrandManualRepository,
    TextLlmPort,
    VectorStorePort,
)
from app.contexts.content_creation.domain.compliance import BrandComplianceGuard
from app.contexts.content_creation.domain.models import Content, ContentType
from app.contexts.content_creation.domain.ports import ContentRepository
from app.shared.errors import DomainError
from app.shared.tracing import NullTracer

_TIPO_INSTRUCCION = {
    ContentType.DESCRIPCION: "una descripción de producto persuasiva",
    ContentType.GUION: "un guion corto para un video promocional",
    ContentType.PROMPT_IMAGEN: "un prompt en inglés para generar una imagen del producto",
}


def build_content_prompt(tipo: ContentType, brief: str, rules: list[BrandRule]) -> str:
    reglas = "\n".join(f"- [{r.tipo.value}] {r.texto}" for r in rules) or "- (sin reglas)"
    return (
        f"Eres un redactor de marca. Escribe {_TIPO_INSTRUCCION[tipo]}.\n"
        f"Brief: {brief}\n\n"
        "Debes respetar ESTRICTAMENTE estas reglas de marca recuperadas:\n"
        f"{reglas}\n\n"
        "Responde solo con el contenido pedido, sin explicaciones."
    )


class GenerateContent:
    def __init__(
        self,
        llm: TextLlmPort,
        vector_store: VectorStorePort,
        brand_repo: BrandManualRepository,
        content_repo: ContentRepository,
        tracer=None,
        id_factory: Callable[[], str] = lambda: str(uuid4()),
        banned_terms: list[str] | None = None,
        k: int = 5,
    ):
        self._llm = llm
        self._store = vector_store
        self._brand_repo = brand_repo
        self._content_repo = content_repo
        self._tracer = tracer or NullTracer()
        self._id_factory = id_factory
        self._banned_terms = banned_terms or []
        self._k = k

    def execute(self, brand_id: str, tipo: str, brief: str) -> Content:
        if self._brand_repo.get(brand_id) is None:
            raise DomainError(f"La marca '{brand_id}' no existe")
        try:
            ctype = ContentType(tipo)
        except ValueError as e:
            raise DomainError(f"Tipo de contenido inválido: {tipo}") from e

        # Recuperar contexto ANTES de generar (requisito del reto).
        rules = self._store.query(brand_id, brief, self._k)
        prompt = build_content_prompt(ctype, brief, rules)

        # El prompt incluye las reglas recuperadas del RAG: la traza captura
        # qué contexto se recuperó y qué prompt se envió (requisito del reto).
        with self._tracer.span(
            "generate_content",
            input={"brand_id": brand_id, "tipo": tipo, "prompt": prompt},
        ) as span:
            texto = self._llm.generate(prompt)
            span.set_output(texto)

        # Backstop determinista sobre denylist explícita.
        violaciones = BrandComplianceGuard.check(texto, self._banned_terms)
        if violaciones:
            raise DomainError(f"Contenido viola términos prohibidos: {violaciones}")

        content = Content(
            id=self._id_factory(),
            brand_id=brand_id,
            tipo=ctype,
            texto=texto,
            reglas_aplicadas=[r.texto for r in rules],
        )
        self._content_repo.save(content)
        return content
