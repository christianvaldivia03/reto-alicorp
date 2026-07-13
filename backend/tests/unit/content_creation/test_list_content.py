import pytest

from app.contexts.content_creation.application.list_content import GetContent, ListContent
from app.contexts.content_creation.domain.models import Content, ContentType
from app.shared.errors import DomainError
from tests.fakes import InMemoryContentRepo


def _content(cid: str, estado: str) -> Content:
    return Content(
        id=cid,
        brand_id="b1",
        tipo=ContentType.DESCRIPCION,
        texto="texto",
        estado=estado,
    )


def _repo() -> InMemoryContentRepo:
    repo = InMemoryContentRepo()
    repo.save(_content("c1", "PENDIENTE"))
    repo.save(_content("c2", "APROBADO"))
    repo.save(_content("c3", "PENDIENTE"))
    return repo


def test_list_content_filters_by_estado():
    result = ListContent(_repo()).execute("PENDIENTE")
    assert {c.id for c in result} == {"c1", "c3"}


def test_list_content_without_filter_returns_all():
    result = ListContent(_repo()).execute()
    assert len(result) == 3


def test_get_content_returns_detail():
    assert GetContent(_repo()).execute("c2").estado == "APROBADO"


def test_get_content_unknown_raises():
    with pytest.raises(DomainError):
        GetContent(_repo()).execute("fantasma")
