import pytest

from app.contexts.identity_access.application.authenticate import (
    Authenticate,
    RefreshAccess,
)
from app.contexts.identity_access.domain.models import Role, User
from app.contexts.identity_access.infrastructure.jwt_token_service import JwtTokenService
from app.shared.errors import DomainError
from tests.fakes import FakeHasher, InMemoryUserRepo


def _wire():
    users = InMemoryUserRepo()
    users.create(
        User(id="u1", email="a@x.com", rol=Role.CREADOR, activo=True),
        password_hash=FakeHasher().hash("secret"),
    )
    uc = Authenticate(users=users, hasher=FakeHasher(), tokens=JwtTokenService(secret="test"))
    return uc, users


def test_authenticate_ok_returns_token_pair():
    uc, _ = _wire()
    pair = uc.execute(email="a@x.com", password="secret")
    assert pair.access and pair.refresh


def test_authenticate_bad_password_raises():
    uc, _ = _wire()
    with pytest.raises(DomainError):
        uc.execute(email="a@x.com", password="wrong")


def test_authenticate_inactive_user_raises():
    uc, users = _wire()
    users.deactivate("u1")
    with pytest.raises(DomainError):
        uc.execute(email="a@x.com", password="secret")


def test_expired_token_is_rejected():
    svc = JwtTokenService(secret="test")
    expired = svc.issue(sub="u1", rol="CREADOR", ttl_min=-1)
    with pytest.raises(Exception):
        svc.verify(expired)


def _refresh_wire():
    users = InMemoryUserRepo()
    users.create(
        User(id="u1", email="a@x.com", rol=Role.CREADOR, activo=True),
        password_hash=FakeHasher().hash("secret"),
    )
    svc = JwtTokenService(secret="test")
    return RefreshAccess(users=users, tokens=svc), users, svc


def test_refresh_returns_new_access_token():
    uc, _, svc = _refresh_wire()
    access = uc.execute(svc.issue_refresh(sub="u1"))
    claims = svc.verify(access)
    assert claims["sub"] == "u1" and claims["type"] == "access"


def test_refresh_rejects_access_token_used_as_refresh():
    uc, _, svc = _refresh_wire()
    with pytest.raises(DomainError):
        uc.execute(svc.issue(sub="u1", rol="CREADOR"))


def test_refresh_rejects_expired_refresh():
    uc, _, svc = _refresh_wire()
    with pytest.raises(DomainError):
        uc.execute(svc.issue_refresh(sub="u1", ttl_min=-1))


def test_refresh_rejects_inactive_user():
    uc, users, svc = _refresh_wire()
    users.deactivate("u1")
    with pytest.raises(DomainError):
        uc.execute(svc.issue_refresh(sub="u1"))
