import pytest

from app.contexts.brand_identity.application.get_brand import GetBrand
from app.contexts.brand_identity.domain.models import (
    BrandManual,
    BrandParameters,
    BrandRule,
    RuleType,
)
from app.shared.errors import DomainError
from tests.fakes import InMemoryBrandManualRepo


def _repo() -> InMemoryBrandManualRepo:
    repo = InMemoryBrandManualRepo()
    repo.save(
        BrandManual(
            id="b1",
            parametros=BrandParameters("Snack", "Divertido", "Gen Z"),
            reglas=[BrandRule("tono", "Prohibido tecnicismos", RuleType.PROHIBICION)],
        )
    )
    return repo


def test_get_brand_returns_manual_with_rules():
    manual = GetBrand(_repo()).execute("b1")
    assert manual.id == "b1"
    assert manual.reglas[0].texto == "Prohibido tecnicismos"


def test_get_brand_unknown_raises():
    with pytest.raises(DomainError):
        GetBrand(_repo()).execute("fantasma")
