"""Adaptador VectorStorePort con pgvector. Guarda reglas con su embedding y
recupera por similitud coseno (operador <=>)."""
from app.contexts.brand_identity.domain.models import BrandRule, RuleType
from app.shared.db import connect
from app.shared.errors import DomainError


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

    def add_rule(self, brand_id: str, rule: BrandRule) -> BrandRule:
        """Añade una regla nueva a la marca, con su embedding."""
        emb = _vec(self._embedder.embed(rule.texto))
        with connect() as conn:
            row = conn.execute(
                "insert into brand_rules(brand_id, categoria, texto, tipo, embedding) "
                "values (%s, %s, %s, %s, %s::vector) returning id",
                (brand_id, rule.categoria, rule.texto, rule.tipo.value, emb),
            ).fetchone()
            conn.commit()
        return BrandRule(rule.categoria, rule.texto, rule.tipo, id=row[0])

    def delete_rule(self, brand_id: str, rule_id: int) -> None:
        """Elimina una regla. Rechaza si es la última (una marca no puede
        quedarse sin reglas — invariante del agregado BrandManual)."""
        with connect() as conn:
            total = conn.execute(
                "select count(*) from brand_rules where brand_id = %s", (brand_id,)
            ).fetchone()[0]
            if total <= 1:
                raise DomainError("No se puede eliminar la única regla de la marca")
            row = conn.execute(
                "delete from brand_rules where id = %s and brand_id = %s returning id",
                (rule_id, brand_id),
            ).fetchone()
            conn.commit()
        if row is None:
            raise DomainError("Regla no encontrada")

    def update_rule(self, brand_id: str, rule_id: int, rule: BrandRule) -> BrandRule:
        """Actualiza una regla y RE-CALCULA su embedding (si no, el RAG seguiría
        recuperándola por su significado viejo). Lanza DomainError si no existe."""
        emb = _vec(self._embedder.embed(rule.texto))
        with connect() as conn:
            row = conn.execute(
                "update brand_rules set categoria = %s, texto = %s, tipo = %s, "
                "embedding = %s::vector where id = %s and brand_id = %s returning id",
                (rule.categoria, rule.texto, rule.tipo.value, emb, rule_id, brand_id),
            ).fetchone()
            conn.commit()
        if row is None:
            raise DomainError("Regla no encontrada")
        return BrandRule(rule.categoria, rule.texto, rule.tipo, id=rule_id)

    def query(self, brand_id: str, text: str, k: int = 5) -> list[BrandRule]:
        q = _vec(self._embedder.embed(text))
        with connect() as conn:
            rows = conn.execute(
                "select categoria, texto, tipo from brand_rules "
                "where brand_id = %s order by embedding <=> %s::vector limit %s",
                (brand_id, q, k),
            ).fetchall()
        return [BrandRule(cat, txt, RuleType(tipo)) for cat, txt, tipo in rows]
