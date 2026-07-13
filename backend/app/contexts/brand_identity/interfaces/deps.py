"""Inyección de dependencias del contexto. Construye los casos de uso con los
adaptadores reales. En tests se sobrescriben vía app.dependency_overrides."""
from app.contexts.brand_identity.application.generate_brand_manual import (
    GenerateBrandManual,
)
from app.contexts.brand_identity.application.list_brands import ListBrands
from app.contexts.brand_identity.application.retrieve_relevant_rules import (
    RetrieveRelevantRules,
)
from app.contexts.brand_identity.infrastructure.gemini_embedder import GeminiEmbedder
from app.contexts.brand_identity.infrastructure.groq_text_llm import GroqTextLlm
from app.contexts.brand_identity.infrastructure.pgvector_store import PgVectorStore
from app.contexts.brand_identity.infrastructure.postgres_repo import (
    PostgresBrandManualRepo,
)
from app.shared.langfuse_tracer import build_tracer


def _store() -> PgVectorStore:
    return PgVectorStore(GeminiEmbedder())


def get_generate_manual() -> GenerateBrandManual:
    # json_mode=True: el manual se genera como JSON estructurado.
    return GenerateBrandManual(
        llm=GroqTextLlm(json_mode=True),
        vector_store=_store(),
        repo=PostgresBrandManualRepo(),
        tracer=build_tracer(),
    )


def get_retrieve_rules() -> RetrieveRelevantRules:
    return RetrieveRelevantRules(vector_store=_store())


def get_list_brands() -> ListBrands:
    return ListBrands(brand_repo=PostgresBrandManualRepo())
