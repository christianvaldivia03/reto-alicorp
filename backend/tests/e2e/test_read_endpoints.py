"""E2E de la Fase 6: endpoints de consulta (/brands, /content, /content/{id}).

Lecturas para roles autenticados; la UI filtra. Sin token → 401.
"""
import pytest
from fastapi.testclient import TestClient

from app.contexts.brand_identity.application.list_brands import ListBrands
from app.contexts.brand_identity.domain.models import (
    BrandManual,
    BrandParameters,
    BrandRule,
    RuleType,
)
from app.contexts.brand_identity.interfaces.deps import get_list_brands
from app.contexts.content_creation.application.list_content import GetContent, ListContent
from app.contexts.content_creation.domain.models import Content, ContentType
from app.contexts.content_creation.interfaces.deps import (
    get_get_content,
    get_list_content,
)
from app.contexts.identity_access.domain.models import Role, User
from app.contexts.identity_access.interfaces.deps import get_current_user
from app.main import app
from tests.fakes import InMemoryBrandManualRepo, InMemoryContentRepo


def _seeded_content_repo() -> InMemoryContentRepo:
    repo = InMemoryContentRepo()
    repo.save(Content("c1", "b1", ContentType.DESCRIPCION, "pend uno", estado="PENDIENTE"))
    repo.save(Content("c2", "b1", ContentType.GUION, "aprobado", estado="APROBADO"))
    return repo


def _seeded_brand_repo() -> InMemoryBrandManualRepo:
    repo = InMemoryBrandManualRepo()
    repo.save(
        BrandManual(
            id="b1",
            parametros=BrandParameters("Snack", "Divertido", "Gen Z"),
            reglas=[BrandRule("tono", "regla", RuleType.RECOMENDACION)],
        )
    )
    return repo


@pytest.fixture
def client():
    content_repo = _seeded_content_repo()
    brand_repo = _seeded_brand_repo()
    prev = dict(app.dependency_overrides)
    app.dependency_overrides[get_list_brands] = lambda: ListBrands(brand_repo)
    app.dependency_overrides[get_list_content] = lambda: ListContent(content_repo)
    app.dependency_overrides[get_get_content] = lambda: GetContent(content_repo)
    app.dependency_overrides[get_current_user] = lambda: User(
        id="u", email="u@x.com", rol=Role.APROBADOR_A, activo=True
    )
    yield TestClient(app)
    app.dependency_overrides.clear()
    app.dependency_overrides.update(prev)


def test_list_brands_returns_all(client):
    r = client.get("/brands")
    assert r.status_code == 200
    assert r.json()[0] == {
        "id": "b1",
        "categoria": "Snack",
        "tono": "Divertido",
        "publico": "Gen Z",
    }


def test_list_content_filters_by_estado(client):
    r = client.get("/content", params={"estado": "PENDIENTE"})
    assert r.status_code == 200
    body = r.json()
    assert [c["id"] for c in body] == ["c1"]


def test_get_content_returns_detail(client):
    r = client.get("/content/c2")
    assert r.status_code == 200
    assert r.json()["estado"] == "APROBADO"


def test_get_content_unknown_returns_404(client):
    r = client.get("/content/fantasma")
    assert r.status_code == 404


def test_list_brands_requires_auth(client):
    # Sin token: quitamos el override de auth para ejercer el guard real.
    app.dependency_overrides.pop(get_current_user, None)
    r = client.get("/brands")
    assert r.status_code == 401
