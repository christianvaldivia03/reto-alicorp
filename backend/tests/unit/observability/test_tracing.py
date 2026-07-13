"""Fase 5: cada interacción con IA emite una traza, y el trazado nunca rompe
el caso de uso aunque el backend de tracing falle."""
from app.contexts.brand_identity.domain.models import (
    BrandManual,
    BrandParameters,
    BrandRule,
    RuleType,
)
from app.contexts.content_creation.application.generate_content import GenerateContent
from app.contexts.governance.application.audit_image import AuditImage
from app.shared.tracing import SafeTracer
from tests.fakes import (
    FailingTracer,
    FakeTextLlm,
    FakeVision,
    InMemoryAuditReportRepo,
    InMemoryBrandManualRepo,
    InMemoryContentRepo,
    InMemoryVectorStore,
    SpyTracer,
)

_RULE = BrandRule("tono", "Prohibido usar tecnicismos", RuleType.PROHIBICION)


def _brand_repo():
    repo = InMemoryBrandManualRepo()
    repo.save(
        BrandManual(id="b1", parametros=BrandParameters("S", "D", "G"), reglas=[_RULE])
    )
    return repo


def _content_uc(tracer):
    store = InMemoryVectorStore()
    store.index("b1", [_RULE])
    return GenerateContent(
        llm=FakeTextLlm("texto generado"),
        vector_store=store,
        brand_repo=_brand_repo(),
        content_repo=InMemoryContentRepo(),
        tracer=tracer,
        id_factory=lambda: "c1",
    )


def test_generate_content_emits_trace_with_context():
    spy = SpyTracer()
    _content_uc(spy).execute(brand_id="b1", tipo="DESCRIPCION", brief="sin tecnicismos")
    assert len(spy.spans) == 1
    s = spy.spans[0]
    assert s["name"] == "generate_content"
    assert s["output"] == "texto generado"      # la salida quedó registrada
    assert "tecnicismos" in str(s["input"])       # el contexto RAG viajó en la traza


def test_audit_emits_trace_with_verdict():
    spy = SpyTracer()
    content_repo = InMemoryContentRepo()
    from app.contexts.content_creation.domain.models import Content, ContentType

    content_repo.save(Content(id="c1", brand_id="b1", tipo=ContentType.PROMPT_IMAGEN, texto="x"))
    store = InMemoryVectorStore()
    store.index("b1", [_RULE])
    uc = AuditImage(
        vision=FakeVision(veredicto="NO_CUMPLE", motivo="logo pequeño"),
        vector_store=store,
        content_repo=content_repo,
        report_repo=InMemoryAuditReportRepo(),
        tracer=spy,
        id_factory=lambda: "r1",
    )
    uc.execute(content_id="c1", image=b"img", mime="image/png")
    assert spy.spans[0]["name"] == "audit_image"
    assert spy.spans[0]["output"]["veredicto"] == "NO_CUMPLE"


def test_tracing_is_optional_and_never_breaks_use_case():
    # SafeTracer envuelve un tracer que falla; el caso de uso debe completar.
    uc = _content_uc(SafeTracer(FailingTracer()))
    content = uc.execute(brand_id="b1", tipo="DESCRIPCION", brief="sin tecnicismos")
    assert content.estado == "PENDIENTE"
    assert content.texto == "texto generado"
