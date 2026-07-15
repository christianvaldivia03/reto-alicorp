import pytest

from app.contexts.brand_identity.application.generate_brand_manual import (
    GenerateBrandManual,
    build_manual_prompt,
)
from app.contexts.brand_identity.domain.models import BrandParameters
from app.shared.errors import DomainError
from tests.fakes import FakeTextLlm, InMemoryBrandManualRepo, InMemoryVectorStore

_LLM_JSON = (
    '[{"categoria":"tono","texto":"Prohibido usar tecnicismos","tipo":"PROHIBICION"},'
    '{"categoria":"voz","texto":"Hablar cercano y juvenil","tipo":"RECOMENDACION"}]'
)


def _use_case(llm=None):
    return GenerateBrandManual(
        llm=llm or FakeTextLlm(_LLM_JSON),
        vector_store=InMemoryVectorStore(),
        repo=InMemoryBrandManualRepo(),
        id_factory=lambda: "brand-1",
    )


def test_generate_brand_manual_persists_and_indexes():
    llm = FakeTextLlm(_LLM_JSON)
    store = InMemoryVectorStore()
    repo = InMemoryBrandManualRepo()
    uc = GenerateBrandManual(llm=llm, vector_store=store, repo=repo, id_factory=lambda: "brand-1")

    manual = uc.execute(nombre="Quinua Pop", categoria="Snack de quinua", tono="Divertido", publico="Gen Z")

    assert manual.id == "brand-1"
    assert manual.parametros.nombre == "Quinua Pop"
    assert len(manual.reglas) == 2
    assert repo.get("brand-1") is manual          # persistido
    assert store.index_calls == ["brand-1"]        # indexado en el vector store


def test_prompt_includes_extra_parameters():
    """Los parámetros extra (dinámicos) deben llegar al prompt del LLM."""
    p = BrandParameters(
        categoria="Snack de quinua",
        tono="Divertido",
        publico="Gen Z",
        extras={"Región": "Perú", "Presupuesto": "Bajo"},
    )
    prompt = build_manual_prompt(p)
    assert "Región: Perú" in prompt
    assert "Presupuesto: Bajo" in prompt


def test_generate_passes_extras_to_llm():
    llm = FakeTextLlm(_LLM_JSON)
    uc = GenerateBrandManual(
        llm=llm, vector_store=InMemoryVectorStore(),
        repo=InMemoryBrandManualRepo(), id_factory=lambda: "brand-1",
    )
    uc.execute("Marca X", "Snack", "Divertido", "Gen Z", extras={"Canal": "TikTok"})
    assert "Canal: TikTok" in llm.calls[0]


def test_generate_allows_only_nombre():
    # Señales opcionales: con sólo el nombre, el manual se genera igual.
    llm = FakeTextLlm(_LLM_JSON)
    uc = GenerateBrandManual(
        llm=llm, vector_store=InMemoryVectorStore(),
        repo=InMemoryBrandManualRepo(), id_factory=lambda: "brand-1",
    )
    manual = uc.execute(nombre="Marca X")
    assert manual.parametros.nombre == "Marca X"
    assert len(llm.calls) == 1


def test_generate_requires_nombre():
    llm = FakeTextLlm(_LLM_JSON)
    uc = GenerateBrandManual(
        llm=llm, vector_store=InMemoryVectorStore(),
        repo=InMemoryBrandManualRepo(), id_factory=lambda: "brand-1",
    )
    with pytest.raises(DomainError):
        uc.execute(nombre="  ", categoria="Snack", tono="Divertido", publico="Gen Z")
    assert llm.calls == []   # sin nombre no se llama al LLM


def test_generate_rejects_duplicate_nombre():
    """El nombre es único (case-insensitive)."""
    llm = FakeTextLlm(_LLM_JSON)
    repo = InMemoryBrandManualRepo()
    store = InMemoryVectorStore()
    ids = iter(["brand-1", "brand-2"])
    uc = GenerateBrandManual(llm=llm, vector_store=store, repo=repo, id_factory=lambda: next(ids))

    uc.execute(nombre="Quinua Pop", categoria="Snack", tono="Divertido", publico="Gen Z")
    with pytest.raises(DomainError):
        uc.execute(nombre="quinua pop", categoria="Otro", tono="Serio", publico="Adultos")
