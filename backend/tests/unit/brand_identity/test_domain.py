import pytest

from app.contexts.brand_identity.domain.models import (
    BrandManual,
    BrandParameters,
    BrandRule,
    RuleType,
    parse_rules,
)
from app.shared.errors import DomainError


def _params():
    return BrandParameters(categoria="Snack de quinua", tono="Divertido", publico="Gen Z")


def test_brand_parameters_rejects_empty_fields():
    with pytest.raises(DomainError):
        BrandParameters(categoria="", tono="Divertido", publico="Gen Z")
    with pytest.raises(DomainError):
        BrandParameters(categoria="X", tono="  ", publico="Gen Z")


def test_brand_manual_requires_at_least_one_rule():
    with pytest.raises(DomainError):
        BrandManual(id="1", parametros=_params(), reglas=[])


def test_brand_rule_rejects_empty_text():
    with pytest.raises(DomainError):
        BrandRule(categoria="tono", texto="", tipo=RuleType.PROHIBICION)


def test_parse_rules_maps_json_to_rules():
    raw = '[{"categoria":"tono","texto":"Prohibido tecnicismos","tipo":"PROHIBICION"}]'
    rules = parse_rules(raw)
    assert len(rules) == 1
    assert rules[0].tipo is RuleType.PROHIBICION


def test_parse_rules_unwraps_object_with_reglas():
    raw = '{"reglas":[{"categoria":"tono","texto":"Sé breve","tipo":"OBLIGACION"}]}'
    rules = parse_rules(raw)
    assert len(rules) == 1
    assert rules[0].texto == "Sé breve"


def test_parse_rules_rejects_malformed_json():
    with pytest.raises(DomainError):
        parse_rules("no soy json")
