"""Casos de uso de lectura de contenido (colas y detalle del frontend)."""
from app.contexts.content_creation.domain.models import Content
from app.contexts.content_creation.domain.ports import ContentRepository
from app.shared.errors import DomainError


class ListContent:
    def __init__(self, content_repo: ContentRepository):
        self._repo = content_repo

    def execute(self, estado: str | None = None) -> list[Content]:
        return self._repo.list(estado)


class GetContent:
    def __init__(self, content_repo: ContentRepository):
        self._repo = content_repo

    def execute(self, content_id: str) -> Content:
        content = self._repo.get(content_id)
        if content is None:
            raise DomainError(f"El contenido '{content_id}' no existe")
        return content
