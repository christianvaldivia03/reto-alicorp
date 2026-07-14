"""Caso de uso: auditoría multimodal (Aprobador B).

Flujo: carga el contenido -> recupera las reglas de marca del RAG (ANTES de
llamar a visión) -> el modelo de visión contrasta la imagen contra esas reglas
-> se construye y persiste un AuditReport (check verde o motivo de fallo).
"""
from typing import Callable
from uuid import uuid4

from app.contexts.brand_identity.domain.ports import VectorStorePort
from app.contexts.content_creation.domain.ports import ContentRepository
from app.contexts.governance.domain.models import AuditReport, Verdict
from app.contexts.governance.domain.ports import AuditReportRepository, VisionPort
from app.shared.errors import DomainError
from app.shared.tracing import NullTracer

_RETRIEVAL_QUERY = "reglas visuales de logo, color, tipografía e imagen de marca"


class AuditImage:
    def __init__(
        self,
        vision: VisionPort,
        vector_store: VectorStorePort,
        content_repo: ContentRepository,
        report_repo: AuditReportRepository,
        tracer=None,
        id_factory: Callable[[], str] = lambda: str(uuid4()),
        k: int = 5,
    ):
        self._vision = vision
        self._store = vector_store
        self._content_repo = content_repo
        self._report_repo = report_repo
        self._tracer = tracer or NullTracer()
        self._id_factory = id_factory
        self._k = k

    def execute(
        self, content_id: str, image: bytes, mime: str, actor_id: str | None = None
    ) -> AuditReport:
        content = self._content_repo.get(content_id)
        if content is None:
            raise DomainError(f"El contenido '{content_id}' no existe")

        # Recuperar reglas ANTES de llamar al modelo de visión.
        rules = self._store.query(content.brand_id, _RETRIEVAL_QUERY, self._k)

        with self._tracer.span("audit_image", input={"content_id": content_id}) as span:
            veredicto, motivo = self._vision.audit(image, mime, rules)
            span.set_output({"veredicto": veredicto, "motivo": motivo})

        report = AuditReport(
            id=self._id_factory(),
            content_id=content_id,
            brand_id=content.brand_id,
            veredicto=Verdict(veredicto),
            motivo=motivo,
            reglas_evaluadas=[r.texto for r in rules],
            actor_id=actor_id,
        )
        self._report_repo.save(report)

        # Si la imagen NO cumple, la auditoría cierra el ciclo: el contenido
        # queda RECHAZADO con el motivo del veredicto. Solo si sigue PENDIENTE
        # (si ya fue aprobado/rechazado por otra vía, la auditoría solo informa).
        if report.veredicto is Verdict.NO_CUMPLE and content.estado == "PENDIENTE":
            content.rechazar(report.motivo)
            self._content_repo.save(content)

        return report
