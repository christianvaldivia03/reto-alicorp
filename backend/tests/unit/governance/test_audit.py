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


def test_list_audits_returns_reports_for_content():
    from app.contexts.governance.application.list_audits import ListAudits

    reports = InMemoryAuditReportRepo()
    uc, _ = _wire_with_content_and_reports(
        FakeVision(veredicto="CUMPLE"),
        Content(id="c1", brand_id="b1", tipo=ContentType.PROMPT_IMAGEN, texto="x"),
        reports,
    )
    uc.execute(content_id="c1", image=b"img", mime="image/png")
    history = ListAudits(reports).execute("c1")
    assert len(history) == 1
    assert history[0].content_id == "c1"
    assert ListAudits(reports).execute("otro") == []


def _wire_with_content_and_reports(vision, content, reports):
    content_repo = InMemoryContentRepo()
    content_repo.save(content)
    store = InMemoryVectorStore()
    store.index("b1", [_RULE])
    uc = AuditImage(
        vision=vision,
        vector_store=store,
        content_repo=content_repo,
        report_repo=reports,
        id_factory=lambda: "r1",
    )
    return uc, content_repo


def _wire_with_content(vision, content):
    content_repo = InMemoryContentRepo()
    content_repo.save(content)
    store = InMemoryVectorStore()
    store.index("b1", [_RULE])
    uc = AuditImage(
        vision=vision,
        vector_store=store,
        content_repo=content_repo,
        report_repo=InMemoryAuditReportRepo(),
        id_factory=lambda: "r1",
    )
    return uc, content_repo


def test_audit_no_cumple_auto_rechaza_contenido_pendiente():
    content = Content(id="c1", brand_id="b1", tipo=ContentType.PROMPT_IMAGEN, texto="x")
    uc, repo = _wire_with_content(
        FakeVision(veredicto="NO_CUMPLE", motivo="El logo es demasiado pequeño"), content
    )
    uc.execute(content_id="c1", image=b"img", mime="image/png")
    saved = repo.get("c1")
    assert saved.estado == "RECHAZADO"
    assert "logo" in saved.motivo.lower()


def test_audit_cumple_no_cambia_estado():
    content = Content(id="c1", brand_id="b1", tipo=ContentType.PROMPT_IMAGEN, texto="x")
    uc, repo = _wire_with_content(FakeVision(veredicto="CUMPLE"), content)
    uc.execute(content_id="c1", image=b"img", mime="image/png")
    assert repo.get("c1").estado == "PENDIENTE"


def test_audit_no_cumple_no_reabre_contenido_ya_resuelto():
    # Si el contenido ya no está PENDIENTE, la auditoría solo informa (no rechaza).
    content = Content(
        id="c1", brand_id="b1", tipo=ContentType.PROMPT_IMAGEN, texto="x", estado="APROBADO"
    )
    uc, repo = _wire_with_content(
        FakeVision(veredicto="NO_CUMPLE", motivo="logo pequeño"), content
    )
    report = uc.execute(content_id="c1", image=b"img", mime="image/png")
    assert report.veredicto is Verdict.NO_CUMPLE
    assert repo.get("c1").estado == "APROBADO"
