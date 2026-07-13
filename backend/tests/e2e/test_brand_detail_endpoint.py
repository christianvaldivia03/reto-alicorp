"""E2E de GET /brands/{id}: manual completo con todas sus reglas (gap A2)."""
import pytest
from fastapi.testclient import TestClient

from app.contexts.brand_identity.application.get_brand import GetBrand
from app.contexts.brand_identity.domain.models import (
    BrandManual,
    BrandParameters,
    BrandRule,
    RuleType,
)
from app.contexts.brand_identity.interfaces.deps import get_get_brand
from app.contexts.identity_access.domain.models import Role, User
from app.contexts.identity_access.interfaces.deps import get_current_user
from app.main import app
from tests.fakes import InMemoryBrandManualRepo


@pytest.fixture
def client():
    repo = InMemoryBrandManualRepo()
    repo.save(
        BrandManual(
            id="b1",
            parametros=BrandParameters("Snack", "Divertido", "Gen Z"),
            reglas=[BrandRule("tono", "Prohibido tecnicismos", RuleType.PROHIBICION)],
        )
    )
    prev = dict(app.dependency_overrides)
    app.dependency_overrides[get_get_brand] = lambda: GetBrand(repo)
    app.dependency_overrides[get_current_user] = lambda: User(
        id="cr", email="cr@x.com", rol=Role.CREADOR, activo=True
    )
    yield TestClient(app)
    app.dependency_overrides.clear()
    app.dependency_overrides.update(prev)


def test_get_brand_returns_rules(client):
    r = client.get("/brands/b1")
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == "b1"
    assert body["reglas"][0]["texto"] == "Prohibido tecnicismos"


def test_get_brand_unknown_returns_404(client):
    r = client.get("/brands/fantasma")
    assert r.status_code == 404
