"""Adaptador BrandManualRepository con Postgres."""
import json
from typing import Optional

from app.contexts.brand_identity.domain.models import (
    BrandManual,
    BrandParameters,
    BrandRule,
    BrandSummary,
    RuleType,
)
from app.shared.db import connect


def _extras(raw) -> dict[str, str]:
    """psycopg3 suele devolver jsonb ya parseado; toleramos también texto/None."""
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str) and raw.strip():
        return json.loads(raw)
    return {}


class PostgresBrandManualRepo:
    def save(self, manual: BrandManual) -> None:
        with connect() as conn:
            conn.execute(
                "insert into brand_manuals(id, nombre, categoria, tono, publico, extras, estado) "
                "values (%s, %s, %s, %s, %s, %s, %s) "
                "on conflict (id) do update set estado = excluded.estado",
                (
                    manual.id,
                    manual.parametros.nombre or None,
                    manual.parametros.categoria,
                    manual.parametros.tono,
                    manual.parametros.publico,
                    json.dumps(manual.parametros.extras),
                    manual.estado,
                ),
            )
            conn.commit()

    def get(self, brand_id: str) -> Optional[BrandManual]:
        with connect() as conn:
            m = conn.execute(
                "select nombre, categoria, tono, publico, estado, extras from brand_manuals where id = %s",
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
            parametros=BrandParameters(
                nombre=m[0] or "", categoria=m[1], tono=m[2], publico=m[3], extras=_extras(m[5])
            ),
            reglas=[BrandRule(c, t, RuleType(tp), id=rid) for rid, c, t, tp in reglas],
            estado=m[4],
        )

    def list_all(self) -> list[BrandSummary]:
        with connect() as conn:
            rows = conn.execute(
                "select id, nombre, categoria, tono, publico, estado, extras from brand_manuals"
            ).fetchall()
        return [
            BrandSummary(
                id=r[0],
                parametros=BrandParameters(
                    nombre=r[1] or "", categoria=r[2], tono=r[3], publico=r[4], extras=_extras(r[6])
                ),
                estado=r[5],
            )
            for r in rows
        ]

    def nombre_taken(self, nombre: str) -> bool:
        with connect() as conn:
            row = conn.execute(
                "select 1 from brand_manuals where lower(nombre) = lower(%s) limit 1",
                (nombre.strip(),),
            ).fetchone()
        return row is not None
