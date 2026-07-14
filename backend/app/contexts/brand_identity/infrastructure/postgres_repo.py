"""Adaptador BrandManualRepository con Postgres."""
from typing import Optional

from app.contexts.brand_identity.domain.models import (
    BrandManual,
    BrandParameters,
    BrandRule,
    BrandSummary,
    RuleType,
)
from app.shared.db import connect


class PostgresBrandManualRepo:
    def save(self, manual: BrandManual) -> None:
        with connect() as conn:
            conn.execute(
                "insert into brand_manuals(id, categoria, tono, publico, estado) "
                "values (%s, %s, %s, %s, %s) "
                "on conflict (id) do update set estado = excluded.estado",
                (
                    manual.id,
                    manual.parametros.categoria,
                    manual.parametros.tono,
                    manual.parametros.publico,
                    manual.estado,
                ),
            )
            conn.commit()

    def get(self, brand_id: str) -> Optional[BrandManual]:
        with connect() as conn:
            m = conn.execute(
                "select categoria, tono, publico, estado from brand_manuals where id = %s",
                (brand_id,),
            ).fetchone()
            if m is None:
                return None
            reglas = conn.execute(
                "select id, categoria, texto, tipo from brand_rules where brand_id = %s order by id",
                (brand_id,),
            ).fetchall()
        return BrandManual(
            id=brand_id,
            parametros=BrandParameters(categoria=m[0], tono=m[1], publico=m[2]),
            reglas=[BrandRule(c, t, RuleType(tp), id=rid) for rid, c, t, tp in reglas],
            estado=m[3],
        )

    def list_all(self) -> list[BrandSummary]:
        with connect() as conn:
            rows = conn.execute(
                "select id, categoria, tono, publico, estado from brand_manuals"
            ).fetchall()
        return [
            BrandSummary(
                id=r[0],
                parametros=BrandParameters(categoria=r[1], tono=r[2], publico=r[3]),
                estado=r[4],
            )
            for r in rows
        ]
