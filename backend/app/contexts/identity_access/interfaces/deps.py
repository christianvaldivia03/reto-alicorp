"""Inyección de dependencias y guards de autorización.

get_current_user: valida el JWT del header y carga el usuario (activo).
require(action): guard que aplica la matriz RBAC → 403 si no está permitido.

En tests se sobrescribe get_current_user con un usuario fijo del rol deseado.
"""
from fastapi import Depends, Header, HTTPException

from app.contexts.identity_access.application.authenticate import Authenticate
from app.contexts.identity_access.application.manage_users import ManageUsers
from app.contexts.identity_access.domain.models import Action, PermissionPolicy, User
from app.contexts.identity_access.infrastructure.jwt_token_service import JwtTokenService
from app.contexts.identity_access.infrastructure.pbkdf2_hasher import Pbkdf2Hasher
from app.contexts.identity_access.infrastructure.postgres_repos import (
    PostgresAuditLog,
    PostgresUserRepo,
)


def get_user_repo() -> PostgresUserRepo:
    return PostgresUserRepo()


def get_tokens() -> JwtTokenService:
    return JwtTokenService()


def get_authenticate() -> Authenticate:
    return Authenticate(users=PostgresUserRepo(), hasher=Pbkdf2Hasher(), tokens=JwtTokenService())


def get_manage_users() -> ManageUsers:
    return ManageUsers(users=PostgresUserRepo(), audit=PostgresAuditLog(), hasher=Pbkdf2Hasher())


def get_current_user(
    authorization: str | None = Header(default=None),
    tokens: JwtTokenService = Depends(get_tokens),
    users: PostgresUserRepo = Depends(get_user_repo),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Falta el token de acceso")
    try:
        claims = tokens.verify(authorization[7:])
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    user = users.get(claims.get("sub", ""))
    if user is None or not user.activo:
        raise HTTPException(status_code=401, detail="Usuario inválido o inactivo")
    return user


def require(action: Action):
    """Factory de dependencia: exige que el rol del usuario permita `action`."""

    def _guard(user: User = Depends(get_current_user)) -> User:
        if not PermissionPolicy.is_allowed(user.rol, action):
            raise HTTPException(status_code=403, detail="No autorizado para esta acción")
        return user

    return _guard
