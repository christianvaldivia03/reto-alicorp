'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { LoadingSpinner } from '@/components/ui-custom/loading-spinner';
import { ErrorAlert } from '@/components/ui-custom/error-alert';
import { RuleTypeBadge } from '@/components/ui-custom/rule-badge';
import { brandApi } from '@/lib/api';
import { Role } from '@/lib/types';
import type { BrandManual, BrandSummary } from '@/lib/types';

function BrandStudioContent() {
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<BrandManual | null>(null);
  const [form, setForm] = useState({ categoria: '', tono: '', publico: '' });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<BrandManual | null>(null);
  const [loadingRules, setLoadingRules] = useState(false);

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

  const loadBrands = async () => {
    setLoadingList(true);
    try {
      setBrands(await brandApi.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las marcas');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGenerated(null);
    setCreating(true);
    try {
      const manual = await brandApi.create(
        form.categoria.trim(),
        form.tono.trim(),
        form.publico.trim()
      );
      setGenerated(manual);
      setForm({ categoria: '', tono: '', publico: '' });
      loadBrands();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el manual');
    } finally {
      setCreating(false);
    }
  };

  const valid = form.categoria.trim() && form.tono.trim() && form.publico.trim();

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Marcas</h1>
        <p className="text-muted-foreground">
          Define el ADN de una marca. La IA genera un manual estructurado que alimenta el RAG.
        </p>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Nueva marca</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Categoría de producto</label>
            <input
              type="text"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              placeholder="Ej. Snacks saludables"
              required
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tono</label>
            <input
              type="text"
              value={form.tono}
              onChange={(e) => setForm({ ...form, tono: e.target.value })}
              placeholder="Ej. Cercano y divertido"
              required
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Público objetivo</label>
            <input
              type="text"
              value={form.publico}
              onChange={(e) => setForm({ ...form, publico: e.target.value })}
              placeholder="Ej. Jóvenes 18-25"
              required
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={creating || !valid}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <LoadingSpinner size="sm" />
                Generando manual…
              </>
            ) : (
              'Generar manual'
            )}
          </button>
        </form>
      </div>

      {generated && (
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-1">Manual generado</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {generated.reglas.length} regla(s) · estado {generated.estado}
          </p>
          <div className="space-y-2">
            {generated.reglas.map((rule, i) => (
              <div key={i} className="bg-background rounded-lg p-3 border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <RuleTypeBadge tipo={rule.tipo} />
                  <span className="text-xs text-muted-foreground">{rule.categoria}</span>
                </div>
                <p className="text-sm">{rule.texto}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold mb-4">Marcas existentes</h2>
      {loadingList ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      ) : brands.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay marcas. Crea la primera arriba.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {brands.map((b) => (
            <div key={b.id} className="bg-card border border-border rounded-lg p-4">
              <p className="font-semibold">{b.categoria}</p>
              <p className="text-sm text-muted-foreground mb-2">
                {b.tono} · {b.publico}
              </p>
              <button
                onClick={() => toggleRules(b.id)}
                className="text-sm text-primary font-medium hover:underline"
              >
                {expandedId === b.id ? 'Ocultar reglas' : 'Ver reglas'}
              </button>
              {expandedId === b.id && (
                <div className="mt-3 space-y-2">
                  {loadingRules ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    expanded?.reglas.map((rule, i) => (
                      <div key={i} className="bg-background rounded p-2 border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                          <RuleTypeBadge tipo={rule.tipo} />
                          <span className="text-xs text-muted-foreground">{rule.categoria}</span>
                        </div>
                        <p className="text-sm">{rule.texto}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BrandStudio() {
  return (
    <ProtectedRoute allow={[Role.CREADOR]}>
      <AppLayout>
        <BrandStudioContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
