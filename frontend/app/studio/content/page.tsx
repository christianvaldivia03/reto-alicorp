'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PenLine, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { ErrorAlert } from '@/components/ui-custom/error-alert';
import { StatusBadge } from '@/components/ui-custom/status-badge';
import { PageHeader } from '@/components/ui-custom/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Select, Textarea } from '@/components/ui/input';
import { Reveal } from '@/components/ui/reveal';
import { brandApi, contentApi } from '@/lib/api';
import { useToast } from '@/contexts/toast-context';
import { ContentType, Role } from '@/lib/types';
import type { BrandSummary, Content } from '@/lib/types';

const TIPOS = [
  { value: ContentType.DESCRIPCION, label: 'Descripción' },
  { value: ContentType.GUION, label: 'Guion' },
  { value: ContentType.PROMPT_IMAGEN, label: 'Prompt de imagen' },
];

// Etiqueta del selector: nombre + atributos rellenos (fijos y dinámicos). Las
// marcas nuevas guardan atributos dinámicos, así que ya no basta categoria/tono.
function brandLabel(b: BrandSummary): string {
  const attrs = [b.categoria, b.tono, b.publico, ...Object.values(b.extras ?? {})].filter(
    (v) => v && v.trim(),
  );
  return b.nombre || attrs.join(' · ') || 'Marca sin nombre';
}

function ContentStudioContent() {
  const toast = useToast();
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
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las marcas'),
      );
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setGenerating(true);
    try {
      setResult(await contentApi.create(brandId, tipo, brief.trim()));
      toast('Contenido generado · Pendiente de aprobación');
      setBrief('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el contenido');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6 lg:p-8">
      <PageHeader
        icon={PenLine}
        title="Generar contenido"
        description="El sistema consulta el manual de marca (RAG) antes de generar y aplica sus reglas."
      />

      {error && (
        <div className="mb-6">
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {brands.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="mb-4 text-muted-foreground">
            No hay marcas todavía. Crea una marca antes de generar contenido.
          </p>
          <Button size="xl" nativeButton={false} render={<Link href="/studio/brand" />}>
            Ir a Marcas
            <ArrowRight />
          </Button>
        </Card>
      ) : (
        <Reveal>
          <Card>
            <CardHeader>
              <CardTitle>Nuevo contenido</CardTitle>
              <CardDescription>Elige marca y tipo, describe el brief y genera.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Marca" htmlFor="brand">
                    <Select id="brand" value={brandId} onChange={(e) => setBrandId(e.target.value)}>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {brandLabel(b)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Tipo de contenido" htmlFor="tipo">
                    <Select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                      {TIPOS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field label="Brief" htmlFor="brief">
                  <Textarea
                    id="brief"
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    placeholder="Describe qué quieres generar…"
                    required
                    rows={6}
                  />
                </Field>
                <Button
                  type="submit"
                  size="xl"
                  disabled={generating || !brief.trim() || !brandId}
                  className="w-full sm:w-auto"
                >
                  {generating ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Generando…
                    </>
                  ) : (
                    <>
                      <Sparkles />
                      Generar
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Reveal>
      )}

      {result && (
        <Reveal className="mt-8">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Contenido generado</CardTitle>
              <StatusBadge status={result.estado} />
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{result.texto}</p>
              {result.reglas_aplicadas.length > 0 && (
                <div className="mt-5 border-t border-border pt-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Reglas aplicadas (RAG)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.reglas_aplicadas.map((r, i) => (
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
              <p className="mt-4 text-xs text-muted-foreground">
                Quedó <strong className="font-medium text-foreground">Pendiente de aprobación</strong>.
              </p>
            </CardContent>
          </Card>
        </Reveal>
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
