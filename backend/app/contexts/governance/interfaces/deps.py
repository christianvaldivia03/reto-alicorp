"""Inyección de dependencias del contexto Governance."""
from app.contexts.brand_identity.infrastructure.gemini_embedder import GeminiEmbedder
from app.contexts.brand_identity.infrastructure.pgvector_store import PgVectorStore
from app.contexts.content_creation.infrastructure.postgres_repo import PostgresContentRepo
from app.contexts.governance.application.approve_content import (
    ApproveContent,
    RejectContent,
)
from app.contexts.governance.application.audit_image import AuditImage
from app.contexts.governance.infrastructure.gemini_vision import GeminiVision
from app.contexts.governance.infrastructure.postgres_repo import PostgresAuditReportRepo
from app.shared.langfuse_tracer import build_tracer


def get_approve_content() -> ApproveContent:
    return ApproveContent(PostgresContentRepo())


def get_reject_content() -> RejectContent:
    return RejectContent(PostgresContentRepo())


def get_audit_image() -> AuditImage:
    return AuditImage(
        vision=GeminiVision(),
        vector_store=PgVectorStore(GeminiEmbedder()),
        content_repo=PostgresContentRepo(),
        report_repo=PostgresAuditReportRepo(),
        tracer=build_tracer(),
    )
