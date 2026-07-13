"""Modelo de dominio del contexto Content Creation."""
from dataclasses import dataclass, field
from enum import Enum

from app.shared.errors import DomainError


class ContentType(str, Enum):
    DESCRIPCION = "DESCRIPCION"
    GUION = "GUION"
    PROMPT_IMAGEN = "PROMPT_IMAGEN"


@dataclass
class Content:
    """Agregado raíz: una pieza de contenido generada. Nace PENDIENTE y
    transiciona a APROBADO / RECHAZADO. Las invariantes del flujo viven aquí."""

    id: str
    brand_id: str
    tipo: ContentType
    texto: str
    reglas_aplicadas: list[str] = field(default_factory=list)
    estado: str = "PENDIENTE"
    motivo: str | None = None
    created_by: str | None = None  # id del Creador (autoría)
    created_at: str | None = None  # ISO 8601; lo fija la BD, se lee de vuelta

    def __post_init__(self):
        if not self.texto or not self.texto.strip():
            raise DomainError("Content.texto no puede estar vacío")

    def aprobar(self) -> None:
        if self.estado != "PENDIENTE":
            raise DomainError(f"No se puede aprobar contenido en estado {self.estado}")
        self.estado = "APROBADO"

    def rechazar(self, motivo: str) -> None:
        if self.estado != "PENDIENTE":
            raise DomainError(f"No se puede rechazar contenido en estado {self.estado}")
        if not motivo or not motivo.strip():
            raise DomainError("El motivo de rechazo es obligatorio")
        self.estado = "RECHAZADO"
        self.motivo = motivo
