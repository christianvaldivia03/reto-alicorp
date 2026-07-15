"""Adaptador de TracingPort con Langfuse (v4, OpenTelemetry).

build_tracer() devuelve un tracer listo para inyectar: Langfuse envuelto en
SafeTracer si hay credenciales, o NullTracer si no. Así la app funciona
igual con o sin observabilidad configurada.
"""
from contextlib import contextmanager
from typing import Any

from app.config import get_settings
from app.shared.tracing import NullTracer, SafeTracer


class _LangfuseSpan:
    def __init__(self, obs):
        self._obs = obs

    def set_output(self, output: Any) -> None:
        self._obs.update(output=output)


class LangfuseTracer:
    def __init__(self):
        from langfuse import Langfuse

        s = get_settings()
        self._lf = Langfuse(
            public_key=s.langfuse_public_key,
            secret_key=s.langfuse_secret_key,
            host=s.langfuse_host,
        )

    @contextmanager
    def span(self, name: str, input: Any = None):
        with self._lf.start_as_current_observation(name=name, input=input) as obs:
            yield _LangfuseSpan(obs)
        self._lf.flush()


def build_tracer():
    s = get_settings()
    if s.langfuse_public_key and s.langfuse_secret_key:
        try:
            return SafeTracer(LangfuseTracer())
        except Exception:
            # Observabilidad es best-effort: si Langfuse no está instalado o no
            # arranca, NO debe tumbar el caso de uso (invariante SafeTracer).
            return NullTracer()
    return NullTracer()
