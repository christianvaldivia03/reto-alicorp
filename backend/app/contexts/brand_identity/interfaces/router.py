"""API REST del contexto Brand Identity."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.contexts.brand_identity.application.generate_brand_manual import (
    GenerateBrandManual,
)
from app.contexts.identity_access.domain.models import Action
from app.contexts.identity_access.interfaces.deps import get_current_user, require
from app.contexts.brand_identity.application.get_brand import GetBrand
from app.contexts.brand_identity.application.list_brands import ListBrands
from app.contexts.brand_identity.application.retrieve_relevant_rules import (
    RetrieveRelevantRules,
)
from app.contexts.brand_identity.domain.models import BrandManual, BrandRule, BrandSummary
from app.contexts.brand_identity.application.update_brand_rule import (
    AddBrandRule,
    DeleteBrandRule,
    UpdateBrandRule,
)
from app.contexts.brand_identity.interfaces.deps import (
    get_add_rule,
    get_delete_rule,
    get_generate_manual,
    get_get_brand,
    get_list_brands,
    get_retrieve_rules,
    get_update_rule,
)
from app.shared.errors import DomainError

router = APIRouter(prefix="/brands", tags=["brand-identity"])


class CreateBrandIn(BaseModel):
    nombre: str
    # Sólo el nombre es obligatorio; el resto son señales dinámicas opcionales.
    categoria: str = ""
    tono: str = ""
    publico: str = ""
    # Parámetros dinámicos opcionales (label -> valor) que el usuario añade.
    extras: dict[str, str] = {}


class RuleOut(BaseModel):
    id: int | None = None
    categoria: str
    texto: str
    tipo: str

    @staticmethod
    def of(r: BrandRule) -> "RuleOut":
        return RuleOut(id=r.id, categoria=r.categoria, texto=r.texto, tipo=r.tipo.value)


class UpdateRuleIn(BaseModel):
    categoria: str
    texto: str
    tipo: str


class BrandOut(BaseModel):
    id: str
    nombre: str
    estado: str
    reglas: list[RuleOut]

    @staticmethod
    def of(m: BrandManual) -> "BrandOut":
        return BrandOut(
            id=m.id,
            nombre=m.parametros.nombre,
            estado=m.estado,
            reglas=[RuleOut.of(r) for r in m.reglas],
        )


class BrandSummaryOut(BaseModel):
    id: str
    nombre: str
    categoria: str
    tono: str
    publico: str

    @staticmethod
    def of(s: BrandSummary) -> "BrandSummaryOut":
        return BrandSummaryOut(
            id=s.id,
            nombre=s.parametros.nombre,
            categoria=s.parametros.categoria,
            tono=s.parametros.tono,
            publico=s.parametros.publico,
        )


@router.get(
    "",
    response_model=list[BrandSummaryOut],
    dependencies=[Depends(get_current_user)],
)
def list_brands(uc: ListBrands = Depends(get_list_brands)) -> list[BrandSummaryOut]:
    return [BrandSummaryOut.of(s) for s in uc.execute()]


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
        manual = uc.execute(body.nombre, body.categoria, body.tono, body.publico, extras=body.extras)
    except DomainError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return BrandOut.of(manual)


@router.get("/{brand_id}", response_model=BrandOut, dependencies=[Depends(get_current_user)])
def get_brand(brand_id: str, uc: GetBrand = Depends(get_get_brand)) -> BrandOut:
    try:
        return BrandOut.of(uc.execute(brand_id))
    except DomainError:
        raise HTTPException(status_code=404, detail="Marca no encontrada")


@router.patch(
    "/{brand_id}/rules/{rule_id}",
    response_model=RuleOut,
    dependencies=[Depends(require(Action.CREATE_BRAND))],
)
def update_rule(
    brand_id: str,
    rule_id: int,
    body: UpdateRuleIn,
    uc: UpdateBrandRule = Depends(get_update_rule),
) -> RuleOut:
    try:
        rule = uc.execute(brand_id, rule_id, body.categoria, body.texto, body.tipo)
    except DomainError as e:
        # "Regla no encontrada" → 404; validaciones de dominio → 422.
        if "no encontrada" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=422, detail=str(e))
    return RuleOut.of(rule)


@router.post(
    "/{brand_id}/rules",
    status_code=201,
    response_model=RuleOut,
    dependencies=[Depends(require(Action.CREATE_BRAND))],
)
def add_rule(
    brand_id: str, body: UpdateRuleIn, uc: AddBrandRule = Depends(get_add_rule)
) -> RuleOut:
    try:
        rule = uc.execute(brand_id, body.categoria, body.texto, body.tipo)
    except DomainError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return RuleOut.of(rule)


@router.delete(
    "/{brand_id}/rules/{rule_id}",
    status_code=204,
    dependencies=[Depends(require(Action.CREATE_BRAND))],
)
def delete_rule(
    brand_id: str, rule_id: int, uc: DeleteBrandRule = Depends(get_delete_rule)
) -> None:
    try:
        uc.execute(brand_id, rule_id)
    except DomainError as e:
        # "Regla no encontrada" → 404; invariante (última regla) → 422.
        if "no encontrada" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=422, detail=str(e))


@router.get("/{brand_id}/rules", response_model=list[RuleOut])
def get_rules(
    brand_id: str,
    query: str,
    k: int = 5,
    uc: RetrieveRelevantRules = Depends(get_retrieve_rules),
) -> list[RuleOut]:
    return [RuleOut.of(r) for r in uc.execute(brand_id, query, k)]
