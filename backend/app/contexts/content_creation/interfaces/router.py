"""API REST del contexto Content Creation."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.contexts.content_creation.application.generate_content import GenerateContent
from app.contexts.content_creation.application.list_content import GetContent, ListContent
from app.contexts.content_creation.domain.models import Content
from app.contexts.content_creation.interfaces.deps import (
    get_generate_content,
    get_get_content,
    get_list_content,
)
from app.contexts.identity_access.domain.models import Action
from app.contexts.identity_access.interfaces.deps import get_current_user, require
from app.shared.errors import DomainError

router = APIRouter(prefix="/content", tags=["content-creation"])


class GenerateContentIn(BaseModel):
    brand_id: str
    tipo: str  # DESCRIPCION | GUION | PROMPT_IMAGEN
    brief: str


class ContentOut(BaseModel):
    id: str
    brand_id: str
    tipo: str
    texto: str
    estado: str
    reglas_aplicadas: list[str]

    @staticmethod
    def of(c: Content) -> "ContentOut":
        return ContentOut(
            id=c.id,
            brand_id=c.brand_id,
            tipo=c.tipo.value,
            texto=c.texto,
            estado=c.estado,
            reglas_aplicadas=c.reglas_aplicadas,
        )


class ContentDetailOut(ContentOut):
    motivo: str | None = None

    @staticmethod
    def of(c: Content) -> "ContentDetailOut":
        return ContentDetailOut(
            id=c.id,
            brand_id=c.brand_id,
            tipo=c.tipo.value,
            texto=c.texto,
            estado=c.estado,
            reglas_aplicadas=c.reglas_aplicadas,
            motivo=c.motivo,
        )


@router.post(
    "",
    status_code=201,
    response_model=ContentOut,
    dependencies=[Depends(require(Action.GENERATE_CONTENT))],
)
def generate_content(
    body: GenerateContentIn, uc: GenerateContent = Depends(get_generate_content)
) -> ContentOut:
    try:
        content = uc.execute(body.brand_id, body.tipo, body.brief)
    except DomainError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return ContentOut.of(content)


@router.get("", response_model=list[ContentOut], dependencies=[Depends(get_current_user)])
def list_content(
    estado: str | None = None, uc: ListContent = Depends(get_list_content)
) -> list[ContentOut]:
    return [ContentOut.of(c) for c in uc.execute(estado)]


@router.get(
    "/{content_id}",
    response_model=ContentDetailOut,
    dependencies=[Depends(get_current_user)],
)
def get_content(
    content_id: str, uc: GetContent = Depends(get_get_content)
) -> ContentDetailOut:
    try:
        return ContentDetailOut.of(uc.execute(content_id))
    except DomainError:
        raise HTTPException(status_code=404, detail="Contenido no encontrado")
