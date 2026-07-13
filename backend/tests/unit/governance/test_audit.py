import pytest

from app.contexts.brand_identity.domain.models import BrandRule, RuleType
from app.contexts.content_creation.domain.models import Content, ContentType
from app.contexts.governance.application.audit_image import AuditImage
from app.contexts.governance.domain.models import Verdict
from app.shared.errors import DomainError
from tests.fakes import (
    FakeVision,
    InMemoryAuditReportRepo,
    InMemoryContentRepo,
    InMemoryVectorStore,
)

_RULE = BrandRule("logo", "El logo debe ocupar al menos 20% del arte", RuleType.OBLIGACION)


def _wire(vision):
    content_repo = InMemoryContentRepo()
    content_repo.save(Content(id="c1", brand_id="b1", tipo=ContentType.PROMPT_IMAGEN, texto="x"))
    store = InMemoryVectorStore()
    store.index("b1", [_RULE])
    reports = InMemoryAuditReportRepo()
    uc = AuditImage(
        vision=vision,
        vector_store=store,
        content_repo=content_repo,
        report_repo=reports,
        id_factory=lambda: "r1",
    )
    return uc, reports


def test_audit_image_cumple():
    uc, reports = _wire(FakeVision(veredicto="CUMPLE"))
    report = uc.execute(content_id="c1", image=b"img", mime="image/png")
    assert report.veredicto is Verdict.CUMPLE
    assert reports.get("r1") is report


def test_audit_image_returns_verdict_with_reason_on_fail():
    uc, _ = _wire(FakeVision(veredicto="NO_CUMPLE", motivo="El logo es demasiado pequeño"))
    report = uc.execute(content_id="c1", image=b"img", mime="image/png")
    assert report.veredicto is Verdict.NO_CUMPLE
    assert "logo" in report.motivo.lower()


def test_audit_retrieves_brand_rules_before_vision_call():
    vision = FakeVision(veredicto="CUMPLE")
    uc, _ = _wire(vision)
    uc.execute(content_id="c1", image=b"img", mime="image/png")
    # La regla recuperada del RAG llegó al modelo de visión
    assert vision.calls and _RULE.texto in vision.calls[0][1]


def test_audit_unknown_content_raises():
    uc, _ = _wire(FakeVision())
    with pytest.raises(DomainError):
        uc.execute(content_id="fantasma", image=b"img", mime="image/png")
