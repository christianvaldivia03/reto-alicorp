'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ScanEye, UploadCloud, CheckCircle2, XCircle, Loader2, History, ImageOff, Tag, User, ExternalLink } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { ErrorAlert } from '@/components/ui-custom/error-alert';
import { StatusBadge } from '@/components/ui-custom/status-badge';
import { PageHeader } from '@/components/ui-custom/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { SkeletonCard } from '@/components/ui/skeleton';
import { ApiError, brandApi, contentApi } from '@/lib/api';
import { useToast } from '@/contexts/toast-context';
import { ContentType, Role, Verdict } from '@/lib/types';
import type { AuditReport, Content } from '@/lib/types';

const TIPO_LABELS: Record<string, string> = {
  DESCRIPCION: 'Descripción',
  GUION: 'Guion',
  PROMPT_IMAGEN: 'Prompt de imagen',
};

function AuditContent() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Content | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [history, setHistory] = useState<AuditReport[]>([]);
  const [verdictFilter, setVerdictFilter] = useState<'ALL' | Verdict>('ALL');
  const [brandNames, setBrandNames] = useState<Record<string, string>>({});
  const brandName = (id: string) => brandNames[id] ?? id;

  const visibleHistory = history.filter(
    (h) => verdictFilter === 'ALL' || h.veredicto === verdictFilter,
  );

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
      .then((all) => {
        // El Aprobador B solo audita imágenes: filtra a contenido tipo prompt de imagen.
        const list = all.filter((c) => c.tipo === ContentType.PROMPT_IMAGEN);
        setItems(list);
        setSelected((prev) => (prev ? list.find((c) => c.id === prev.id) ?? prev : null));
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'No se pudo cargar el contenido'),
      );

  useEffect(() => {
    loadItems().finally(() => setLoading(false));
    brandApi
      .list()
      .then((bs) =>
        setBrandNames(Object.fromEntries(bs.map((b) => [b.id, b.nombre || b.categoria]))),
      )
      .catch(() => {});
  }, []);

  const auditFile = async (file: File) => {
    if (!selected) return;
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
        r.veredicto === Verdict.CUMPLE ? 'success' : 'error',
      );
      await loadItems();
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

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) auditFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && selected && !auditing) auditFile(file);
  };

  const cumple = report?.veredicto === Verdict.CUMPLE;

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
      <PageHeader
        icon={ScanEye}
        title="Auditoría de imágenes"
        description="Sube una imagen y el modelo de visión la contrasta contra el manual de marca."
      />

      {error && (
        <div className="mb-6">
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Lista de contenido */}
        <div className="lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Contenido ({items.length})
          </h2>
          {loading ? (
            <div className="space-y-2">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-10 text-center">
              <ImageOff className="mb-2 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No hay contenido para auditar.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectContent(item)}
                  className={`w-full cursor-pointer rounded-xl border p-4 text-left transition-all duration-200 ${
                    selected?.id === item.id
                      ? 'border-brand bg-brand/5 ring-1 ring-brand/20'
                      : 'border-border hover:border-brand/40 hover:bg-accent/50'
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 truncate text-xs font-semibold text-foreground">
                      <Tag className="size-3 flex-shrink-0 text-brand" />
                      {brandName(item.brand_id)}
                    </span>
                    <StatusBadge status={item.estado} />
                  </div>
                  <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wide text-brand">
                    {TIPO_LABELS[item.tipo] ?? item.tipo}
                  </p>
                  <p className="line-clamp-2 text-sm">{item.texto}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panel de auditoría */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center">
              <ScanEye className="mb-3 size-10 text-muted-foreground" />
              <p className="text-muted-foreground">Selecciona un contenido y sube su imagen final.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand-text ring-1 ring-inset ring-brand/20">
                  <Tag className="size-3.5" />
                  {brandName(selected.brand_id)}
                </span>
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {TIPO_LABELS[selected.tipo] ?? selected.tipo}
                </span>
                <StatusBadge status={selected.estado} />
                <Link
                  href={`/studio/history?brand=${selected.brand_id}`}
                  className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-brand-text"
                >
                  <ExternalLink className="size-3.5" />
                  Abrir marca
                </Link>
              </div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!auditing) setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
                  dragOver ? 'border-brand bg-brand/5' : 'border-border'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  disabled={auditing}
                  className="hidden"
                />
                {auditing ? (
                  <>
                    <Loader2 className="mb-3 size-8 animate-spin text-brand" />
                    <h3 className="text-lg font-semibold">Auditando imagen…</h3>
                    <p className="mt-1 text-sm text-muted-foreground">El modelo de visión está evaluando.</p>
                  </>
                ) : (
                  <>
                    <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                      <UploadCloud className="size-6" />
                    </span>
                    <h3 className="text-lg font-semibold">Subir imagen para auditar</h3>
                    <p className="mt-1 mb-4 text-sm text-muted-foreground">
                      Arrastra y suelta o elige un archivo (PNG/JPG).
                    </p>
                    <Button size="xl" onClick={() => fileInputRef.current?.click()}>
                      Elegir imagen
                    </Button>
                  </>
                )}
              </div>

              {report && (
                <div
                  className={`rounded-2xl border p-6 ${
                    cumple
                      ? 'border-success/30 bg-success/10'
                      : 'border-destructive/30 bg-destructive/10'
                  }`}
                >
                  <div className="mb-3 flex items-center gap-3">
                    {cumple ? (
                      <CheckCircle2 className="size-8 text-success" />
                    ) : (
                      <XCircle className="size-8 text-destructive" />
                    )}
                    <p className="text-lg font-bold">
                      {cumple ? 'Cumple con el manual' : 'No cumple'}
                    </p>
                  </div>
                  {report.motivo && <p className="mb-3 text-sm leading-relaxed">{report.motivo}</p>}
                  {!cumple && (
                    <p className="mb-3 text-xs font-medium">
                      El contenido fue marcado como <strong>Rechazado</strong> por la auditoría.
                    </p>
                  )}
                  {report.reglas_evaluadas.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Reglas evaluadas
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {report.reglas_evaluadas.map((r, i) => (
                          <span
                            key={i}
                            className="rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {history.length > 0 && (
                <Card className="p-6">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <History className="size-4" />
                      Historial de auditorías ({visibleHistory.length}/{history.length})
                    </h3>
                    <Select
                      value={verdictFilter}
                      onChange={(e) => setVerdictFilter(e.target.value as 'ALL' | Verdict)}
                      aria-label="Filtrar por resultado"
                      className="h-8 w-auto text-xs"
                    >
                      <option value="ALL">Todos los resultados</option>
                      <option value={Verdict.CUMPLE}>Cumple</option>
                      <option value={Verdict.NO_CUMPLE}>No cumple</option>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    {visibleHistory.map((h) => (
                      <div
                        key={h.id}
                        className="border-b border-border/60 pb-3 text-sm last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          {h.veredicto === Verdict.CUMPLE ? (
                            <CheckCircle2 className="size-4 flex-shrink-0 text-success" />
                          ) : (
                            <XCircle className="size-4 flex-shrink-0 text-destructive" />
                          )}
                          <span className="font-medium">
                            {h.veredicto === Verdict.CUMPLE ? 'Cumple' : 'No cumple'}
                          </span>
                          {h.created_at && (
                            <span className="ml-auto whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                              {new Date(h.created_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 pl-6 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Tag className="size-3" />
                            {brandName(h.brand_id)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <User className="size-3" />
                            {h.actor_email ?? 'Desconocido'}
                          </span>
                        </div>
                        {h.motivo && (
                          <p className="mt-1 pl-6 text-xs text-muted-foreground">{h.motivo}</p>
                        )}
                      </div>
                    ))}
                    {visibleHistory.length === 0 && (
                      <p className="py-4 text-center text-xs text-muted-foreground">
                        Ninguna auditoría coincide con el filtro.
                      </p>
                    )}
                  </div>
                </Card>
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
