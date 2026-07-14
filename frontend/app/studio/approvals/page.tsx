'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardCheck, Check, X, Inbox, Search, Tag, User, Clock, ExternalLink } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { ErrorAlert } from '@/components/ui-custom/error-alert';
import { StatusBadge } from '@/components/ui-custom/status-badge';
import { PageHeader } from '@/components/ui-custom/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { SkeletonCard } from '@/components/ui/skeleton';
import { brandApi, contentApi } from '@/lib/api';
import { useToast } from '@/contexts/toast-context';
import { ContentStatus, Role } from '@/lib/types';
import type { Content } from '@/lib/types';

// Etiqueta legible del tipo de activo generado.
const TIPO_LABELS: Record<string, string> = {
  DESCRIPCION: 'Descripción',
  GUION: 'Guion',
  PROMPT_IMAGEN: 'Prompt de imagen',
};

function ApprovalQueueContent() {
  const toast = useToast();
  const [queue, setQueue] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Content | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [q, setQ] = useState('');
  // Mapa brand_id -> nombre legible: la cola muestra a qué marca pertenece cada
  // solicitud sin exponer el ID interno.
  const [brandNames, setBrandNames] = useState<Record<string, string>>({});
  const brandName = (id: string) => brandNames[id] ?? id;

  const filtered = queue.filter((c) => {
    const term = q.toLowerCase();
    return (
      c.texto.toLowerCase().includes(term) ||
      c.tipo.toLowerCase().includes(term) ||
      (c.creator_email ?? c.created_by ?? '').toLowerCase().includes(term) ||
      brandName(c.brand_id).toLowerCase().includes(term)
    );
  });

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
    // Nombres de marca en paralelo; si falla, la cola cae al brand_id.
    brandApi
      .list()
      .then((bs) =>
        setBrandNames(Object.fromEntries(bs.map((b) => [b.id, b.nombre || b.categoria]))),
      )
      .catch(() => {});
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
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Pendientes (<span className="tabular-nums">{queue.length}</span>)
          </h2>
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por texto, tipo o autor…"
              aria-label="Buscar en la cola"
              className="pl-9"
            />
          </div>
          {loading ? (
            <div className="space-y-2">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-10 text-center">
              <Inbox className="mb-2 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {queue.length === 0 ? 'No hay contenido pendiente.' : 'Nada coincide con la búsqueda.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={`w-full cursor-pointer rounded-xl border p-4 text-left transition-all duration-200 ${
                    selected?.id === item.id
                      ? 'border-brand bg-brand/5 ring-1 ring-brand/20'
                      : 'border-border hover:border-brand/40 hover:bg-accent/50'
                  }`}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 truncate text-xs font-semibold text-foreground">
                      <Tag className="size-3 flex-shrink-0 text-brand" />
                      {brandName(item.brand_id)}
                    </span>
                    <StatusBadge status={item.estado} />
                  </div>
                  <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wide text-brand">
                    {TIPO_LABELS[item.tipo] ?? item.tipo}
                  </p>
                  <p className="line-clamp-2 text-sm text-foreground">{item.texto}</p>
                  <p className="mt-1.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <User className="size-3 flex-shrink-0" />
                    {item.creator_email ?? item.created_by ?? 'Desconocido'}
                    {item.created_at && (
                      <>
                        <span className="opacity-50">·</span>
                        <span className="tabular-nums">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </p>
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
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand-text ring-1 ring-inset ring-brand/20">
                    <Tag className="size-3.5" />
                    {brandName(selected.brand_id)}
                  </span>
                  <StatusBadge status={selected.estado} />
                  <Link
                    href={`/studio/history?brand=${selected.brand_id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-brand-text"
                  >
                    <ExternalLink className="size-3.5" />
                    Abrir marca
                  </Link>
                </div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">
                  {TIPO_LABELS[selected.tipo] ?? selected.tipo}
                </p>
                <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <User className="size-3.5" />
                    {selected.creator_email ?? selected.created_by ?? 'Desconocido'}
                  </span>
                  {selected.created_at && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {new Date(selected.created_at).toLocaleString()}
                    </span>
                  )}
                </div>
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
                        className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand-text ring-1 ring-inset ring-brand/20"
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
