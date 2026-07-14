'use client';

import { useEffect, useState } from 'react';
import { ClipboardCheck, Check, X, Inbox } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { ErrorAlert } from '@/components/ui-custom/error-alert';
import { PageHeader } from '@/components/ui-custom/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { SkeletonCard } from '@/components/ui/skeleton';
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
      await load();
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
    <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
      <PageHeader
        icon={ClipboardCheck}
        title="Cola de aprobación"
        description="Revisa y aprueba o rechaza contenido pendiente."
      />

      {error && (
        <div className="mb-6">
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Lista */}
        <div className="lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Pendientes ({queue.length})
          </h2>
          {loading ? (
            <div className="space-y-2">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : queue.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-10 text-center">
              <Inbox className="mb-2 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No hay contenido pendiente.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {queue.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={`w-full cursor-pointer rounded-xl border p-4 text-left transition-all duration-200 ${
                    selected?.id === item.id
                      ? 'border-brand bg-brand/5 ring-1 ring-brand/20'
                      : 'border-border hover:border-brand/40 hover:bg-accent/50'
                  }`}
                >
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">
                    {item.tipo}
                  </p>
                  <p className="line-clamp-2 text-sm text-foreground">{item.texto}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detalle */}
        <div className="lg:col-span-2">
          {selected ? (
            <Card className="space-y-6 p-6">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">
                  {selected.tipo}
                </p>
                {(selected.created_by || selected.created_at) && (
                  <p className="mb-2 text-xs text-muted-foreground">
                    {selected.created_by && <>Autor: {selected.created_by}</>}
                    {selected.created_at && <> · {new Date(selected.created_at).toLocaleString()}</>}
                  </p>
                )}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{selected.texto}</p>
              </div>

              {selected.reglas_aplicadas.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Reglas aplicadas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.reglas_aplicadas.map((r, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand ring-1 ring-inset ring-brand/20"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 border-t border-border pt-5">
                <Button variant="success" size="xl" onClick={handleApprove} disabled={acting} className="flex-1">
                  <Check />
                  {acting ? 'Procesando…' : 'Aprobar'}
                </Button>
                <Button
                  variant="danger"
                  size="xl"
                  onClick={() => setShowReject(true)}
                  disabled={acting}
                  className="flex-1"
                >
                  <X />
                  Rechazar
                </Button>
              </div>
            </Card>
          ) : (
            <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center">
              <ClipboardCheck className="mb-3 size-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                Selecciona un elemento de la cola para revisarlo.
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={showReject && !!selected}
        onClose={() => {
          setShowReject(false);
          setMotivo('');
        }}
        title="Rechazar contenido"
        description="Indica el motivo del rechazo (obligatorio)."
      >
        <Textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo…"
          rows={4}
          autoFocus
        />
        <div className="mt-5 flex gap-3">
          <Button variant="danger" onClick={handleReject} disabled={acting || !motivo.trim()} className="flex-1">
            {acting ? 'Rechazando…' : 'Rechazar'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowReject(false);
              setMotivo('');
            }}
            disabled={acting}
            className="flex-1"
          >
            Cancelar
          </Button>
        </div>
      </Dialog>
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
