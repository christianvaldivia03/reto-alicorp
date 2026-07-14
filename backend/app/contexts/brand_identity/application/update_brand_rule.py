"""Casos de uso de reglas del manual: editar, añadir y eliminar. Todas las
operaciones que cambian el texto recalculan el embedding (RAG coherente)."""
from app.contexts.brand_identity.domain.models import BrandRule, RuleType
from app.contexts.brand_identity.domain.ports import VectorStorePort


class UpdateBrandRule:
    def __init__(self, vector_store: VectorStorePort):
        self._store = vector_store

    def execute(
        self, brand_id: str, rule_id: int, categoria: str, texto: str, tipo: str
    ) -> BrandRule:
        # Construir el Value Object valida en el borde (texto no vacío, tipo válido)
        # antes de gastar una llamada de embeddings.
        rule = BrandRule(categoria=categoria.strip(), texto=texto.strip(), tipo=RuleType(tipo))
        return self._store.update_rule(brand_id, rule_id, rule)


class AddBrandRule:
    def __init__(self, vector_store: VectorStorePort):
        self._store = vector_store

    def execute(self, brand_id: str, categoria: str, texto: str, tipo: str) -> BrandRule:
        rule = BrandRule(categoria=categoria.strip(), texto=texto.strip(), tipo=RuleType(tipo))
        return self._store.add_rule(brand_id, rule)


class DeleteBrandRule:
    def __init__(self, vector_store: VectorStorePort):
        self._store = vector_store

    def execute(self, brand_id: str, rule_id: int) -> None:
        self._store.delete_rule(brand_id, rule_id)
