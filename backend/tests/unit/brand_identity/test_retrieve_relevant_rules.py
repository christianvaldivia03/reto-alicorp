from app.contexts.brand_identity.application.retrieve_relevant_rules import (
    RetrieveRelevantRules,
)
from app.contexts.brand_identity.domain.models import BrandRule, RuleType
from tests.fakes import InMemoryVectorStore


def _rules():
    return [
        BrandRule("tono", "Prohibido usar tecnicismos", RuleType.PROHIBICION),
        BrandRule("color", "Usar siempre el verde corporativo", RuleType.OBLIGACION),
        BrandRule("voz", "Hablar cercano y juvenil", RuleType.RECOMENDACION),
    ]


def test_retrieve_relevant_rules_returns_topk():
    store = InMemoryVectorStore()
    store.index("brand-1", _rules())
    uc = RetrieveRelevantRules(vector_store=store)

    result = uc.execute(brand_id="brand-1", query="puedo usar tecnicismos?", k=1)

    assert len(result) == 1
    assert result[0].texto == "Prohibido usar tecnicismos"


def test_retrieve_returns_empty_when_no_match():
    store = InMemoryVectorStore()
    store.index("brand-1", _rules())
    uc = RetrieveRelevantRules(vector_store=store)

    assert uc.execute(brand_id="brand-1", query="xyzzy", k=5) == []
