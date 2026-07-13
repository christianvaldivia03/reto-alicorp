import pytest
from fastapi.testclient import TestClient

from app.contexts.content_creation.domain.models import Content, ContentType
from app.contexts.governance.application.approve_content import (
    ApproveContent,
    RejectContent,
)
from app.contexts.governance.application.audit_image import AuditImage
from app.contexts.governance.application.list_audits import ListAudits
from app.contexts.governance.interfaces.deps import (
    get_approve_content,
    get_audit_image,
    get_list_audits,
    get_reject_content,
)
from app.contexts.identity_access.domain.models import Role, User
from app.contexts.identity_access.interfaces.deps import get_current_user
from app.main import app
from tests.fakes import (
    FakeVision,
    InMemoryAuditReportRepo,
    InMemoryContentRepo,
    InMemoryVectorStore,
)

# Repos compartidos para que approve/reject/audit vean el mismo estado.
_content_repo = InMemoryContentRepo()
_report_repo = InMemoryAuditReportRepo()


def _seed():
    _content_repo.store.clear()
    _report_repo.store.clear()
    _content_repo.save(Content(id="c1", brand_id="b1", tipo=ContentType.GUION, texto="Guion"))


def _approve():
    return ApproveContent(_content_repo)


def _reject():
    return RejectContent(_content_repo)


def _audit():
    store = InMemoryVectorStore()
    return AuditImage(
        vision=FakeVision(veredicto="NO_CUMPLE", motivo="El logo es demasiado pequeño"),
        vector_store=store,
        content_repo=_content_repo,
        report_repo=_report_repo,
        id_factory=lambda: "r1",
    )


app.dependency_overrides[get_approve_content] = _approve
app.dependency_overrides[get_reject_content] = _reject
app.dependency_overrides[get_audit_image] = _audit
app.dependency_overrides[get_list_audits] = lambda: ListAudits(_report_repo)

client = TestClient(app)


def _as(rol: Role):
    app.dependency_overrides[get_current_user] = lambda: User(
        id="x", email="x@x.com", rol=rol, activo=True
    )


@pytest.fixture(autouse=True)
def _reset():
    original = dict(app.dependency_overrides)
    _seed()
    yield
    app.dependency_overrides.clear()
    app.dependency_overrides.update(original)


def test_aprobador_a_approves_content():
    _as(Role.APROBADOR_A)
    r = client.post("/content/c1/approve")
    assert r.status_code == 200
    assert r.json()["estado"] == "APROBADO"


def test_approve_twice_returns_422():
    _as(Role.APROBADOR_A)
    client.post("/content/c1/approve")
    r = client.post("/content/c1/approve")
    assert r.status_code == 422


def test_reject_requires_motivo_flows():
    _as(Role.APROBADOR_A)
    r = client.post("/content/c1/reject", json={"motivo": "No respeta el tono"})
    assert r.status_code == 200
    assert r.json()["estado"] == "RECHAZADO"


def test_creador_cannot_approve_returns_403():
    _as(Role.CREADOR)
    r = client.post("/content/c1/approve")
    assert r.status_code == 403


def test_aprobador_b_audits_image():
    _as(Role.APROBADOR_B)
    r = client.post(
        "/content/c1/audit",
        files={"image": ("logo.png", b"fakebytes", "image/png")},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["veredicto"] == "NO_CUMPLE"
    assert "logo" in body["motivo"].lower()


def test_aprobador_a_cannot_audit_returns_403():
    _as(Role.APROBADOR_A)
    r = client.post(
        "/content/c1/audit",
        files={"image": ("logo.png", b"fakebytes", "image/png")},
    )
    assert r.status_code == 403


def test_audit_history_lists_previous_reports():
    _as(Role.APROBADOR_B)
    client.post("/content/c1/audit", files={"image": ("logo.png", b"x", "image/png")})
    r = client.get("/content/c1/audits")
    assert r.status_code == 200
    body = r.json()
    assert len(body) == 1
    assert body[0]["content_id"] == "c1"
