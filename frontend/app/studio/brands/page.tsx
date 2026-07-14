'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Library, Plus, Pencil, Check, X, Loader2, Trash2, BookText, ChevronRight, History } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { ErrorAlert } from '@/components/ui-custom/error-alert';
import { RuleTypeBadge } from '@/components/ui-custom/rule-badge';
import { PageHeader } from '@/components/ui-custom/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea, Label } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { brandApi } from '@/lib/api';
import { useToast } from '@/contexts/toast-context';
import { Role, RuleType } from '@/lib/types';
import type { BrandManual, BrandRule, BrandSummary } from '@/lib/types';

const TIPOS = [
  { value: RuleType.OBLIGACION, label: 'Obligación' },
  { value: RuleType.RECOMENDACION, label: 'Recomendación' },
  { value: RuleType.PROHIBICION, label: 'Prohibición' },
];

// Campos compartidos por el formulario de edición y el de alta.
function RuleFields({
  value,
  onChange,
  idPrefix,
}: {
  value: { categoria: string; texto: string; tipo: RuleType };
  onChange: (v: { categoria: string; texto: string; tipo: RuleType }) => void;
  idPrefix: string;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${idPrefix}-tipo`}>Tipo</Label>
          <Select
            id={`${idPrefix}-tipo`}
            value={value.tipo}
            onChange={(e) => onChange({ ...value, tipo: e.target.value as RuleType })}
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-cat`}>Categoría</Label>
          <Input
            id={`${idPrefix}-cat`}
            value={value.categoria}
            onChange={(e) => onChange({ ...value, categoria: e.target.value })}
            placeholder="Ej. Redes sociales"
          />
        </div>
      </div>
      <div className="mt-3">
        <Label htmlFor={`${idPrefix}-texto`}>Texto de la regla</Label>
        <Textarea
          id={`${idPrefix}-texto`}
          value={value.texto}
          onChange={(e) => onChange({ ...value, texto: e.target.value })}
          rows={3}
          placeholder="Describe la regla…"
        />
      </div>
    </>
  );
}

