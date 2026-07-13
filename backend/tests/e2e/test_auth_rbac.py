"""RBAC a nivel HTTP: sin token -> 401, rol equivocado -> 403.

Las denegaciones (401/403) se resuelven en el guard, antes de tocar la BD o
los modelos, así que no requieren servicios reales.
"""
import pytest
from fastapi.testclient import TestClient

from app.contexts.identity_access.domain.models import Role, User
from app.contexts.identity_access.interfaces.deps import get_current_user
from app.main import app

client = TestClient(app)


@pytest.fixture
def as_role():
    """Sobrescribe el usuario actual con el rol dado; restaura al terminar."""
    original = dict(app.dependency_overrides)

    def _set(rol: Role | None):
        if rol is None:
            app.dependency_overrides.pop(get_current_user, None)
        else:
            app.dependency_overrides[get_current_user] = lambda: User(
                id="x", email="x@x.com", rol=rol, activo=True
            )

    yield _set
    app.dependency_overrides.clear()
    app.dependency_overrides.update(original)


def test_no_token_returns_401(as_role):
    as_role(None)
    r = client.post("/content", json={"brand_id": "b", "tipo": "DESCRIPCION", "brief": "x"})
    assert r.status_code == 401


def test_aprobador_cannot_generate_content_403(as_role):
    as_role(Role.APROBADOR_A)
    r = client.post("/content", json={"brand_id": "b", "tipo": "DESCRIPCION", "brief": "x"})
    assert r.status_code == 403


def test_aprobador_cannot_create_brand_403(as_role):
    as_role(Role.APROBADOR_B)
    r = client.post("/brands", json={"categoria": "c", "tono": "t", "publico": "p"})
    assert r.status_code == 403


def test_creador_cannot_manage_users_403(as_role):
    as_role(Role.CREADOR)
    r = client.post("/users", json={"email": "n@x.com", "password": "pw", "rol": "CREADOR"})
    assert r.status_code == 403


def test_superadmin_cannot_generate_content_403(as_role):
    # Separación de deberes: el Superadmin gobierna, no crea contenido.
    as_role(Role.SUPERADMIN)
    r = client.post("/content", json={"brand_id": "b", "tipo": "DESCRIPCION", "brief": "x"})
    assert r.status_code == 403
