"""Casos de uso de gestión de usuarios (solo Superadmin). Cada acción
sensible deja una entrada en el log de auditoría."""
from typing import Callable
from uuid import uuid4

from app.contexts.identity_access.domain.models import (
    Action,
    AuditLogEntry,
    PermissionPolicy,
    Role,
    User,
)
from app.contexts.identity_access.domain.ports import (
    AuditLogRepository,
    PasswordHasher,
    UserRepository,
)
from app.shared.errors import DomainError


class ManageUsers:
    def __init__(
        self,
        users: UserRepository,
        audit: AuditLogRepository,
        hasher: PasswordHasher,
        id_factory: Callable[[], str] = lambda: str(uuid4()),
    ):
        self._users = users
        self._audit = audit
        self._hasher = hasher
        self._id_factory = id_factory

    def _require_superadmin(self, actor: User) -> None:
        if not PermissionPolicy.is_allowed(actor.rol, Action.MANAGE_USERS):
            raise DomainError("Solo el Superadmin puede gestionar usuarios")

    def create_user(self, actor: User, email: str, password: str, rol: Role) -> User:
        self._require_superadmin(actor)
        user = User(id=self._id_factory(), email=email, rol=rol, activo=True)
        self._users.create(user, self._hasher.hash(password))
        self._audit.add(AuditLogEntry(actor_id=actor.id, accion="CREATE_USER", target=user.id))
        return user

    def change_role(self, actor: User, user_id: str, new_role: Role) -> None:
        self._require_superadmin(actor)
        if self._users.get(user_id) is None:
            raise DomainError("Usuario no existe")
        self._users.set_role(user_id, new_role)
        self._audit.add(
            AuditLogEntry(actor_id=actor.id, accion="CHANGE_ROLE", target=user_id)
        )

    def deactivate(self, actor: User, user_id: str) -> None:
        self._require_superadmin(actor)
        if self._users.get(user_id) is None:
            raise DomainError("Usuario no existe")
        self._users.deactivate(user_id)
        self._audit.add(
            AuditLogEntry(actor_id=actor.id, accion="DEACTIVATE_USER", target=user_id)
        )
