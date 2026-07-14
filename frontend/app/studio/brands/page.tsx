'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Library, ChevronDown, Plus, Pencil, Check, X, Loader2, Trash2 } from 'lucide-react';
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

// Regla del manual con edición inline. Al guardar, el backend recalcula el
// embedding para que el RAG siga coherente.
function EditableRule({
  brandId,
  rule,
  onSaved,
  onRequestDelete,
}: {
  brandId: string;
  rule: BrandRule;
  onSaved: (updated: BrandRule) => void;
  onRequestDelete: (rule: BrandRule) => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
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
    <div className="rounded-xl border border-border/70 bg-background p-3.5">
      <div className="mb-1.5 flex items-center gap-2">
        <RuleTypeBadge tipo={rule.tipo} />
        <span className="text-xs text-muted-foreground">{rule.categoria}</span>
        {canEdit && (
          <div className="ml-auto flex items-center gap-0.5">
            <button
              onClick={start}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-brand"
              aria-label="Editar regla"
            >
              <Pencil className="size-3.5" />
              Editar
            </button>
            <button
              onClick={() => onRequestDelete(rule)}
              className="inline-flex cursor-pointer items-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label="Eliminar regla"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </div>
      <p className="text-sm leading-relaxed">{rule.texto}</p>
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

function BrandsListContent() {
  const toast = useToast();
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<BrandManual | null>(null);
  const [loadingRules, setLoadingRules] = useState(false);
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<BrandRule | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    setAdding(false);
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

  const handleRuleSaved = (updated: BrandRule) => {
    setExpanded((prev) =>
      prev
        ? { ...prev, reglas: prev.reglas.map((r) => (r.id === updated.id ? updated : r)) }
        : prev,
    );
  };

  const handleRuleAdded = (rule: BrandRule) => {
    setExpanded((prev) => (prev ? { ...prev, reglas: [...prev.reglas, rule] } : prev));
    setAdding(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete?.id || !expandedId) return;
    setDeleting(true);
    setError(null);
    try {
      await brandApi.deleteRule(expandedId, confirmDelete.id);
      setExpanded((prev) =>
        prev ? { ...prev, reglas: prev.reglas.filter((r) => r.id !== confirmDelete.id) } : prev,
      );
      toast('Regla eliminada');
      setConfirmDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la regla');
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6 lg:p-8">
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
                    <>
                      {expanded?.reglas.map((rule, i) => (
                        <EditableRule
                          key={rule.id ?? i}
                          brandId={b.id}
                          rule={rule}
                          onSaved={handleRuleSaved}
                          onRequestDelete={setConfirmDelete}
                        />
                      ))}

                      {adding ? (
                        <AddRuleForm
                          brandId={b.id}
                          onAdded={handleRuleAdded}
                          onCancel={() => setAdding(false)}
                        />
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAdding(true)}
                          className="w-full"
                        >
                          <Plus />
                          Añadir regla
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Eliminar regla"
        description="Esta acción no se puede deshacer. La regla se quita del manual y del RAG."
      >
        {confirmDelete && (
          <p className="mb-5 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            “{confirmDelete.texto}”
          </p>
        )}
        <div className="flex gap-3">
          <Button variant="danger" onClick={handleDelete} disabled={deleting} className="flex-1">
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfirmDelete(null)}
            disabled={deleting}
            className="flex-1"
          >
            Cancelar
          </Button>
        </div>
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
