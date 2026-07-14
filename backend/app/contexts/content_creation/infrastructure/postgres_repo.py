"""Adaptador ContentRepository con Postgres."""
import json
from typing import Optional

from app.contexts.content_creation.domain.models import Content, ContentType
from app.shared.db import connect

# Lectura con el email del creador (LEFT JOIN users) para mostrar "quién generó"
# sin exponer el endpoint de usuarios. Alias c/u obligan a calificar columnas.
_COLS = (
    "c.id, c.brand_id, c.tipo, c.texto, c.estado, c.reglas_aplicadas, "
    "c.motivo, c.created_by, c.created_at, u.email"
)
_FROM = "from contents c left join users u on u.id = c.created_by"


class PostgresContentRepo:
    def save(self, content: Content) -> None:
        with connect() as conn:
            conn.execute(
                "insert into contents(id, brand_id, tipo, texto, estado, reglas_aplicadas, motivo, created_by) "
                "values (%s, %s, %s, %s, %s, %s, %s, %s) "
                "on conflict (id) do update set "
                "texto = excluded.texto, estado = excluded.estado, "
                "reglas_aplicadas = excluded.reglas_aplicadas, motivo = excluded.motivo",
                (
                    content.id,
                    content.brand_id,
                    content.tipo.value,
                    content.texto,
                    content.estado,
                    json.dumps(content.reglas_aplicadas),
                    content.motivo,
                    content.created_by,
                ),
            )
            conn.commit()

    def get(self, content_id: str) -> Optional[Content]:
        with connect() as conn:
            row = conn.execute(
                f"select {_COLS} {_FROM} where c.id = %s",
                (content_id,),
            ).fetchone()
        if row is None:
            return None
        return self._row_to_content(row)

    def list(self, estado: Optional[str] = None) -> list[Content]:
        sql = f"select {_COLS} {_FROM}"
        params: tuple = ()
        if estado is not None:
            sql += " where c.estado = %s"
            params = (estado,)
        sql += " order by c.created_at desc"
        with connect() as conn:
            rows = conn.execute(sql, params).fetchall()
        return [self._row_to_content(r) for r in rows]

    @staticmethod
    def _row_to_content(row) -> Content:
        reglas = row[5] if isinstance(row[5], list) else json.loads(row[5])
        created_at = row[8].isoformat() if row[8] is not None else None
        return Content(
            id=row[0],
            brand_id=row[1],
            tipo=ContentType(row[2]),
            texto=row[3],
            reglas_aplicadas=reglas,
            estado=row[4],
            motivo=row[6],
            created_by=row[7],
            created_at=created_at,
            creator_email=row[9],
        )
