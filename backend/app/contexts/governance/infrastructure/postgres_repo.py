"""Adaptador AuditReportRepository con Postgres."""
import json
from typing import Optional

from app.contexts.governance.domain.models import AuditReport, Verdict
from app.shared.db import connect


class PostgresAuditReportRepo:
    def save(self, report: AuditReport) -> None:
        with connect() as conn:
            conn.execute(
                "insert into audit_reports(id, content_id, brand_id, veredicto, motivo, reglas_evaluadas) "
                "values (%s, %s, %s, %s, %s, %s)",
                (
                    report.id,
                    report.content_id,
                    report.brand_id,
                    report.veredicto.value,
                    report.motivo,
                    json.dumps(report.reglas_evaluadas),
                ),
            )
            conn.commit()

    def get(self, report_id: str) -> Optional[AuditReport]:
        with connect() as conn:
            row = conn.execute(
                "select id, content_id, brand_id, veredicto, motivo, reglas_evaluadas "
                "from audit_reports where id = %s",
                (report_id,),
            ).fetchone()
        if row is None:
            return None
        return self._row_to_report(row)

    def list_for_content(self, content_id: str) -> list[AuditReport]:
        with connect() as conn:
            rows = conn.execute(
                "select id, content_id, brand_id, veredicto, motivo, reglas_evaluadas "
                "from audit_reports where content_id = %s order by created_at desc",
                (content_id,),
            ).fetchall()
        return [self._row_to_report(r) for r in rows]

    @staticmethod
    def _row_to_report(row) -> AuditReport:
        reglas = row[5] if isinstance(row[5], list) else json.loads(row[5])
        return AuditReport(
            id=row[0],
            content_id=row[1],
            brand_id=row[2],
            veredicto=Verdict(row[3]),
            motivo=row[4] or "",
            reglas_evaluadas=reglas,
        )
