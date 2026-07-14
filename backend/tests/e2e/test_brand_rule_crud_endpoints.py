"""E2E de los endpoints de reglas (editar/añadir/eliminar) con fakes."""
from fastapi.testclient import TestClient

from app.contexts.brand_identity.application.update_brand_rule import (
    AddBrandRule,
    DeleteBrandRule,
    UpdateBrandRule,
)
from app.contexts.brand_identity.domain.models import BrandRule, RuleType
from app.contexts.brand_identity.interfaces.deps import (
    get_add_rule,
    get_delete_rule,
    get_update_rule,
)
from app.contexts.identity_access.domain.models import Role, User
from app.contexts.identity_access.interfaces.deps import get_current_user
from app.main import app
from tests.fakes import InMemoryVectorStore

BRAND = "brand-e2e"
_store = InMemoryVectorStore()


def _reset_store():
    _store.data.clear()
    _store.index(BRAND, [BrandRule("cat", "regla base sobre logotipo", RuleType.OBLIGACION)])


app.dependency_overrides[get_update_rule] = lambda: UpdateBrandRule(_store)
app.dependency_overrides[get_add_rule] = lambda: AddBrandRule(_store)
app.dependency_overrides[get_delete_rule] = lambda: DeleteBrandRule(_store)
app.dependency_overrides[get_current_user] = lambda: User(
    id="cr", email="cr@x.com", rol=Role.CREADOR, activo=True
)

client = TestClient(app)


def test_add_rule_endpoint():
    _reset_store()
    r = client.post(
        f"/brands/{BRAND}/rules",
        json={"categoria": "Empaque", "texto": "Usar empaques reciclables", "tipo": "OBLIGACION"},
    )
    assert r.status_code == 201
    assert r.json()["id"] is not None
    assert r.json()["texto"] == "Usar empaques reciclables"


def test_update_rule_endpoint():
    _reset_store()
    rid = _store.data[BRAND][0].id
    r = client.patch(
        f"/brands/{BRAND}/rules/{rid}",
        json={"categoria": "Colores", "texto": "Verde y amarillo", "tipo": "OBLIGACION"},
    )
    assert r.status_code == 200
    assert r.json()["texto"] == "Verde y amarillo"


def test_update_rule_rejects_empty_text():
    _reset_store()
    rid = _store.data[BRAND][0].id
    r = client.patch(
        f"/brands/{BRAND}/rules/{rid}",
        json={"categoria": "c", "texto": "  ", "tipo": "OBLIGACION"},
    )
    assert r.status_code == 422


def test_delete_rule_endpoint():
    _reset_store()
    _store.add_rule(BRAND, BrandRule("c", "regla extra", RuleType.RECOMENDACION))
    rid = _store.data[BRAND][0].id
    r = client.delete(f"/brands/{BRAND}/rules/{rid}")
    assert r.status_code == 204


def test_delete_last_rule_returns_422():
    _reset_store()  # queda 1 sola regla
    rid = _store.data[BRAND][0].id
    r = client.delete(f"/brands/{BRAND}/rules/{rid}")
    assert r.status_code == 422


def test_rule_edit_forbidden_for_non_creador():
    _reset_store()
    rid = _store.data[BRAND][0].id
    app.dependency_overrides[get_current_user] = lambda: User(
        id="ap", email="ap@x.com", rol=Role.APROBADOR_A, activo=True
    )
    try:
        r = client.patch(
            f"/brands/{BRAND}/rules/{rid}",
            json={"categoria": "c", "texto": "x", "tipo": "OBLIGACION"},
        )
        assert r.status_code == 403
    finally:
        app.dependency_overrides[get_current_user] = lambda: User(
            id="cr", email="cr@x.com", rol=Role.CREADOR, activo=True
        )
