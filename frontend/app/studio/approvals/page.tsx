'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { LoadingSpinner } from '@/components/ui-custom/loading-spinner';
import { ErrorAlert } from '@/components/ui-custom/error-alert';
import { contentApi } from '@/lib/api';
import { useToast } from '@/contexts/toast-context';
import { ContentStatus, Role } from '@/lib/types';
import type { Content } from '@/lib/types';

function ApprovalQueueContent() {
  const toast = useToast();
  const [queue, setQueue] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Content | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [motivo, setMotivo] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const items = await contentApi.list(ContentStatus.PENDIENTE);
      setQueue(items);
      setSelected((prev) => (prev ? items.find((c) => c.id === prev.id) ?? null : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la cola');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async () => {
    if (!selected) return;
    setError(null);
    setActing(true);
    try {
      await contentApi.approve(selected.id);
      toast('Contenido aprobado');
      setSelected(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo aprobar');
      await load(); // refrescar por si el estado cambió (422)
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!selected || !motivo.trim()) return;
    setError(null);
    setActing(true);
    try {
      await contentApi.reject(selected.id, motivo.trim());
      toast('Contenido rechazado');
      setSelected(null);
      setShowReject(false);
      setMotivo('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo rechazar');
      await load();
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Cola de aprobación</h1>
        <p className="text-muted-foreground">Revisa y aprueba o rechaza contenido pendiente.</p>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          <h2 className="text-sm font-semibold mb-4">Pendientes ({queue.length})</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : queue.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No hay contenido pendiente.</p>
          ) : (
            queue.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selected?.id === item.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="text-xs font-medium text-primary mb-1">{item.tipo}</p>
                <p className="text-sm line-clamp-2">{item.texto}</p>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <div>
                <p className="text-xs font-medium text-primary mb-1">{selected.tipo}</p>
                {(selected.created_by || selected.created_at) && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {selected.created_by && <>Autor: {selected.created_by}</>}
                    {selected.created_at && (
                      <> · {new Date(selected.created_at).toLocaleString()}</>
                    )}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap">{selected.texto}</p>
              </div>

              {selected.reglas_aplicadas.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold mb-2 text-muted-foreground uppercase">
                    Reglas aplicadas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.reglas_aplicadas.map((r, i) => (
                      <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-border">
                <button
                  onClick={handleApprove}
                  disabled={acting}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                >
                  {acting ? 'Procesando…' : 'Aprobar'}
                </button>
                <button
                  onClick={() => setShowReject(true)}
                  disabled={acting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                >
                  Rechazar
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <p className="text-muted-foreground">Selecciona un elemento de la cola para revisarlo.</p>
            </div>
          )}
        </div>
      </div>

      {showReject && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Rechazar contenido</h3>
            <p className="text-sm text-muted-foreground mb-4">Indica el motivo del rechazo (obligatorio).</p>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Motivo…"
              rows={4}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                disabled={acting || !motivo.trim()}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
              >
                Rechazar
              </button>
              <button
                onClick={() => {
                  setShowReject(false);
                  setMotivo('');
                }}
                disabled={acting}
                className="flex-1 px-4 py-2 border border-input rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApprovalQueue() {
  return (
    <ProtectedRoute allow={[Role.APROBADOR_A]}>
      <AppLayout>
        <ApprovalQueueContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
