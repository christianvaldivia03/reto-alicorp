"""Adaptador VectorStorePort con pgvector. Guarda reglas con su embedding y
recupera por similitud coseno (operador <=>)."""
from app.contexts.brand_identity.domain.models import BrandRule, RuleType
from app.shared.db import connect


def _vec(values: list[float]) -> str:
    """Literal de pgvector: '[0.1,0.2,...]'."""
    return "[" + ",".join(map(str, values)) + "]"


class PgVectorStore:
    def __init__(self, embedder):
        self._embedder = embedder

    def index(self, brand_id: str, rules: list[BrandRule]) -> None:
        with connect() as conn:
            for r in rules:
                emb = _vec(self._embedder.embed(r.texto))
                conn.execute(
                    "insert into brand_rules(brand_id, categoria, texto, tipo, embedding) "
                    "values (%s, %s, %s, %s, %s::vector)",
                    (brand_id, r.categoria, r.texto, r.tipo.value, emb),
                )
            conn.commit()

    def query(self, brand_id: str, text: str, k: int = 5) -> list[BrandRule]:
        q = _vec(self._embedder.embed(text))
        with connect() as conn:
            rows = conn.execute(
                "select categoria, texto, tipo from brand_rules "
                "where brand_id = %s order by embedding <=> %s::vector limit %s",
                (brand_id, q, k),
            ).fetchall()
        return [BrandRule(cat, txt, RuleType(tipo)) for cat, txt, tipo in rows]
