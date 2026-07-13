'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { LoadingSpinner } from '@/components/ui-custom/loading-spinner';
import { ErrorAlert } from '@/components/ui-custom/error-alert';
import { StatusBadge } from '@/components/ui-custom/status-badge';
import { brandApi, contentApi } from '@/lib/api';
import { ContentType, Role } from '@/lib/types';
import type { BrandSummary, Content } from '@/lib/types';

const TIPOS = [
  { value: ContentType.DESCRIPCION, label: 'Descripción' },
  { value: ContentType.GUION, label: 'Guion' },
  { value: ContentType.PROMPT_IMAGEN, label: 'Prompt de imagen' },
];

function ContentStudioContent() {
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Content | null>(null);
  const [brandId, setBrandId] = useState('');
  const [tipo, setTipo] = useState<string>(ContentType.DESCRIPCION);
  const [brief, setBrief] = useState('');

  useEffect(() => {
    brandApi
      .list()
      .then((bs) => {
        setBrands(bs);
        if (bs[0]) setBrandId(bs[0].id);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las marcas')
      );
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setGenerating(true);
    try {
      setResult(await contentApi.create(brandId, tipo, brief.trim()));
      setBrief('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el contenido');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Generar contenido</h1>
        <p className="text-muted-foreground">
          El sistema consulta el manual de marca (RAG) antes de generar y aplica sus reglas.
        </p>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {brands.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <p className="text-muted-foreground mb-3">
            No hay marcas todavía. Crea una marca antes de generar contenido.
          </p>
          <Link
            href="/studio/brand"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Ir a Marcas
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Marca</label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.categoria} — {b.tono}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de contenido</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Brief</label>
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Describe qué quieres generar…"
                required
                rows={6}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={generating || !brief.trim() || !brandId}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <LoadingSpinner size="sm" />
                  Generando…
                </>
              ) : (
                'Generar'
              )}
            </button>
          </form>
        </div>
      )}

      {result && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Contenido generado</h2>
            <StatusBadge status={result.estado} />
          </div>
          <p className="text-sm whitespace-pre-wrap mb-4">{result.texto}</p>
          {result.reglas_aplicadas.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold mb-2 text-muted-foreground uppercase">
                Reglas aplicadas (RAG)
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.reglas_aplicadas.map((r, i) => (
                  <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            Quedó <strong>Pendiente de aprobación</strong>.
          </p>
        </div>
      )}
    </div>
  );
}

export default function ContentStudio() {
  return (
    <ProtectedRoute allow={[Role.CREADOR]}>
      <AppLayout>
        <ContentStudioContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
