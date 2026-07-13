import pytest

from app.contexts.identity_access.application.manage_users import ManageUsers
from app.contexts.identity_access.domain.models import Role, User
from app.shared.errors import DomainError
from tests.fakes import FakeHasher, InMemoryAuditLog, InMemoryUserRepo


def _superadmin():
    return User(id="su", email="su@x.com", rol=Role.SUPERADMIN, activo=True)


def _creador():
    return User(id="cr", email="cr@x.com", rol=Role.CREADOR, activo=True)


def _wire():
    users = InMemoryUserRepo()
    audit = InMemoryAuditLog()
    uc = ManageUsers(users=users, audit=audit, hasher=FakeHasher(), id_factory=lambda: "u1")
    return uc, users, audit


def test_superadmin_creates_user_and_writes_audit():
    uc, users, audit = _wire()
    u = uc.create_user(_superadmin(), email="new@x.com", password="pw", rol=Role.CREADOR)
    assert u.id == "u1"
    assert users.get("u1") is not None
    assert len(audit.entries) == 1
    assert audit.entries[0].accion == "CREATE_USER"


def test_non_superadmin_cannot_create_user():
    uc, users, audit = _wire()
    with pytest.raises(DomainError):
        uc.create_user(_creador(), email="new@x.com", password="pw", rol=Role.CREADOR)
    assert users.get("u1") is None
    assert audit.entries == []


def test_superadmin_role_change_writes_audit_log():
    uc, users, audit = _wire()
    uc.create_user(_superadmin(), email="new@x.com", password="pw", rol=Role.CREADOR)
    uc.change_role(_superadmin(), user_id="u1", new_role=Role.APROBADOR_A)
    assert users.get("u1").rol is Role.APROBADOR_A
    assert any(e.accion == "CHANGE_ROLE" for e in audit.entries)


def test_deactivate_user_by_superadmin():
    uc, users, audit = _wire()
    uc.create_user(_superadmin(), email="new@x.com", password="pw", rol=Role.CREADOR)
    uc.deactivate(_superadmin(), user_id="u1")
    assert users.get("u1").activo is False
