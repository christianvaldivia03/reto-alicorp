import pytest
from pydantic import ValidationError

from app.config import Settings


def test_config_loads_required_env():
    s = Settings()
    assert s.groq_api_key == "dummy"
    assert s.app_env == "local"


def test_config_fails_fast_when_missing_required_env(monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    with pytest.raises(ValidationError):
        # _env_file=None evita que lea un .env real y "rescate" la variable
        Settings(_env_file=None)
