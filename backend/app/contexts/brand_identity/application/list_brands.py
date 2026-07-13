"""Caso de uso: listar las marcas (vista ligera para el selector del frontend)."""
from app.contexts.brand_identity.domain.models import BrandSummary
from app.contexts.brand_identity.domain.ports import BrandManualRepository


class ListBrands:
    def __init__(self, brand_repo: BrandManualRepository):
        self._repo = brand_repo

    def execute(self) -> list[BrandSummary]:
        return self._repo.list_all()
