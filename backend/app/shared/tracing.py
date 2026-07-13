from contextlib import contextmanager
from typing import Any, Iterator, Protocol


class Span(Protocol):
    def set_output(self, output: Any) -> None: ...


class TracingPort(Protocol):
    """Puerto de trazabilidad. La Fase 5 lo implementa con Langfuse;
    en tests y hasta entonces se usa NullTracer."""

    def span(self, name: str, input: Any = None) -> "Iterator[Span]": ...


class _NullSpan:
    def set_output(self, output: Any) -> None:
        pass


class NullTracer:
    """No hace nada. Permite instrumentar el dominio sin depender de red."""

    @contextmanager
    def span(self, name: str, input: Any = None) -> Iterator[_NullSpan]:
        yield _NullSpan()


class _SafeSpan:
    def __init__(self, inner):
        self._inner = inner

    def set_output(self, output: Any) -> None:
        try:
            self._inner.set_output(output)
        except Exception:
            pass


class SafeTracer:
    """Envuelve otro tracer y garantiza que el cuerpo del `with` siempre se
    ejecute, aunque el backend de tracing falle. La observabilidad es
    best-effort: nunca debe tumbar un caso de uso."""

    def __init__(self, inner):
        self._inner = inner

    @contextmanager
    def span(self, name: str, input: Any = None):
        cm = None
        span: Any = _NullSpan()
        try:
            cm = self._inner.span(name, input=input)
            span = cm.__enter__()
        except Exception:
            cm = None
            span = _NullSpan()
        try:
            yield _SafeSpan(span)
        finally:
            if cm is not None:
                try:
                    cm.__exit__(None, None, None)
                except Exception:
                    pass
