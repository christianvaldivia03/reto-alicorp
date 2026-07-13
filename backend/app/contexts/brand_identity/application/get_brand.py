"""Caso de uso: obtener el manual completo de una marca (con todas sus reglas)."""
from app.contexts.brand_identity.domain.models import BrandManual
from app.contexts.brand_identity.domain.ports import BrandManualRepository
from app.shared.errors import DomainError


class GetBrand:
    def __init__(self, brand_repo: BrandManualRepository):
        self._repo = brand_repo

    def execute(self, brand_id: str) -> BrandManual:
        manual = self._repo.get(brand_id)
        if manual is None:
            raise DomainError(f"La marca '{brand_id}' no existe")
        return manual
