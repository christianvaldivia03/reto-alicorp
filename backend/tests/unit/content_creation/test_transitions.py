import pytest

from app.contexts.content_creation.domain.models import Content, ContentType
from app.shared.errors import DomainError


def _pending():
    return Content(id="c1", brand_id="b1", tipo=ContentType.DESCRIPCION, texto="Un texto")


def test_approve_from_pending_sets_aprobado():
    c = _pending()
    c.aprobar()
    assert c.estado == "APROBADO"


def test_content_cannot_be_approved_twice():
    c = _pending()
    c.aprobar()
    with pytest.raises(DomainError):
        c.aprobar()


def test_reject_requires_reason():
    c = _pending()
    with pytest.raises(DomainError):
        c.rechazar("   ")


def test_reject_sets_rechazado_with_motivo():
    c = _pending()
    c.rechazar("El logo es demasiado pequeño")
    assert c.estado == "RECHAZADO"
    assert c.motivo == "El logo es demasiado pequeño"


def test_cannot_reject_after_approved():
    c = _pending()
    c.aprobar()
    with pytest.raises(DomainError):
        c.rechazar("ya no se puede")
