"""Puertos del contexto Content Creation."""
from typing import Optional, Protocol

from app.contexts.content_creation.domain.models import Content


class ContentRepository(Protocol):
    def save(self, content: Content) -> None: ...
    def get(self, content_id: str) -> Optional[Content]: ...
