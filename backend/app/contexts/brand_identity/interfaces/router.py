"""API REST del contexto Brand Identity."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.contexts.brand_identity.application.generate_brand_manual import (
    GenerateBrandManual,
)
from app.contexts.identity_access.domain.models import Action
from app.contexts.identity_access.interfaces.deps import require
from app.contexts.brand_identity.application.retrieve_relevant_rules import (
    RetrieveRelevantRules,
)
from app.contexts.brand_identity.domain.models import BrandManual, BrandRule
from app.contexts.brand_identity.interfaces.deps import (
    get_generate_manual,
    get_retrieve_rules,
)
from app.shared.errors import DomainError

router = APIRouter(prefix="/brands", tags=["brand-identity"])


class CreateBrandIn(BaseModel):
    categoria: str
    tono: str
    publico: str


class RuleOut(BaseModel):
    categoria: str
    texto: str
    tipo: str

    @staticmethod
    def of(r: BrandRule) -> "RuleOut":
        return RuleOut(categoria=r.categoria, texto=r.texto, tipo=r.tipo.value)


class BrandOut(BaseModel):
    id: str
    estado: str
    reglas: list[RuleOut]

    @staticmethod
    def of(m: BrandManual) -> "BrandOut":
        return BrandOut(id=m.id, estado=m.estado, reglas=[RuleOut.of(r) for r in m.reglas])


@router.post(
    "",
    status_code=201,
    response_model=BrandOut,
    dependencies=[Depends(require(Action.CREATE_BRAND))],
)
def create_brand(
    body: CreateBrandIn, uc: GenerateBrandManual = Depends(get_generate_manual)
) -> BrandOut:
    try:
        manual = uc.execute(body.categoria, body.tono, body.publico)
    except DomainError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return BrandOut.of(manual)


@router.get("/{brand_id}/rules", response_model=list[RuleOut])
def get_rules(
    brand_id: str,
    query: str,
    k: int = 5,
    uc: RetrieveRelevantRules = Depends(get_retrieve_rules),
) -> list[RuleOut]:
    return [RuleOut.of(r) for r in uc.execute(brand_id, query, k)]
