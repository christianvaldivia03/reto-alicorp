"""Puertos del contexto Governance."""
from typing import Optional, Protocol

from app.contexts.brand_identity.domain.models import BrandRule
from app.contexts.governance.domain.models import AuditReport


class VisionPort(Protocol):
    def audit(self, image: bytes, mime: str, rules: list[BrandRule]) -> tuple[str, str]:
        """Devuelve (veredicto, motivo). veredicto ∈ {CUMPLE, NO_CUMPLE}."""
        ...


class AuditReportRepository(Protocol):
    def save(self, report: AuditReport) -> None: ...
    def get(self, report_id: str) -> Optional[AuditReport]: ...
