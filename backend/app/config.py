from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración cargada del entorno. Los campos sin default son
    obligatorios: si faltan, la app falla al arrancar (fail-fast)."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "local"

    # Obligatorias (sin default) — Supabase y modelo de texto (Fase 1)
    supabase_url: str
    supabase_service_role_key: str
    database_url: str
    groq_api_key: str

    # Modelo de texto (Groq)
    groq_model: str = "llama-3.3-70b-versatile"

    # Gemini — embeddings (Fase 1) y visión (Fase 4)
    google_api_key: str = ""
    embedding_model: str = "gemini-embedding-001"
    embedding_dim: int = 768
    vision_model: str = "gemini-flash-lite-latest"

    # Auth (Fase 3) — firmar/verificar JWT. En prod, definir por entorno.
    jwt_secret: str = "dev-secret-change-me"
    jwt_ttl_min: int = 120

    # Langfuse (Fase 5) — opcional hasta entonces
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""
    langfuse_host: str = "https://cloud.langfuse.com"


@lru_cache
def get_settings() -> Settings:
    return Settings()
