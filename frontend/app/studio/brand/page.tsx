'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Palette, Sparkles, Loader2, Library, ArrowRight } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { ErrorAlert } from '@/components/ui-custom/error-alert';
import { RuleTypeBadge } from '@/components/ui-custom/rule-badge';
import { PageHeader } from '@/components/ui-custom/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { Reveal } from '@/components/ui/reveal';
import { brandApi } from '@/lib/api';
import { useToast } from '@/contexts/toast-context';
import { Role } from '@/lib/types';
import type { BrandManual, BrandRule } from '@/lib/types';

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

function BrandStudioContent() {
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<BrandManual | null>(null);
  const [form, setForm] = useState({ categoria: '', tono: '', publico: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGenerated(null);
    setCreating(true);
    try {
      const manual = await brandApi.create(
        form.categoria.trim(),
        form.tono.trim(),
        form.publico.trim(),
      );
      setGenerated(manual);
      toast(`Manual generado con ${manual.reglas.length} regla(s)`);
      setForm({ categoria: '', tono: '', publico: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el manual');
    } finally {
      setCreating(false);
    }
  };

  const valid = form.categoria.trim() && form.tono.trim() && form.publico.trim();

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6 lg:p-8">
      <PageHeader
        icon={Palette}
        title="Marcas"
        description="Define el ADN de una marca. La IA genera un manual estructurado que alimenta el RAG."
        action={
          <Button variant="outline" size="xl" nativeButton={false} render={<Link href="/studio/brands" />}>
            <Library />
            Marcas existentes
          </Button>
        }
      />

      {error && (
        <div className="mb-6">
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Formulario */}
        <div className="lg:col-span-2">
          <Reveal>
            <Card className="lg:sticky lg:top-6">
              <CardHeader>
                <CardTitle>Nueva marca</CardTitle>
                <CardDescription>Tres señales bastan para generar el manual.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <Field label="Categoría de producto" htmlFor="categoria">
                    <Input
                      id="categoria"
                      value={form.categoria}
                      onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                      placeholder="Ej. Snacks saludables"
                      required
                    />
                  </Field>
                  <Field label="Tono" htmlFor="tono">
                    <Input
                      id="tono"
                      value={form.tono}
                      onChange={(e) => setForm({ ...form, tono: e.target.value })}
                      placeholder="Ej. Cercano y divertido"
                      required
                    />
                  </Field>
                  <Field label="Público objetivo" htmlFor="publico">
                    <Input
                      id="publico"
                      value={form.publico}
                      onChange={(e) => setForm({ ...form, publico: e.target.value })}
                      placeholder="Ej. Jóvenes 18-25"
                      required
                    />
                  </Field>
                  <Button type="submit" size="xl" disabled={creating || !valid} className="w-full">
                    {creating ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Generando manual…
                      </>
                    ) : (
                      <>
                        <Sparkles />
                        Generar manual
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Reveal>
        </div>

        {/* Resultado */}
        <div className="lg:col-span-3">
          {generated ? (
            <Reveal>
              <Card>
                <CardHeader>
                  <CardTitle>Manual generado</CardTitle>
                  <CardDescription>
                    {generated.reglas.length} regla(s) · estado {generated.estado}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {generated.reglas.map((rule, i) => (
                    <RuleRow key={i} rule={rule} />
                  ))}
                </CardContent>
              </Card>
            </Reveal>
          ) : (
            <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border p-10 text-center">
              <Palette className="mb-3 size-10 text-muted-foreground" />
              <p className="max-w-xs text-sm text-muted-foreground">
                Completa el formulario para generar el manual de marca. Aparecerá aquí y quedará
                disponible en{' '}
                <Link href="/studio/brands" className="font-medium text-brand hover:underline">
                  Marcas existentes
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </div>
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
