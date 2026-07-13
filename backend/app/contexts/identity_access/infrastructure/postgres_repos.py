"""Adaptadores Postgres de UserRepository y AuditLogRepository."""
from typing import Optional

from app.contexts.identity_access.domain.models import AuditLogEntry, Role, User
from app.shared.db import connect


def _to_user(row) -> User:
    return User(id=row[0], email=row[1], rol=Role(row[2]), activo=row[3])


class PostgresUserRepo:
    def create(self, user: User, password_hash: str) -> None:
        with connect() as conn:
            conn.execute(
                "insert into users(id, email, rol, activo, password_hash) "
                "values (%s, %s, %s, %s, %s)",
                (user.id, user.email, user.rol.value, user.activo, password_hash),
            )
            conn.commit()

    def get(self, user_id: str) -> Optional[User]:
        with connect() as conn:
            row = conn.execute(
                "select id, email, rol, activo from users where id = %s", (user_id,)
            ).fetchone()
        return _to_user(row) if row else None

    def by_email(self, email: str) -> Optional[User]:
        with connect() as conn:
            row = conn.execute(
                "select id, email, rol, activo from users where email = %s", (email,)
            ).fetchone()
        return _to_user(row) if row else None

    def password_hash(self, user_id: str) -> Optional[str]:
        with connect() as conn:
            row = conn.execute(
                "select password_hash from users where id = %s", (user_id,)
            ).fetchone()
        return row[0] if row else None

    def set_role(self, user_id: str, role: Role) -> None:
        with connect() as conn:
            conn.execute("update users set rol = %s where id = %s", (role.value, user_id))
            conn.commit()

    def deactivate(self, user_id: str) -> None:
        with connect() as conn:
            conn.execute("update users set activo = false where id = %s", (user_id,))
            conn.commit()

    def list_all(self) -> list[User]:
        with connect() as conn:
            rows = conn.execute(
                "select id, email, rol, activo from users order by created_at"
            ).fetchall()
        return [_to_user(r) for r in rows]


class PostgresAuditLog:
    def add(self, entry: AuditLogEntry) -> None:
        with connect() as conn:
            conn.execute(
                "insert into audit_log(actor_id, accion, target) values (%s, %s, %s)",
                (entry.actor_id, entry.accion, entry.target),
            )
            conn.commit()

    def list_all(self) -> list[AuditLogEntry]:
        with connect() as conn:
            rows = conn.execute(
                "select actor_id, accion, target, created_at from audit_log order by created_at"
            ).fetchall()
        return [
            AuditLogEntry(actor_id=r[0], accion=r[1], target=r[2], timestamp=r[3])
            for r in rows
        ]
