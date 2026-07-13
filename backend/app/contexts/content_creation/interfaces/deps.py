"""Inyección de dependencias del contexto Content Creation."""
from app.contexts.brand_identity.infrastructure.gemini_embedder import GeminiEmbedder
from app.contexts.brand_identity.infrastructure.groq_text_llm import GroqTextLlm
from app.contexts.brand_identity.infrastructure.pgvector_store import PgVectorStore
from app.contexts.brand_identity.infrastructure.postgres_repo import (
    PostgresBrandManualRepo,
)
from app.contexts.content_creation.application.generate_content import GenerateContent
from app.contexts.content_creation.infrastructure.postgres_repo import PostgresContentRepo
from app.shared.langfuse_tracer import build_tracer


def get_generate_content() -> GenerateContent:
    return GenerateContent(
        llm=GroqTextLlm(),
        vector_store=PgVectorStore(GeminiEmbedder()),
        brand_repo=PostgresBrandManualRepo(),
        content_repo=PostgresContentRepo(),
        tracer=build_tracer(),
    )
