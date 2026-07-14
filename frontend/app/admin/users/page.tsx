'use client';

import { useEffect, useState } from 'react';
import { Users, Plus, Loader2, X, Search } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { ErrorAlert } from '@/components/ui-custom/error-alert';
import { RoleBadge } from '@/components/ui-custom/role-badge';
import { PageHeader } from '@/components/ui-custom/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { usersApi } from '@/lib/api';
import { useToast } from '@/contexts/toast-context';
import { Role } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/roles';
import type { User } from '@/lib/types';

const ROLES = Object.values(Role);

function UserManagementContent() {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [form, setForm] = useState({ email: '', password: '', rol: Role.CREADOR as Role });

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(q.toLowerCase()) ||
      ROLE_LABELS[u.rol].toLowerCase().includes(q.toLowerCase()),
  );

  const load = async () => {
    setLoading(true);
    try {
      setUsers(await usersApi.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await usersApi.create(form.email.trim(), form.password, form.rol);
      toast('Usuario creado');
      setForm({ email: '', password: '', rol: Role.CREADOR });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el usuario');
    } finally {
      setBusy(false);
    }
  };

  const handleRoleChange = async (id: string, rol: string) => {
    setError(null);
    setBusy(true);
    try {
      await usersApi.changeRole(id, rol);
      toast('Rol actualizado');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el rol');
    } finally {
      setBusy(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    setError(null);
    setBusy(true);
    try {
      await usersApi.deactivate(id);
      toast('Usuario desactivado');
      setConfirmDeactivate(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo desactivar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8">
      <PageHeader
        icon={Users}
        title="Usuarios"
        description="Gestiona miembros del equipo y sus roles."
        action={
          <Button variant={showForm ? 'outline' : 'default'} size="xl" onClick={() => setShowForm(!showForm)}>
            {showForm ? (
              <>
                <X />
                Cancelar
              </>
            ) : (
              <>
                <Plus />
                Añadir usuario
              </>
            )}
          </Button>
        }
      />

      {error && (
        <div className="mb-6">
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Nuevo usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-3">
              <Field label="Correo" htmlFor="email" className="sm:col-span-1">
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="usuario@correo.com"
                  required
                />
              </Field>
              <Field label="Contraseña" htmlFor="password" className="sm:col-span-1">
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </Field>
              <Field label="Rol" htmlFor="rol" className="sm:col-span-1">
                <Select
                  id="rol"
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value as Role })}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="sm:col-span-3">
                <Button type="submit" size="xl" disabled={busy}>
                  {busy ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Creando…
                    </>
                  ) : (
                    'Crear usuario'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por correo o rol…"
            aria-label="Buscar usuarios"
            className="pl-9"
          />
        </div>
        {!loading && (
          <p className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
            {filtered.length} de {users.length}
          </p>
        )}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                {['Correo', 'Rol', 'Estado', 'Acciones'].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    {users.length === 0 ? 'Aún no hay usuarios.' : 'Ningún usuario coincide con la búsqueda.'}
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-6 py-4 text-sm font-medium">{u.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <RoleBadge role={u.rol} />
                        <Select
                          value={u.rol}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={busy || !u.activo}
                          className="h-8 w-auto py-0 text-xs"
                          aria-label={`Cambiar rol de ${u.email}`}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          u.activo
                            ? 'bg-success/10 text-success-text ring-success/25'
                            : 'bg-muted text-muted-foreground ring-border'
                        }`}
                      >
                        <span className={`size-1.5 rounded-full ${u.activo ? 'bg-success' : 'bg-muted-foreground'}`} />
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.activo && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setConfirmDeactivate(u.id)}
                          disabled={busy}
                        >
                          Desactivar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog
        open={!!confirmDeactivate}
        onClose={() => setConfirmDeactivate(null)}
        title="Desactivar usuario"
        description="El usuario ya no podrá acceder al sistema. ¿Confirmas?"
      >
        <div className="flex gap-3">
          <Button
            variant="danger"
            onClick={() => confirmDeactivate && handleDeactivate(confirmDeactivate)}
            disabled={busy}
            className="flex-1"
          >
            {busy ? 'Desactivando…' : 'Desactivar'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfirmDeactivate(null)}
            disabled={busy}
            className="flex-1"
          >
            Cancelar
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

export default function UserManagement() {
  return (
    <ProtectedRoute allow={[Role.SUPERADMIN]}>
      <AppLayout>
        <UserManagementContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
