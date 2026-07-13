"""Crea los usuarios semilla (uno por rol). Idempotente por email.

Uso: python -m app.contexts.identity_access.seed
Imprime las credenciales para el entregable "Credenciales de Acceso".
"""
from uuid import uuid4

from app.contexts.identity_access.domain.models import Role, User
from app.contexts.identity_access.infrastructure.pbkdf2_hasher import Pbkdf2Hasher
from app.contexts.identity_access.infrastructure.postgres_repos import PostgresUserRepo

_SEED = [
    ("superadmin@contentsuite.dev", "Superadmin#2026", Role.SUPERADMIN),
    ("creador@contentsuite.dev", "Creador#2026", Role.CREADOR),
    ("aprobadorA@contentsuite.dev", "AprobadorA#2026", Role.APROBADOR_A),
    ("aprobadorB@contentsuite.dev", "AprobadorB#2026", Role.APROBADOR_B),
]


def seed() -> None:
    repo = PostgresUserRepo()
    hasher = Pbkdf2Hasher()
    print("== Usuarios semilla ==")
    for email, password, rol in _SEED:
        if repo.by_email(email) is None:
            repo.create(
                User(id=str(uuid4()), email=email, rol=rol, activo=True),
                hasher.hash(password),
            )
            estado = "creado"
        else:
            estado = "ya existía"
        print(f"  [{rol.value:12}] {email}  /  {password}   ({estado})")


if __name__ == "__main__":
    seed()
