"""Integración real: Groq + Gemini embeddings + pgvector (Supabase).

Se salta si no hay credenciales. Marcado 'integration' para poder excluirlo
del CI rápido: pytest -m 'not integration'.
"""
import os
import uuid
from pathlib import Path

import pytest

pytestmark = pytest.mark.integration

_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


def _load_dotenv() -> dict[str, str]:
    values: dict[str, str] = {}
    if _ENV_FILE.exists():
        for line in _ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            values[k.strip()] = v.strip()
    return values


_REAL = _load_dotenv()
_HAS_CREDS = all(_REAL.get(k) for k in ("GROQ_API_KEY", "GOOGLE_API_KEY", "DATABASE_URL"))


@pytest.fixture(autouse=True)
def _real_env(monkeypatch):
    # conftest inyecta credenciales dummy; aquí forzamos las reales del .env.
    for k, v in _REAL.items():
        monkeypatch.setenv(k, v)
    from app.config import get_settings

    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.mark.skipif(not _HAS_CREDS, reason="faltan credenciales reales")
def test_generate_and_retrieve_end_to_end():
    from app.config import get_settings
    from app.contexts.brand_identity.application.generate_brand_manual import (
        GenerateBrandManual,
    )
    from app.contexts.brand_identity.application.retrieve_relevant_rules import (
        RetrieveRelevantRules,
    )
    from app.contexts.brand_identity.infrastructure.gemini_embedder import GeminiEmbedder
    from app.contexts.brand_identity.infrastructure.groq_text_llm import GroqTextLlm
    from app.contexts.brand_identity.infrastructure.pgvector_store import PgVectorStore
    from app.contexts.brand_identity.infrastructure.postgres_repo import (
        PostgresBrandManualRepo,
    )

    get_settings.cache_clear()
    brand_id = f"test-{uuid.uuid4().hex[:8]}"
    embedder = GeminiEmbedder()
    store = PgVectorStore(embedder)

    uc = GenerateBrandManual(
        llm=GroqTextLlm(json_mode=True),
        vector_store=store,
        repo=PostgresBrandManualRepo(),
        id_factory=lambda: brand_id,
    )
    manual = uc.execute(
        categoria="Snack saludable de quinua",
        tono="Divertido pero profesional",
        publico="Gen Z",
    )
    assert manual.id == brand_id
    assert len(manual.reglas) >= 1

    rules = RetrieveRelevantRules(store).execute(brand_id, "reglas de tono y voz", k=3)
    assert len(rules) >= 1
