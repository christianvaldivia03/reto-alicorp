'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { History, Inbox, User, Clock, ExternalLink, FilterX } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { ErrorAlert } from '@/components/ui-custom/error-alert';
import { StatusBadge } from '@/components/ui-custom/status-badge';
import { PageHeader } from '@/components/ui-custom/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, Input } from '@/components/ui/input';
import { SkeletonCard } from '@/components/ui/skeleton';
import { brandApi, contentApi } from '@/lib/api';
import { ContentStatus, ContentType, Role } from '@/lib/types';
import type { BrandSummary, Content } from '@/lib/types';

const TIPO_LABELS: Record<string, string> = {
  DESCRIPCION: 'Descripción',
  GUION: 'Guion',
  PROMPT_IMAGEN: 'Prompt de imagen',
};

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
};

// Artefacto generado: toda la trazabilidad de una pieza para su marca.
function HistoryRow({ item, brandName }: { item: Content; brandName: string }) {
  return (
    <Card className="p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand">
          {TIPO_LABELS[item.tipo] ?? item.tipo}
        </span>
        <StatusBadge status={item.estado} />
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
          <User className="size-3.5" />
          {item.creator_email ?? item.created_by ?? 'Desconocido'}
        </span>
        {item.created_at && (
          <span className="inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
            <Clock className="size-3.5" />
            {new Date(item.created_at).toLocaleString()}
          </span>
        )}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{item.texto}</p>

      {item.motivo && (
        <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs">
          <span className="font-semibold">Comentario:</span> {item.motivo}
        </p>
      )}

      {item.reglas_aplicadas.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.reglas_aplicadas.map((r, i) => (
            <span
              key={i}
              className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-text ring-1 ring-inset ring-brand/20"
            >
              {r}
            </span>
          ))}
        </div>
      )}

      <p className="mt-3 text-[0.7rem] text-muted-foreground">
        Marca: <span className="font-medium text-foreground">{brandName}</span>
      </p>
    </Card>
  );
}

function HistoryContent() {
  const params = useSearchParams();
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [items, setItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros. brand se inicializa desde ?brand= (acceso directo desde la marca).
  const [brand, setBrand] = useState(params.get('brand') ?? 'ALL');
  const [estado, setEstado] = useState<'ALL' | ContentStatus>('ALL');
  const [tipo, setTipo] = useState<'ALL' | ContentType>('ALL');
  const [usuario, setUsuario] = useState('ALL');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  useEffect(() => {
    Promise.all([brandApi.list(), contentApi.list()])
      .then(([bs, cs]) => {
        setBrands(bs);
        setItems(cs);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el historial'))
      .finally(() => setLoading(false));
  }, []);

  const brandNames = useMemo(
    () => Object.fromEntries(brands.map((b) => [b.id, b.nombre || b.categoria])),
    [brands],
  );
  const brandName = (id: string) => brandNames[id] ?? id;

  // Usuarios presentes en el historial (para el filtro).
  const usuarios = useMemo(
    () => [...new Set(items.map((c) => c.creator_email ?? c.created_by).filter(Boolean))] as string[],
    [items],
  );

  const filtered = items.filter((c) => {
    if (brand !== 'ALL' && c.brand_id !== brand) return false;
    if (estado !== 'ALL' && c.estado !== estado) return false;
    if (tipo !== 'ALL' && c.tipo !== tipo) return false;
    if (usuario !== 'ALL' && (c.creator_email ?? c.created_by) !== usuario) return false;
    if ((desde || hasta) && c.created_at) {
      const d = c.created_at.slice(0, 10); // YYYY-MM-DD
      if (desde && d < desde) return false;
      if (hasta && d > hasta) return false;
    }
    return true;
  });

  const clearFilters = () => {
    setBrand('ALL');
    setEstado('ALL');
    setTipo('ALL');
    setUsuario('ALL');
    setDesde('');
    setHasta('');
  };

  const hasFilters =
    brand !== 'ALL' || estado !== 'ALL' || tipo !== 'ALL' || usuario !== 'ALL' || !!desde || !!hasta;

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6 lg:p-8">
      <PageHeader
        icon={History}
        title="Historial por marca"
        description="Todo lo generado para cada marca: artefactos, estado, autor, fecha y comentarios."
      />

      {error && (
        <div className="mb-6">
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {/* Barra de filtros */}
      <div className="mb-6 grid gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Select value={brand} onChange={(e) => setBrand(e.target.value)} aria-label="Marca">
          <option value="ALL">Todas las marcas</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nombre || b.categoria}
            </option>
          ))}
        </Select>
        <Select
          value={estado}
          onChange={(e) => setEstado(e.target.value as 'ALL' | ContentStatus)}
          aria-label="Estado"
        >
          <option value="ALL">Todos los estados</option>
          {Object.values(ContentStatus).map((s) => (
            <option key={s} value={s}>
              {ESTADO_LABELS[s] ?? s}
            </option>
          ))}
        </Select>
        <Select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as 'ALL' | ContentType)}
          aria-label="Tipo de activo"
        >
          <option value="ALL">Todos los tipos</option>
          {Object.values(ContentType).map((t) => (
            <option key={t} value={t}>
              {TIPO_LABELS[t] ?? t}
            </option>
          ))}
        </Select>
        <Select value={usuario} onChange={(e) => setUsuario(e.target.value)} aria-label="Usuario">
          <option value="ALL">Todos los usuarios</option>
          {usuarios.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </Select>
        <Input
          type="date"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
          aria-label="Desde"
        />
        <Input
          type="date"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          aria-label="Hasta"
        />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {filtered.length} artefacto{filtered.length === 1 ? '' : 's'}
        </span>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <FilterX className="size-3.5" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Inbox className="mb-3 size-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            {items.length === 0
              ? 'Aún no hay contenido generado.'
              : 'Nada coincide con los filtros.'}
          </p>
          {brand !== 'ALL' && (
            <Link
              href="/studio/brands"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-text hover:underline"
            >
              <ExternalLink className="size-3.5" />
              Ir a las marcas
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <HistoryRow key={item.id} item={item} brandName={brandName(item.brand_id)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <ProtectedRoute allow={[Role.CREADOR]}>
      <AppLayout>
        <Suspense fallback={null}>
          <HistoryContent />
        </Suspense>
      </AppLayout>
    </ProtectedRoute>
  );
}
