"""Caso de uso: generar un Manual de Marca y dejarlo indexado en el RAG."""
from typing import Callable
from uuid import uuid4

from app.contexts.brand_identity.domain.models import (
    BrandManual,
    BrandParameters,
    parse_rules,
)
from app.contexts.brand_identity.domain.ports import (
    BrandManualRepository,
    TextLlmPort,
    VectorStorePort,
)
from app.shared.tracing import NullTracer


def build_manual_prompt(p: BrandParameters) -> str:
    return (
        "Eres un estratega de marca. Genera un manual de marca como JSON: una lista "
        "de reglas, cada una con 'categoria', 'texto' y 'tipo' "
        "(PROHIBICION | RECOMENDACION | OBLIGACION). Responde SOLO el JSON.\n"
        f"Categoría de producto: {p.categoria}\nTono: {p.tono}\nPúblico objetivo: {p.publico}"
    )


class GenerateBrandManual:
    def __init__(
        self,
        llm: TextLlmPort,
        vector_store: VectorStorePort,
        repo: BrandManualRepository,
        tracer=None,
        id_factory: Callable[[], str] = lambda: str(uuid4()),
    ):
        self._llm = llm
        self._store = vector_store
        self._repo = repo
        self._tracer = tracer or NullTracer()
        self._id_factory = id_factory

    def execute(self, categoria: str, tono: str, publico: str) -> BrandManual:
        # Validación en el borde: si los parámetros son inválidos, DomainError
        # antes de gastar una llamada al LLM.
        params = BrandParameters(categoria=categoria, tono=tono, publico=publico)

        prompt = build_manual_prompt(params)
        with self._tracer.span("generate_brand_manual", input=params) as span:
            raw = self._llm.generate(prompt)
            span.set_output(raw)

        reglas = parse_rules(raw)
        manual = BrandManual(id=self._id_factory(), parametros=params, reglas=reglas)
        self._repo.save(manual)
        self._store.index(manual.id, reglas)
        return manual
