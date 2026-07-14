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
    actor_id: str | None = None  # Aprobador B que ejecutó la auditoría
    actor_email: str | None = None  # denormalizado al leer (display)
    created_at: str | None = None  # ISO 8601; lo fija la BD, se lee de vuelta

    def __post_init__(self):
        # Si no cumple, debe explicar por qué (requisito del reto).
        if self.veredicto is Verdict.NO_CUMPLE and not (self.motivo or "").strip():
            raise DomainError("Un veredicto NO_CUMPLE requiere un motivo")
