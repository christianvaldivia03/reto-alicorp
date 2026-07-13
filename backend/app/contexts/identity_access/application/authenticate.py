"""Caso de uso: login. Verifica credenciales y emite un JWT."""
from app.contexts.identity_access.domain.ports import (
    PasswordHasher,
    TokenService,
    UserRepository,
)
from app.shared.errors import DomainError


class Authenticate:
    def __init__(self, users: UserRepository, hasher: PasswordHasher, tokens: TokenService):
        self._users = users
        self._hasher = hasher
        self._tokens = tokens

    def execute(self, email: str, password: str) -> str:
        user = self._users.by_email(email)
        if user is None or not user.activo:
            raise DomainError("Credenciales inválidas")
        stored = self._users.password_hash(user.id)
        if stored is None or not self._hasher.verify(password, stored):
            raise DomainError("Credenciales inválidas")
        return self._tokens.issue(sub=user.id, rol=user.rol.value)
