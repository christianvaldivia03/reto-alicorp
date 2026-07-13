"""Modelo de dominio de Identidad y Acceso (RBAC)."""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum


class Role(str, Enum):
    SUPERADMIN = "SUPERADMIN"
    CREADOR = "CREADOR"
    APROBADOR_A = "APROBADOR_A"
    APROBADOR_B = "APROBADOR_B"


class Action(str, Enum):
    CREATE_BRAND = "CREATE_BRAND"
    GENERATE_CONTENT = "GENERATE_CONTENT"
    APPROVE_CONTENT = "APPROVE_CONTENT"
    AUDIT_IMAGE = "AUDIT_IMAGE"
    MANAGE_USERS = "MANAGE_USERS"


class PermissionPolicy:
    """Matriz RBAC. Separación estricta de deberes: cada rol solo su etapa."""

    _MATRIX: dict[Role, set[Action]] = {
        Role.SUPERADMIN: {Action.MANAGE_USERS},
        Role.CREADOR: {Action.CREATE_BRAND, Action.GENERATE_CONTENT},
        Role.APROBADOR_A: {Action.APPROVE_CONTENT},
        Role.APROBADOR_B: {Action.AUDIT_IMAGE},
    }

    @classmethod
    def is_allowed(cls, rol: Role, action: Action) -> bool:
        return action in cls._MATRIX.get(rol, set())


@dataclass
class User:
    id: str
    email: str
    rol: Role
    activo: bool = True


@dataclass
class AuditLogEntry:
    actor_id: str
    accion: str
    target: str
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
