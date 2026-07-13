import pytest

from app.contexts.brand_identity.domain.models import (
    BrandManual,
    BrandParameters,
    BrandRule,
    RuleType,
)
from app.contexts.content_creation.application.generate_content import GenerateContent
from app.shared.errors import DomainError
from tests.fakes import (
    FakeTextLlm,
    InMemoryBrandManualRepo,
    InMemoryContentRepo,
    InMemoryVectorStore,
)

_RULE = BrandRule("tono", "Prohibido usar tecnicismos", RuleType.PROHIBICION)


def _wire(llm=None):
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
    content_repo = InMemoryContentRepo()
    uc = GenerateContent(
        llm=llm or FakeTextLlm("Un texto de producto cercano"),
        vector_store=store,
        brand_repo=brand_repo,
        content_repo=content_repo,
        id_factory=lambda: "c1",
    )
    return uc, content_repo


def test_generate_content_retrieves_rules_and_injects_them():
    llm = FakeTextLlm("Un texto de producto cercano")
    uc, repo = _wire(llm=llm)

    content = uc.execute(
        brand_id="b1", tipo="DESCRIPCION", brief="describe el producto sin tecnicismos"
    )

    # El prompt enviado al LLM incluye la regla recuperada del RAG
    assert "tecnicismos" in llm.calls[0].lower()
    # El contenido nace PENDIENTE y registra las reglas aplicadas
    assert content.estado == "PENDIENTE"
    assert any("tecnicismos" in r for r in content.reglas_aplicadas)
    assert repo.get("c1") is content


def test_generate_content_unknown_brand_raises_without_calling_llm():
    llm = FakeTextLlm("x")
    store = InMemoryVectorStore()
    uc = GenerateContent(
        llm=llm,
        vector_store=store,
        brand_repo=InMemoryBrandManualRepo(),  # vacío
        content_repo=InMemoryContentRepo(),
        id_factory=lambda: "c1",
    )
    with pytest.raises(DomainError):
        uc.execute(brand_id="fantasma", tipo="DESCRIPCION", brief="algo")
    assert llm.calls == []


def test_generate_content_invalid_type_raises():
    uc, _ = _wire()
    with pytest.raises(DomainError):
        uc.execute(brand_id="b1", tipo="TWEET", brief="algo")


def test_generate_content_records_author():
    uc, _ = _wire()
    content = uc.execute(
        brand_id="b1", tipo="DESCRIPCION", brief="algo", created_by="user-42"
    )
    assert content.created_by == "user-42"
