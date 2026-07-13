"""Modelo de dominio de Governance (auditoría multimodal)."""
from dataclasses import dataclass, field
from enum import Enum

from app.shared.errors import DomainError


class Verdict(str, Enum):
    CUMPLE = "CUMPLE"
    NO_CUMPLE = "NO_CUMPLE"


@dataclass
class AuditReport:
    """Resultado de contrastar una imagen contra el manual de marca."""

    id: str
    content_id: str
    brand_id: str
    veredicto: Verdict
    motivo: str
    reglas_evaluadas: list[str] = field(default_factory=list)

    def __post_init__(self):
        # Si no cumple, debe explicar por qué (requisito del reto).
        if self.veredicto is Verdict.NO_CUMPLE and not (self.motivo or "").strip():
            raise DomainError("Un veredicto NO_CUMPLE requiere un motivo")
