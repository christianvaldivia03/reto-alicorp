"""Dobles de prueba para los puertos. Permiten testear dominio y casos de
uso sin red (sin Groq, Gemini ni Postgres)."""
import re


def _tokens(text: str) -> set[str]:
    return set(re.findall(r"[a-záéíóúñ0-9]+", text.lower()))


class FakeTextLlm:
    """Devuelve una respuesta fija y registra los prompts recibidos."""

    def __init__(self, response: str):
        self.response = response
        self.calls: list[str] = []

    def generate(self, prompt: str) -> str:
        self.calls.append(prompt)
        return self.response


class InMemoryVectorStore:
    """Vector store fake. La relevancia se aproxima por solapamiento léxico
    (el adaptador real usa similitud semántica; ambos hacen surgir la regla
    relevante)."""

    def __init__(self):
        self.data: dict[str, list] = {}
        self.index_calls: list[str] = []
        self.query_calls: list[tuple[str, str]] = []
        self.add_calls: list[str] = []
        self.update_calls: list[tuple[str, int]] = []
        self.delete_calls: list[tuple[str, int]] = []
        self._seq = 0

    def index(self, brand_id: str, rules: list) -> None:
        self.index_calls.append(brand_id)
        # Asignar ids como haría la BD (bigserial), para poder editar/borrar.
        stored = []
        for r in rules:
            self._seq += 1
            stored.append(self._with_id(r, self._seq))
        self.data[brand_id] = stored

    def query(self, brand_id: str, text: str, k: int = 5) -> list:
        self.query_calls.append((brand_id, text))
        q = _tokens(text)
        scored = [(len(q & _tokens(r.texto)), r) for r in self.data.get(brand_id, [])]
        scored = [(s, r) for s, r in scored if s > 0]
        scored.sort(key=lambda x: x[0], reverse=True)
        return [r for _, r in scored[:k]]

    # --- CRUD de reglas: al añadir/editar, la regla queda "embebida" (indexada)
    # y por tanto recuperable por query() — mismo comportamiento que el RAG real.
    def add_rule(self, brand_id: str, rule):
        self._seq += 1
        stored = self._with_id(rule, self._seq)
        self.data.setdefault(brand_id, []).append(stored)
        self.add_calls.append(brand_id)
        return stored

    def update_rule(self, brand_id: str, rule_id: int, rule):
        from app.shared.errors import DomainError

        rules = self.data.get(brand_id, [])
        for i, r in enumerate(rules):
            if r.id == rule_id:
                rules[i] = self._with_id(rule, rule_id)
                self.update_calls.append((brand_id, rule_id))
                return rules[i]
        raise DomainError("Regla no encontrada")

    def delete_rule(self, brand_id: str, rule_id: int) -> None:
        from app.shared.errors import DomainError

        rules = self.data.get(brand_id, [])
        if len(rules) <= 1:
            raise DomainError("No se puede eliminar la única regla de la marca")
        for i, r in enumerate(rules):
            if r.id == rule_id:
                rules.pop(i)
                self.delete_calls.append((brand_id, rule_id))
                return
        raise DomainError("Regla no encontrada")

    @staticmethod
    def _with_id(rule, rid: int):
        from app.contexts.brand_identity.domain.models import BrandRule

        return BrandRule(rule.categoria, rule.texto, rule.tipo, id=rid)


class InMemoryBrandManualRepo:
    def __init__(self):
        self.store: dict[str, object] = {}

    def save(self, manual) -> None:
        self.store[manual.id] = manual

    def get(self, brand_id: str):
        return self.store.get(brand_id)

    def list_all(self):
        from app.contexts.brand_identity.domain.models import BrandSummary

        return [
            BrandSummary(id=m.id, parametros=m.parametros, estado=m.estado)
            for m in self.store.values()
        ]


class InMemoryContentRepo:
    def __init__(self):
        self.store: dict[str, object] = {}

    def save(self, content) -> None:
        self.store[content.id] = content

    def get(self, content_id: str):
        return self.store.get(content_id)

    def list(self, estado=None):
        items = list(self.store.values())
        return [c for c in items if estado is None or c.estado == estado]


class FakeHasher:
    """Hash trivial reversible-por-igualdad, solo para tests."""

    def hash(self, pw: str) -> str:
        return f"h::{pw}"

    def verify(self, pw: str, stored: str) -> bool:
        return stored == f"h::{pw}"


class InMemoryUserRepo:
    def __init__(self):
        self.users: dict[str, object] = {}
        self.hashes: dict[str, str] = {}

    def create(self, user, password_hash: str) -> None:
        self.users[user.id] = user
        self.hashes[user.id] = password_hash

    def get(self, user_id: str):
        return self.users.get(user_id)

    def by_email(self, email: str):
        for u in self.users.values():
            if u.email == email:
                return u
        return None

    def password_hash(self, user_id: str):
        return self.hashes.get(user_id)

    def set_role(self, user_id: str, role) -> None:
        self.users[user_id].rol = role

    def deactivate(self, user_id: str) -> None:
        self.users[user_id].activo = False

    def list_all(self):
        return list(self.users.values())


class InMemoryAuditLog:
    def __init__(self):
        self.entries: list = []

    def add(self, entry) -> None:
        self.entries.append(entry)

    def list_all(self):
        return list(self.entries)


class FakeVision:
    """Modelo de visión fake: devuelve un veredicto fijo y registra llamadas."""

    def __init__(self, veredicto: str = "CUMPLE", motivo: str = ""):
        self.veredicto = veredicto
        self.motivo = motivo
        self.calls: list = []

    def audit(self, image: bytes, mime: str, rules: list) -> tuple[str, str]:
        self.calls.append((mime, [r.texto for r in rules]))
        return self.veredicto, self.motivo


class InMemoryAuditReportRepo:
    def __init__(self):
        self.store: dict[str, object] = {}

    def save(self, report) -> None:
        self.store[report.id] = report

    def get(self, report_id: str):
        return self.store.get(report_id)

    def list_for_content(self, content_id: str):
        return [r for r in self.store.values() if r.content_id == content_id]


from contextlib import contextmanager


class SpyTracer:
    """Registra los spans emitidos para poder afirmarlos en los tests."""

    def __init__(self):
        self.spans: list[dict] = []

    @contextmanager
    def span(self, name, input=None):
        rec = {"name": name, "input": input, "output": None}
        self.spans.append(rec)
        yield _SpySpan(rec)


class _SpySpan:
    def __init__(self, rec):
        self._rec = rec

    def set_output(self, output):
        self._rec["output"] = output


class FailingTracer:
    """Tracer que revienta al abrir el span (simula backend caído)."""

    @contextmanager
    def span(self, name, input=None):
        raise RuntimeError("tracing backend caído")
        yield  # pragma: no cover
