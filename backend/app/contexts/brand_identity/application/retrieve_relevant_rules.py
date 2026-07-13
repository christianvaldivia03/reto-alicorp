"""Caso de uso: recuperar del RAG las reglas relevantes para una consulta."""
from app.contexts.brand_identity.domain.models import BrandRule
from app.contexts.brand_identity.domain.ports import VectorStorePort


class RetrieveRelevantRules:
    def __init__(self, vector_store: VectorStorePort):
        self._store = vector_store

    def execute(self, brand_id: str, query: str, k: int = 5) -> list[BrandRule]:
        return self._store.query(brand_id, query, k)
