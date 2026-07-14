"""Casos de uso de reglas: añadir, editar y eliminar. Se verifica no solo el
resultado sino que la regla quede EMBEBIDA en el RAG (recuperable por query),
que es el invariante que da valor a la edición."""
import pytest

from app.contexts.brand_identity.application.update_brand_rule import (
    AddBrandRule,
    DeleteBrandRule,
    UpdateBrandRule,
)
from app.contexts.brand_identity.domain.models import BrandRule, RuleType
from app.shared.errors import DomainError
from tests.fakes import InMemoryVectorStore

BRAND = "brand-1"


def _store_with_rules(*textos: str) -> InMemoryVectorStore:
    store = InMemoryVectorStore()
    store.index(BRAND, [BrandRule("cat", t, RuleType.RECOMENDACION) for t in textos])
    return store


# --- Añadir -----------------------------------------------------------------
def test_add_rule_returns_rule_with_id():
    store = _store_with_rules("regla base")
    rule = AddBrandRule(store).execute(BRAND, "Empaque", "Usar empaques reciclables", "OBLIGACION")
    assert rule.id is not None
    assert rule.tipo is RuleType.OBLIGACION


def test_add_rule_is_embedded_in_rag():
    """La regla añadida debe quedar indexada y ser recuperable por similitud."""
    store = _store_with_rules("regla base")
    AddBrandRule(store).execute(BRAND, "Empaque", "Usar empaques reciclables", "OBLIGACION")
    recovered = store.query(BRAND, "empaques reciclables", k=1)
    assert recovered and recovered[0].texto == "Usar empaques reciclables"
    assert store.add_calls == [BRAND]  # pasó por el índice del RAG


def test_add_rule_rejects_empty_text():
    store = _store_with_rules("regla base")
    with pytest.raises(DomainError):
        AddBrandRule(store).execute(BRAND, "cat", "   ", "OBLIGACION")


def test_add_rule_rejects_invalid_tipo():
    store = _store_with_rules("regla base")
    with pytest.raises(ValueError):
        AddBrandRule(store).execute(BRAND, "cat", "texto", "INVENTADO")


# --- Editar -----------------------------------------------------------------
def test_update_rule_reembeds_new_text():
    store = _store_with_rules("texto viejo sobre logotipo")
    rule_id = store.data[BRAND][0].id
    UpdateBrandRule(store).execute(BRAND, rule_id, "Colores", "Usar siempre verde y amarillo", "OBLIGACION")
    # El nuevo texto se recupera; el viejo ya no.
    assert store.query(BRAND, "verde y amarillo", k=1)[0].texto == "Usar siempre verde y amarillo"
    assert store.query(BRAND, "logotipo", k=1) == []
    assert store.update_calls == [(BRAND, rule_id)]


def test_update_rule_rejects_empty_text():
    store = _store_with_rules("texto")
    rid = store.data[BRAND][0].id
    with pytest.raises(DomainError):
        UpdateBrandRule(store).execute(BRAND, rid, "cat", "", "OBLIGACION")


def test_update_missing_rule_raises():
    store = _store_with_rules("texto")
    with pytest.raises(DomainError):
        UpdateBrandRule(store).execute(BRAND, 9999, "cat", "nuevo", "OBLIGACION")


# --- Eliminar ---------------------------------------------------------------
def test_delete_rule_removes_from_rag():
    store = _store_with_rules("regla A sobre precio", "regla B sobre color")
    rid = store.data[BRAND][0].id
    DeleteBrandRule(store).execute(BRAND, rid)
    assert store.query(BRAND, "precio", k=1) == []
    assert len(store.data[BRAND]) == 1


def test_delete_last_rule_is_rejected():
    """Una marca no puede quedarse sin reglas (invariante del agregado)."""
    store = _store_with_rules("única regla")
    rid = store.data[BRAND][0].id
    with pytest.raises(DomainError):
        DeleteBrandRule(store).execute(BRAND, rid)


def test_delete_missing_rule_raises():
    store = _store_with_rules("a", "b")
    with pytest.raises(DomainError):
        DeleteBrandRule(store).execute(BRAND, 9999)
