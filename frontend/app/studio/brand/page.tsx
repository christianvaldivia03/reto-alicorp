'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Palette, Sparkles, Loader2, Library, Plus, Trash2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { ErrorAlert } from '@/components/ui-custom/error-alert';
import { RuleTypeBadge } from '@/components/ui-custom/rule-badge';
import { PageHeader } from '@/components/ui-custom/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Label } from '@/components/ui/input';
import { Reveal } from '@/components/ui/reveal';
import { brandApi } from '@/lib/api';
import { useToast } from '@/contexts/toast-context';
import { Role } from '@/lib/types';
import type { BrandManual, BrandRule } from '@/lib/types';

type Extra = { label: string; valor: string };

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
  const [form, setForm] = useState({ nombre: '', categoria: '', tono: '', publico: '' });
  // Parámetros dinámicos opcionales que el usuario puede añadir.
  const [extras, setExtras] = useState<Extra[]>([]);

  const addExtra = () => setExtras((xs) => [...xs, { label: '', valor: '' }]);
  const removeExtra = (i: number) => setExtras((xs) => xs.filter((_, idx) => idx !== i));
  const updateExtra = (i: number, key: keyof Extra, val: string) =>
    setExtras((xs) => xs.map((x, idx) => (idx === i ? { ...x, [key]: val } : x)));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGenerated(null);
    setCreating(true);
    // Sólo parámetros extra completos (label y valor no vacíos).
    const extrasObj = Object.fromEntries(
      extras
        .filter((x) => x.label.trim() && x.valor.trim())
        .map((x) => [x.label.trim(), x.valor.trim()]),
    );
    try {
      const manual = await brandApi.create(
        form.nombre.trim(),
        form.categoria.trim(),
        form.tono.trim(),
        form.publico.trim(),
        extrasObj,
      );
      setGenerated(manual);
      toast(`Manual «${manual.nombre}» generado con ${manual.reglas.length} regla(s)`);
      setForm({ nombre: '', categoria: '', tono: '', publico: '' });
      setExtras([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el manual');
    } finally {
      setCreating(false);
    }
  };

  const valid =
    form.nombre.trim() && form.categoria.trim() && form.tono.trim() && form.publico.trim();

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
                <CardDescription>
                  Tres señales base; añade los parámetros extra que necesites.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <Field
                    label="Nombre de la marca"
                    htmlFor="nombre"
                    hint="Identificador único; se usará en aprobaciones, historial y auditoría."
                  >
                    <Input
                      id="nombre"
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      placeholder="Ej. Quinua Pop"
                      required
                    />
                  </Field>
                  <Field
                    label="Categoría de producto"
                    htmlFor="categoria"
                    hint="Qué vende la marca."
                  >
                    <Input
                      id="categoria"
                      value={form.categoria}
                      onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                      placeholder="Ej. Snacks saludables"
                      required
                    />
                  </Field>
                  <Field label="Tono" htmlFor="tono" hint="Cómo comunica.">
                    <Input
                      id="tono"
                      value={form.tono}
                      onChange={(e) => setForm({ ...form, tono: e.target.value })}
                      placeholder="Ej. Cercano y divertido"
                      required
                    />
                  </Field>
                  <Field label="Público objetivo" htmlFor="publico" hint="A quién le habla.">
                    <Input
                      id="publico"
                      value={form.publico}
                      onChange={(e) => setForm({ ...form, publico: e.target.value })}
                      placeholder="Ej. Jóvenes 18-25"
                      required
                    />
                  </Field>

                  {/* Parámetros dinámicos: una tarjeta por atributo, Clave sobre Valor. */}
                  {extras.length > 0 && (
                    <div className="space-y-3">
                      <Label className="mb-0">Atributos adicionales</Label>
                      {extras.map((x, i) => (
                        <div
                          key={i}
                          className="reveal group rounded-xl border border-border/70 bg-muted/30 p-3.5 transition-colors focus-within:border-brand/50 focus-within:bg-brand/[0.03]"
                          data-shown="true"
                        >
                          <div className="mb-2.5 flex items-center justify-between">
                            <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                              Atributo {i + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeExtra(i)}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground opacity-70 transition-colors hover:bg-destructive/10 hover:text-destructive hover:opacity-100"
                              aria-label={`Quitar atributo ${i + 1}`}
                            >
                              <Trash2 className="size-3.5" />
                              Quitar
                            </button>
                          </div>
                          <div className="space-y-2.5">
                            <div>
                              <Label htmlFor={`extra-key-${i}`} className="mb-1 text-xs text-muted-foreground">
                                Clave
                              </Label>
                              <Input
                                id={`extra-key-${i}`}
                                value={x.label}
                                onChange={(e) => updateExtra(i, 'label', e.target.value)}
                                placeholder="Ej. Personalidad"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`extra-val-${i}`} className="mb-1 text-xs text-muted-foreground">
                                Valor
                              </Label>
                              <Input
                                id={`extra-val-${i}`}
                                value={x.valor}
                                onChange={(e) => updateExtra(i, 'valor', e.target.value)}
                                placeholder="Ej. Atrevida y optimista"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button type="button" variant="outline" size="sm" onClick={addExtra} className="w-full">
                    <Plus />
                    Añadir atributo
                  </Button>

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
            // Placeholder para que la columna no quede vacía antes de generar.
            <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
              <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                {creating ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <Sparkles className="size-6" />
                )}
              </span>
              <p className="text-sm font-medium">
                {creating ? 'Generando el manual…' : 'El manual aparecerá aquí'}
              </p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                {creating
                  ? 'La IA está estructurando las reglas de marca.'
                  : 'Completa las señales de marca y genera. La IA producirá un manual de reglas listo para el RAG.'}
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
