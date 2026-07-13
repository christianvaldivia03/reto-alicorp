from fastapi.testclient import TestClient

from app.contexts.brand_identity.domain.models import (
    BrandManual,
    BrandParameters,
    BrandRule,
    RuleType,
)
from app.contexts.content_creation.application.generate_content import GenerateContent
from app.contexts.content_creation.interfaces.deps import get_generate_content
from app.contexts.identity_access.domain.models import Role, User
from app.contexts.identity_access.interfaces.deps import get_current_user
from app.main import app
from tests.fakes import (
    FakeTextLlm,
    InMemoryBrandManualRepo,
    InMemoryContentRepo,
    InMemoryVectorStore,
)

_RULE = BrandRule("tono", "Prohibido usar tecnicismos", RuleType.PROHIBICION)


def _fake_generate_content():
    brand_repo = InMemoryBrandManualRepo()
    brand_repo.save(
        BrandManual(
            id="b1",
            parametros=BrandParameters("Snack", "Divertido", "Gen Z"),
            reglas=[_RULE],
        )
    )
    store = InMemoryVectorStore()
    store.index("b1", [_RULE])
    return GenerateContent(
        llm=FakeTextLlm("Descripción cercana del snack"),
        vector_store=store,
        brand_repo=brand_repo,
        content_repo=InMemoryContentRepo(),
        id_factory=lambda: "c-e2e",
    )


app.dependency_overrides[get_generate_content] = _fake_generate_content
app.dependency_overrides[get_current_user] = lambda: User(
    id="cr", email="cr@x.com", rol=Role.CREADOR, activo=True
)

client = TestClient(app)


def test_generate_content_returns_pending():
    r = client.post(
        "/content",
        json={"brand_id": "b1", "tipo": "DESCRIPCION", "brief": "sin tecnicismos"},
    )
    assert r.status_code == 201
    body = r.json()
    assert body["id"] == "c-e2e"
    assert body["estado"] == "PENDIENTE"
    assert body["tipo"] == "DESCRIPCION"


def test_generate_content_unknown_brand_returns_422():
    r = client.post(
        "/content",
        json={"brand_id": "fantasma", "tipo": "DESCRIPCION", "brief": "x"},
    )
    assert r.status_code == 422


def test_generate_content_invalid_type_returns_422():
    r = client.post(
        "/content",
        json={"brand_id": "b1", "tipo": "TWEET", "brief": "x"},
    )
    assert r.status_code == 422
