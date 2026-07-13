"""Casos de uso de sesión: login (emite access + refresh) y renovación."""
from dataclasses import dataclass

from app.contexts.identity_access.domain.ports import (
    PasswordHasher,
    TokenService,
    UserRepository,
)
from app.shared.errors import DomainError


@dataclass(frozen=True)
class TokenPair:
    access: str
    refresh: str


class Authenticate:
    def __init__(self, users: UserRepository, hasher: PasswordHasher, tokens: TokenService):
        self._users = users
        self._hasher = hasher
        self._tokens = tokens

    def execute(self, email: str, password: str) -> TokenPair:
        user = self._users.by_email(email)
        if user is None or not user.activo:
            raise DomainError("Credenciales inválidas")
        stored = self._users.password_hash(user.id)
        if stored is None or not self._hasher.verify(password, stored):
            raise DomainError("Credenciales inválidas")
        return TokenPair(
            access=self._tokens.issue(sub=user.id, rol=user.rol.value),
            refresh=self._tokens.issue_refresh(sub=user.id),
        )


class RefreshAccess:
    """Canjea un refresh token válido por un nuevo access token. Rechaza tokens
    que no sean de tipo refresh y usuarios inexistentes o desactivados."""

    def __init__(self, users: UserRepository, tokens: TokenService):
        self._users = users
        self._tokens = tokens

    def execute(self, refresh_token: str) -> str:
        try:
            claims = self._tokens.verify(refresh_token)
        except Exception as e:
            raise DomainError("Refresh token inválido o expirado") from e
        if claims.get("type") != "refresh":
            raise DomainError("Se esperaba un refresh token")
        user = self._users.get(claims.get("sub", ""))
        if user is None or not user.activo:
            raise DomainError("Usuario inválido o inactivo")
        return self._tokens.issue(sub=user.id, rol=user.rol.value)
