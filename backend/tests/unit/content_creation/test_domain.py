import pytest

from app.contexts.content_creation.domain.compliance import BrandComplianceGuard
from app.contexts.content_creation.domain.models import Content, ContentType
from app.shared.errors import DomainError


def test_content_starts_pending():
    c = Content(id="1", brand_id="b1", tipo=ContentType.DESCRIPCION, texto="Un texto")
    assert c.estado == "PENDIENTE"


def test_content_rejects_empty_text():
    with pytest.raises(DomainError):
        Content(id="1", brand_id="b1", tipo=ContentType.GUION, texto="   ")


def test_content_type_from_invalid_string_raises():
    with pytest.raises(ValueError):
        ContentType("NO_EXISTE")


def test_compliance_guard_flags_prohibited_term():
    found = BrandComplianceGuard.check(
        "Este snack usa un algoritmo de fermentación avanzado",
        prohibited_terms=["algoritmo", "blockchain"],
    )
    assert found == ["algoritmo"]


def test_compliance_guard_ok_when_clean():
    assert BrandComplianceGuard.check("Texto limpio", ["algoritmo"]) == []
