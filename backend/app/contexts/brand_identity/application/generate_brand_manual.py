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
from app.shared.errors import DomainError
from app.shared.tracing import NullTracer


def build_manual_prompt(p: BrandParameters) -> str:
    prompt = (
        "Eres un estratega de marca. Genera un manual de marca como JSON: una lista "
        "de reglas, cada una con 'categoria', 'texto' y 'tipo' "
        "(PROHIBICION | RECOMENDACION | OBLIGACION). Responde SOLO el JSON.\n"
        f"Marca: {p.nombre}"
    )
    # Nombre fijo + señales opcionales (categoría/tono/público) + extras dinámicos:
    # sólo se añaden al prompt las que el usuario haya rellenado.
    señales = {
        "Categoría de producto": p.categoria,
        "Tono": p.tono,
        "Público objetivo": p.publico,
        **p.extras,
    }
    for k, v in señales.items():
        if k.strip() and v.strip():
            prompt += f"\n{k.strip()}: {v.strip()}"
    return prompt


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

    def execute(
        self,
        nombre: str,
        categoria: str = "",
        tono: str = "",
        publico: str = "",
        extras: dict[str, str] | None = None,
    ) -> BrandManual:
        # Nombre obligatorio y único: identificador principal de la marca en
        # todas las vistas. Se valida antes de gastar una llamada al LLM.
        # ponytail: check-then-insert tiene carrera; el índice único en BD es el
        # backstop real si dos altas coinciden.
        if not nombre or not nombre.strip():
            raise DomainError("El nombre de la marca es obligatorio")
        if self._repo.nombre_taken(nombre):
            raise DomainError(f"Ya existe una marca con el nombre '{nombre.strip()}'")

        # Validación en el borde: si los parámetros son inválidos, DomainError
        # antes de gastar una llamada al LLM.
        params = BrandParameters(
            nombre=nombre.strip(), categoria=categoria, tono=tono, publico=publico, extras=extras or {}
        )

        prompt = build_manual_prompt(params)
        with self._tracer.span("generate_brand_manual", input=params) as span:
            raw = self._llm.generate(prompt)
            span.set_output(raw)

        reglas = parse_rules(raw)
        manual = BrandManual(id=self._id_factory(), parametros=params, reglas=reglas)
        self._repo.save(manual)
        self._store.index(manual.id, reglas)
        return manual
