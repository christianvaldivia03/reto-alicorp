'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Library, ChevronDown, Plus } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { ErrorAlert } from '@/components/ui-custom/error-alert';
import { RuleTypeBadge } from '@/components/ui-custom/rule-badge';
import { PageHeader } from '@/components/ui-custom/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { brandApi } from '@/lib/api';
import { Role } from '@/lib/types';
import type { BrandManual, BrandRule, BrandSummary } from '@/lib/types';

function RuleRow({ rule }: { rule: BrandRule }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background p-3.5">
      <div className="mb-1.5 flex items-center gap-2">
        <RuleTypeBadge tipo={rule.tipo} />
        <span className="text-xs text-muted-foreground">{rule.categoria}</span>
      </div>
      <p className="text-sm leading-relaxed">{rule.texto}</p>
    </div>
  );
}

function BrandsListContent() {
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<BrandManual | null>(null);
  const [loadingRules, setLoadingRules] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setBrands(await brandApi.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las marcas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleRules = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpanded(null);
      return;
    }
    setExpandedId(id);
    setExpanded(null);
    setLoadingRules(true);
    try {
      setExpanded(await brandApi.get(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las reglas');
      setExpandedId(null);
    } finally {
      setLoadingRules(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6 lg:p-8">
      <PageHeader
        icon={Library}
        title="Marcas existentes"
        description="Explora las marcas creadas y revisa las reglas del manual de cada una."
        action={
          <Button size="xl" nativeButton={false} render={<Link href="/studio/brand" />}>
            <Plus />
            Nueva marca
          </Button>
        }
      />

      {error && (
        <div className="mb-6">
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : brands.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="mb-4 text-muted-foreground">Aún no hay marcas creadas.</p>
          <Button size="xl" nativeButton={false} render={<Link href="/studio/brand" />}>
            <Plus />
            Crear la primera marca
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {brands.map((b) => (
            <Card key={b.id} className="p-4">
              <p className="font-semibold">{b.categoria}</p>
              <p className="mb-3 text-sm text-muted-foreground">
                {b.tono} · {b.publico}
              </p>
              <button
                onClick={() => toggleRules(b.id)}
                className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-brand hover:underline"
              >
                {expandedId === b.id ? 'Ocultar reglas' : 'Ver reglas'}
                <ChevronDown
                  className={`size-4 transition-transform ${expandedId === b.id ? 'rotate-180' : ''}`}
                />
              </button>
              {expandedId === b.id && (
                <div className="mt-3 space-y-2">
                  {loadingRules ? (
                    <>
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </>
                  ) : (
                    expanded?.reglas.map((rule, i) => <RuleRow key={i} rule={rule} />)
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BrandsList() {
  return (
    <ProtectedRoute allow={[Role.CREADOR]}>
      <AppLayout>
        <BrandsListContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
