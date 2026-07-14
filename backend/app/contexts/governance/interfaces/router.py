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
from app.contexts.governance.application.list_audits import ListAudits
from app.contexts.governance.domain.models import AuditReport
from app.contexts.governance.interfaces.deps import (
    get_approve_content,
    get_audit_image,
    get_list_audits,
    get_reject_content,
)
from app.contexts.identity_access.domain.models import Action, User
from app.contexts.identity_access.interfaces.deps import get_current_user, require
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
    brand_id: str
    veredicto: str
    motivo: str
    reglas_evaluadas: list[str]
    actor_email: str | None = None
    created_at: str | None = None

    @staticmethod
    def of(r: AuditReport) -> "AuditOut":
        return AuditOut(
            id=r.id,
            content_id=r.content_id,
            brand_id=r.brand_id,
            veredicto=r.veredicto.value,
            motivo=r.motivo,
            reglas_evaluadas=r.reglas_evaluadas,
            actor_email=r.actor_email,
            created_at=r.created_at,
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


@router.get(
    "/{content_id}/audits",
    response_model=list[AuditOut],
    dependencies=[Depends(get_current_user)],
)
def list_audits(
    content_id: str, uc: ListAudits = Depends(get_list_audits)
) -> list[AuditOut]:
    return [AuditOut.of(r) for r in uc.execute(content_id)]


@router.post("/{content_id}/audit", response_model=AuditOut)
async def audit(
    content_id: str,
    image: UploadFile = File(...),
    actor: User = Depends(require(Action.AUDIT_IMAGE)),
    uc: AuditImage = Depends(get_audit_image),
) -> AuditOut:
    data = await image.read()
    try:
        report = uc.execute(content_id, data, image.content_type or "image/png", actor_id=actor.id)
    except DomainError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except httpx.HTTPStatusError as e:
        # Falla del modelo de visión (p. ej. 429 rate limit) → error upstream.
        raise HTTPException(status_code=502, detail=f"Modelo de visión no disponible: {e.response.status_code}")
    return AuditOut.of(report)
