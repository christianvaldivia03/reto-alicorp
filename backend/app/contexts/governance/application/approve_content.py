"""Casos de uso del flujo de aprobación de contenido (Aprobador A).

Las invariantes de estado (solo desde PENDIENTE) viven en el agregado Content;
aquí solo se coordina cargar → transicionar → persistir.
"""
from app.contexts.content_creation.domain.models import Content
from app.contexts.content_creation.domain.ports import ContentRepository
from app.shared.errors import DomainError


def _load(repo: ContentRepository, content_id: str) -> Content:
    content = repo.get(content_id)
    if content is None:
        raise DomainError(f"El contenido '{content_id}' no existe")
    return content


class ApproveContent:
    def __init__(self, content_repo: ContentRepository):
        self._repo = content_repo

    def execute(self, content_id: str) -> Content:
        content = _load(self._repo, content_id)
        content.aprobar()
        self._repo.save(content)
        return content


class RejectContent:
    def __init__(self, content_repo: ContentRepository):
        self._repo = content_repo

    def execute(self, content_id: str, motivo: str) -> Content:
        content = _load(self._repo, content_id)
        content.rechazar(motivo)
        self._repo.save(content)
        return content
