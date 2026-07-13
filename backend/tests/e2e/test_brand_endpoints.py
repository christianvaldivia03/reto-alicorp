from fastapi.testclient import TestClient

from app.contexts.brand_identity.application.generate_brand_manual import (
    GenerateBrandManual,
)
from app.contexts.brand_identity.application.retrieve_relevant_rules import (
    RetrieveRelevantRules,
)
from app.contexts.brand_identity.interfaces.deps import (
    get_generate_manual,
    get_retrieve_rules,
)
from app.contexts.identity_access.domain.models import Role, User
from app.contexts.identity_access.interfaces.deps import get_current_user
from app.main import app
from tests.fakes import FakeTextLlm, InMemoryBrandManualRepo, InMemoryVectorStore

_LLM_JSON = (
    '[{"categoria":"tono","texto":"Prohibido usar tecnicismos","tipo":"PROHIBICION"},'
    '{"categoria":"voz","texto":"Hablar cercano y juvenil","tipo":"RECOMENDACION"}]'
)

# Un solo vector store compartido para que lo indexado en POST se recupere en GET.
_store = InMemoryVectorStore()


def _fake_generate():
    return GenerateBrandManual(
        llm=FakeTextLlm(_LLM_JSON),
        vector_store=_store,
        repo=InMemoryBrandManualRepo(),
        id_factory=lambda: "brand-e2e",
    )


def _fake_retrieve():
    return RetrieveRelevantRules(vector_store=_store)


app.dependency_overrides[get_generate_manual] = _fake_generate
app.dependency_overrides[get_retrieve_rules] = _fake_retrieve
app.dependency_overrides[get_current_user] = lambda: User(
    id="cr", email="cr@x.com", rol=Role.CREADOR, activo=True
)

client = TestClient(app)


def test_create_brand_returns_manual():
    r = client.post("/brands", json={"categoria": "Snack", "tono": "Divertido", "publico": "Gen Z"})
    assert r.status_code == 201
    body = r.json()
    assert body["id"] == "brand-e2e"
    assert len(body["reglas"]) == 2


def test_create_brand_rejects_empty_field():
    r = client.post("/brands", json={"categoria": "", "tono": "X", "publico": "Y"})
    assert r.status_code == 422


def test_get_rules_retrieves_indexed_rule():
    client.post("/brands", json={"categoria": "Snack", "tono": "Divertido", "publico": "Gen Z"})
    r = client.get("/brands/brand-e2e/rules", params={"query": "puedo usar tecnicismos?", "k": 1})
    assert r.status_code == 200
    rules = r.json()
    assert rules[0]["texto"] == "Prohibido usar tecnicismos"
