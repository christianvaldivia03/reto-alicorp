from app.shared.tracing import NullTracer


def test_null_tracer_is_noop():
    tracer = NullTracer()
    # No debe lanzar ni requerir red; solo registrar en vacío.
    with tracer.span("test-op", input={"a": 1}) as span:
        span.set_output({"b": 2})
    # Un span nulo no expone estado; basta con que no explote.
