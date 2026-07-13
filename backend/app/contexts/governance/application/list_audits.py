"""Caso de uso: historial de auditorías de un contenido (más reciente primero)."""
from app.contexts.governance.domain.models import AuditReport
from app.contexts.governance.domain.ports import AuditReportRepository


class ListAudits:
    def __init__(self, report_repo: AuditReportRepository):
        self._repo = report_repo

    def execute(self, content_id: str) -> list[AuditReport]:
        return self._repo.list_for_content(content_id)
