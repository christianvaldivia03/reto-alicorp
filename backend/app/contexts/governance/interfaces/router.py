"""API REST de Governance: aprobación (Aprobador A) y auditoría multimodal
(Aprobador B)."""
import httpx
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.contexts.content_creation.domain.models import Content
from app.contexts.governance.application.approve_content import (
    ApproveContent,
    RejectContent,
)
from app.contexts.governance.application.audit_image import AuditImage
from app.contexts.governance.domain.models import AuditReport
from app.contexts.governance.interfaces.deps import (
    get_approve_content,
    get_audit_image,
    get_reject_content,
)
from app.contexts.identity_access.domain.models import Action
from app.contexts.identity_access.interfaces.deps import require
from app.shared.errors import DomainError

router = APIRouter(prefix="/content", tags=["governance"])


class RejectIn(BaseModel):
    motivo: str


class ContentStateOut(BaseModel):
    id: str
    estado: str
    motivo: str | None

    @staticmethod
    def of(c: Content) -> "ContentStateOut":
        return ContentStateOut(id=c.id, estado=c.estado, motivo=c.motivo)


class AuditOut(BaseModel):
    id: str
    content_id: str
    veredicto: str
    motivo: str
    reglas_evaluadas: list[str]

    @staticmethod
    def of(r: AuditReport) -> "AuditOut":
        return AuditOut(
            id=r.id,
            content_id=r.content_id,
            veredicto=r.veredicto.value,
            motivo=r.motivo,
            reglas_evaluadas=r.reglas_evaluadas,
        )


@router.post(
    "/{content_id}/approve",
    response_model=ContentStateOut,
    dependencies=[Depends(require(Action.APPROVE_CONTENT))],
)
def approve(content_id: str, uc: ApproveContent = Depends(get_approve_content)) -> ContentStateOut:
    try:
        return ContentStateOut.of(uc.execute(content_id))
    except DomainError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post(
    "/{content_id}/reject",
    response_model=ContentStateOut,
    dependencies=[Depends(require(Action.APPROVE_CONTENT))],
)
def reject(
    content_id: str, body: RejectIn, uc: RejectContent = Depends(get_reject_content)
) -> ContentStateOut:
    try:
        return ContentStateOut.of(uc.execute(content_id, body.motivo))
    except DomainError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post(
    "/{content_id}/audit",
    response_model=AuditOut,
    dependencies=[Depends(require(Action.AUDIT_IMAGE))],
)
async def audit(
    content_id: str,
    image: UploadFile = File(...),
    uc: AuditImage = Depends(get_audit_image),
) -> AuditOut:
    data = await image.read()
    try:
        report = uc.execute(content_id, data, image.content_type or "image/png")
    except DomainError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except httpx.HTTPStatusError as e:
        # Falla del modelo de visión (p. ej. 429 rate limit) → error upstream.
        raise HTTPException(status_code=502, detail=f"Modelo de visión no disponible: {e.response.status_code}")
    return AuditOut.of(report)