// Regla con edición y borrado inline (confirmación en la propia fila, sin
// diálogo anidado). Al guardar, el backend recalcula el embedding (RAG).
function EditableRule({
  brandId,
  rule,
  onSaved,
  onDelete,
}: {
  brandId: string;
  rule: BrandRule;
  onSaved: (updated: BrandRule) => void;
  onDelete: (ruleId: number) => Promise<void>;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ categoria: rule.categoria, texto: rule.texto, tipo: rule.tipo });

  const canEdit = rule.id != null;

  const start = () => {
    setForm({ categoria: rule.categoria, texto: rule.texto, tipo: rule.tipo });
    setError(null);
    setEditing(true);
  };

  const save = async () => {
    if (!rule.id || !form.texto.trim() || !form.categoria.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await brandApi.updateRule(brandId, rule.id, {
        categoria: form.categoria.trim(),
        texto: form.texto.trim(),
        tipo: form.tipo,
      });
      onSaved(updated);
      toast('Regla actualizada · embedding recalculado');
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la regla');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!rule.id) return;
    setDeleting(true);
    try {
      await onDelete(rule.id);
      // El padre quita la fila; no hace falta limpiar estado aquí.
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  if (editing) {
    return (
      <div className="rounded-xl border border-brand/40 bg-background p-3.5 ring-1 ring-brand/20">
        {error && (
          <div className="mb-3">
            <ErrorAlert message={error} onDismiss={() => setError(null)} />
          </div>
        )}
        <RuleFields value={form} onChange={setForm} idPrefix={`edit-${rule.id}`} />
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="brand"
            onClick={save}
            disabled={saving || !form.texto.trim() || !form.categoria.trim()}
          >
            {saving ? <Loader2 className="animate-spin" /> : <Check />}
            Guardar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
            <X />
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/70 bg-background p-3.5 transition-colors hover:border-border">
      <div className="mb-1.5 flex items-center gap-2">
        <RuleTypeBadge tipo={rule.tipo} />
        <span className="text-xs text-muted-foreground">{rule.categoria}</span>
        {canEdit && !confirming && (
          <div className="ml-auto flex items-center gap-0.5">
            <button
              onClick={start}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-brand-text"
              aria-label="Editar regla"
            >
              <Pencil className="size-3.5" />
              Editar
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="inline-flex cursor-pointer items-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label="Eliminar regla"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </div>
      <p className="text-sm leading-relaxed">{rule.texto}</p>
      {confirming && (
        <div className="mt-3 flex items-center gap-2 border-t border-border/70 pt-3">
          <span className="mr-auto text-xs text-muted-foreground">¿Eliminar esta regla?</span>
          <Button size="sm" variant="danger" onClick={confirmDelete} disabled={deleting}>
            {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
            Eliminar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={deleting}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}

// Formulario inline para añadir una regla nueva a la marca abierta.
function AddRuleForm({
  brandId,
  onAdded,
  onCancel,
}: {
  brandId: string;
  onAdded: (rule: BrandRule) => void;
  onCancel: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    categoria: '',
    texto: '',
    tipo: RuleType.RECOMENDACION as RuleType,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!form.texto.trim() || !form.categoria.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const rule = await brandApi.addRule(brandId, {
        categoria: form.categoria.trim(),
        texto: form.texto.trim(),
        tipo: form.tipo,
      });
      onAdded(rule);
      toast('Regla añadida al manual');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo añadir la regla');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-brand/50 bg-brand/5 p-3.5">
      {error && (
        <div className="mb-3">
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        </div>
      )}
      <RuleFields value={form} onChange={setForm} idPrefix={`add-${brandId}`} />
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          variant="brand"
          onClick={submit}
          disabled={saving || !form.texto.trim() || !form.categoria.trim()}
        >
          {saving ? <Loader2 className="animate-spin" /> : <Plus />}
          Añadir regla
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
          <X />
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// Tarjeta de marca: altura uniforme (la info de reglas vive en un modal, no
// crece la tarjeta). Jerarquía: avatar + categoría > tono/público > acción.
function BrandCard({ brand, onOpen }: { brand: BrandSummary; onOpen: () => void }) {
  const displayName = brand.nombre || brand.categoria;
  return (
    <Card className="flex flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg">
      <div className="flex items-start gap-3">
        <span className="flex size-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand/10 text-sm font-semibold uppercase text-brand-text">
          {displayName.slice(0, 2)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold leading-tight">{displayName}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
            {brand.categoria} · {brand.tono} · {brand.publico}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 border-t border-border/70 pt-3">
        <Button variant="outline" size="sm" onClick={onOpen} className="w-full justify-between">
          <span className="inline-flex items-center gap-1.5">
            <BookText className="size-3.5" />
            Ver y editar reglas
          </span>
          <ChevronRight className="size-3.5 opacity-60" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={`/studio/history?brand=${brand.id}`} />}
          className="w-full justify-between"
        >
          <span className="inline-flex items-center gap-1.5">
            <History className="size-3.5" />
            Ver historial
          </span>
          <ChevronRight className="size-3.5 opacity-60" />
        </Button>
      </div>
    </Card>
  );
}

function BrandsListContent() {
  const toast = useToast();
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Marca abierta en el modal + su manual cargado.
  const [active, setActive] = useState<BrandSummary | null>(null);
  const [manual, setManual] = useState<BrandManual | null>(null);
  const [loadingRules, setLoadingRules] = useState(false);
  const [adding, setAdding] = useState(false);

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

  const openBrand = async (brand: BrandSummary) => {
    setActive(brand);
    setManual(null);
    setAdding(false);
    setLoadingRules(true);
    try {
      setManual(await brandApi.get(brand.id));
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudieron cargar las reglas', 'error');
      setActive(null);
    } finally {
      setLoadingRules(false);
    }
  };

  const closeBrand = () => {
    setActive(null);
    setManual(null);
    setAdding(false);
  };

  const handleRuleSaved = (updated: BrandRule) =>
    setManual((prev) =>
      prev ? { ...prev, reglas: prev.reglas.map((r) => (r.id === updated.id ? updated : r)) } : prev,
    );

  const handleRuleAdded = (rule: BrandRule) => {
    setManual((prev) => (prev ? { ...prev, reglas: [...prev.reglas, rule] } : prev));
    setAdding(false);
  };

  const deleteRule = async (ruleId: number) => {
    if (!active) return;
    try {
      await brandApi.deleteRule(active.id, ruleId);
      setManual((prev) => (prev ? { ...prev, reglas: prev.reglas.filter((r) => r.id !== ruleId) } : prev));
      toast('Regla eliminada');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo eliminar la regla', 'error');
    }
  };

  const ruleCount = manual?.reglas.length ?? 0;

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8">
      <PageHeader
        icon={Library}
        title="Marcas existentes"
        description="Explora las marcas creadas; edita, añade o elimina reglas de cada manual."
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
        <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        // items-start: cada tarjeta conserva su altura natural, sin estirarse
        // para igualar a la más alta de la fila.
        <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((b) => (
            <BrandCard key={b.id} brand={b} onOpen={() => openBrand(b)} />
          ))}
        </div>
      )}

      {/* Panel de reglas: la tarjeta ya no crece; el detalle vive aquí. */}
      <Dialog
        open={!!active}
        onClose={closeBrand}
        title={active ? active.nombre || active.categoria : 'Reglas'}
        description={active ? `${active.categoria} · ${active.tono} · ${active.publico}` : undefined}
        className="max-w-2xl max-h-[85vh] overflow-y-auto"
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {loadingRules ? 'Cargando…' : `${ruleCount} regla${ruleCount === 1 ? '' : 's'}`}
          </span>
          {!loadingRules && !adding && (
            <Button size="sm" variant="brand" onClick={() => setAdding(true)}>
              <Plus />
              Añadir regla
            </Button>
          )}
        </div>

        {loadingRules ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="space-y-2">
            {adding && active && (
              <AddRuleForm
                brandId={active.id}
                onAdded={handleRuleAdded}
                onCancel={() => setAdding(false)}
              />
            )}
            {active &&
              manual?.reglas.map((rule, i) => (
                <EditableRule
                  key={rule.id ?? i}
                  brandId={active.id}
                  rule={rule}
                  onSaved={handleRuleSaved}
                  onDelete={deleteRule}
                />
              ))}
            {manual && manual.reglas.length === 0 && !adding && (
              <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                Este manual aún no tiene reglas. Añade la primera.
              </p>
            )}
          </div>
        )}
      </Dialog>
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
