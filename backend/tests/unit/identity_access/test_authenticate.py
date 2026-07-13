import pytest

from app.contexts.identity_access.application.authenticate import Authenticate
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


def test_authenticate_ok_returns_token():
    uc, _ = _wire()
    token = uc.execute(email="a@x.com", password="secret")
    assert isinstance(token, str) and token


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
