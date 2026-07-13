from app.contexts.brand_identity.application.list_brands import ListBrands
from app.contexts.brand_identity.domain.models import (
    BrandManual,
    BrandParameters,
    BrandRule,
    RuleType,
)
from tests.fakes import InMemoryBrandManualRepo


def _manual(bid: str) -> BrandManual:
    return BrandManual(
        id=bid,
        parametros=BrandParameters("Snack", "Divertido", "Gen Z"),
        reglas=[BrandRule("tono", "regla", RuleType.RECOMENDACION)],
    )


def test_list_brands_returns_all():
    repo = InMemoryBrandManualRepo()
    repo.save(_manual("b1"))
    repo.save(_manual("b2"))

    result = ListBrands(repo).execute()

    assert {s.id for s in result} == {"b1", "b2"}
    assert result[0].parametros.categoria == "Snack"
