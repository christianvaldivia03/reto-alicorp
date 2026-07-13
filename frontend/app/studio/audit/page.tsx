'use client';

import { useEffect, useRef, useState } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { LoadingSpinner } from '@/components/ui-custom/loading-spinner';
import { ErrorAlert } from '@/components/ui-custom/error-alert';
import { StatusBadge } from '@/components/ui-custom/status-badge';
import { ApiError, contentApi } from '@/lib/api';
import { useToast } from '@/contexts/toast-context';
import { Role, Verdict } from '@/lib/types';
import type { AuditReport, Content } from '@/lib/types';

function AuditContent() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Content | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [history, setHistory] = useState<AuditReport[]>([]);

  const loadHistory = (id: string) =>
    contentApi
      .audits(id)
      .then(setHistory)
      .catch(() => setHistory([]));

  const selectContent = (item: Content) => {
    setSelected(item);
    setReport(null);
    loadHistory(item.id);
  };

  const loadItems = () =>
    contentApi
      .list()
      .then((list) => {
        setItems(list);
        setSelected((prev) => (prev ? list.find((c) => c.id === prev.id) ?? prev : null));
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'No se pudo cargar el contenido')
      );

  useEffect(() => {
    loadItems().finally(() => setLoading(false));
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen (PNG/JPG).');
      return;
    }
    setError(null);
    setReport(null);
    setAuditing(true);
    try {
      const r = await contentApi.audit(selected.id, file);
      setReport(r);
      toast(
        r.veredicto === Verdict.CUMPLE ? 'Auditoría: cumple' : 'Auditoría: no cumple · rechazado',
        r.veredicto === Verdict.CUMPLE ? 'success' : 'error'
      );
      await loadItems(); // si NO_CUMPLE, el backend rechazó el contenido: refrescar estado
      await loadHistory(selected.id);
    } catch (err) {
      if (err instanceof ApiError && err.status === 502) {
        setError('El modelo de visión no está disponible, reintenta en unos segundos.');
      } else {
        setError(err instanceof Error ? err.message : 'No se pudo auditar la imagen');
      }
    } finally {
      setAuditing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Auditoría de imágenes</h1>
        <p className="text-muted-foreground">
          Sube una imagen y el modelo de visión la contrasta contra el manual de marca.
        </p>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          <h2 className="text-sm font-semibold mb-4">Contenido ({items.length})</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No hay contenido para auditar.</p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => selectContent(item)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selected?.id === item.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium text-primary">{item.tipo}</span>
                  <StatusBadge status={item.estado} />
                </div>
                <p className="text-sm line-clamp-2">{item.texto}</p>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <p className="text-muted-foreground">Selecciona un contenido y sube su imagen final.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-card border border-dashed border-border rounded-lg p-10 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  disabled={auditing}
                  className="hidden"
                />
                <h3 className="text-lg font-semibold mb-2">
                  {auditing ? 'Auditando imagen…' : 'Subir imagen para auditar'}
                </h3>
                {auditing ? (
                  <div className="flex justify-center">
                    <LoadingSpinner size="md" />
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Elegir imagen
                  </button>
                )}
              </div>

              {report && (
                <div
                  className={`rounded-lg p-6 border ${
                    report.veredicto === Verdict.CUMPLE
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`text-2xl ${
                        report.veredicto === Verdict.CUMPLE
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {report.veredicto === Verdict.CUMPLE ? '✓' : '✕'}
                    </span>
                    <p className="text-lg font-bold">
                      {report.veredicto === Verdict.CUMPLE ? 'Cumple con el manual' : 'No cumple'}
                    </p>
                  </div>
                  {report.motivo && <p className="text-sm mb-3">{report.motivo}</p>}
                  {report.veredicto === Verdict.NO_CUMPLE && (
                    <p className="text-xs font-medium mb-3">
                      El contenido fue marcado como <strong>Rechazado</strong> por la auditoría.
                    </p>
                  )}
                  {report.reglas_evaluadas.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase">
                        Reglas evaluadas
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {report.reglas_evaluadas.map((r, i) => (
                          <span key={i} className="text-xs bg-background px-2 py-1 rounded border border-border/50">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {history.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase">
                    Historial de auditorías ({history.length})
                  </h3>
                  <div className="space-y-2">
                    {history.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center gap-2 text-sm border-b border-border/50 pb-2 last:border-0"
                      >
                        <span
                          className={
                            h.veredicto === Verdict.CUMPLE
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }
                        >
                          {h.veredicto === Verdict.CUMPLE ? '✓' : '✕'}
                        </span>
                        <span className="font-medium">
                          {h.veredicto === Verdict.CUMPLE ? 'Cumple' : 'No cumple'}
                        </span>
                        {h.motivo && (
                          <span className="text-muted-foreground truncate">— {h.motivo}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuditPage() {
  return (
    <ProtectedRoute allow={[Role.APROBADOR_B]}>
      <AppLayout>
        <AuditContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
