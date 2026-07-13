"""API REST del contexto Content Creation."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.contexts.content_creation.application.generate_content import GenerateContent
from app.contexts.content_creation.domain.models import Content
from app.contexts.content_creation.interfaces.deps import get_generate_content
from app.contexts.identity_access.domain.models import Action
from app.contexts.identity_access.interfaces.deps import require
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
