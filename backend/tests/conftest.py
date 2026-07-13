import os

import pytest

# Env mínimo para que la app arranque en tests sin credenciales reales.
_DUMMY_ENV = {
    "SUPABASE_URL": "http://localhost",
    "SUPABASE_SERVICE_ROLE_KEY": "dummy",
    "DATABASE_URL": "postgresql://localhost/test",
    "GROQ_API_KEY": "dummy",
    "GOOGLE_API_KEY": "dummy",
}


@pytest.fixture(autouse=True)
def _set_env(monkeypatch):
    for k, v in _DUMMY_ENV.items():
        monkeypatch.setenv(k, v)
    # get_settings() cachea; limpiar entre tests
    from app.config import get_settings

    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
