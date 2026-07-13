import pytest

from app.contexts.content_creation.domain.models import Content, ContentType
from app.contexts.governance.application.approve_content import (
    ApproveContent,
    RejectContent,
)
from app.shared.errors import DomainError
from tests.fakes import InMemoryContentRepo


def _repo_with_pending():
    repo = InMemoryContentRepo()
    repo.save(Content(id="c1", brand_id="b1", tipo=ContentType.GUION, texto="Guion"))
    return repo


def test_approve_content_use_case():
    repo = _repo_with_pending()
    c = ApproveContent(repo).execute("c1")
    assert c.estado == "APROBADO"
    assert repo.get("c1").estado == "APROBADO"


def test_reject_content_requires_motivo():
    repo = _repo_with_pending()
    with pytest.raises(DomainError):
        RejectContent(repo).execute("c1", motivo="")


def test_reject_content_sets_rechazado():
    repo = _repo_with_pending()
    c = RejectContent(repo).execute("c1", motivo="No cumple el tono")
    assert c.estado == "RECHAZADO"


def test_approve_unknown_content_raises():
    with pytest.raises(DomainError):
        ApproveContent(InMemoryContentRepo()).execute("fantasma")
