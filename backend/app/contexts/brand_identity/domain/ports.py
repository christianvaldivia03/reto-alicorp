"""Puertos (interfaces) del contexto Brand Identity. La infraestructura
los implementa; el dominio no conoce Groq, Gemini ni Postgres."""
from typing import Optional, Protocol

from app.contexts.brand_identity.domain.models import BrandManual, BrandRule


class TextLlmPort(Protocol):
    def generate(self, prompt: str) -> str: ...


class VectorStorePort(Protocol):
    def index(self, brand_id: str, rules: list[BrandRule]) -> None: ...
    def query(self, brand_id: str, text: str, k: int = 5) -> list[BrandRule]: ...


class BrandManualRepository(Protocol):
    def save(self, manual: BrandManual) -> None: ...
    def get(self, brand_id: str) -> Optional[BrandManual]: ...
