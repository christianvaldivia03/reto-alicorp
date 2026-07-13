'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { LoadingSpinner } from '@/components/ui-custom/loading-spinner';
import { ErrorAlert } from '@/components/ui-custom/error-alert';
import { RoleBadge } from '@/components/ui-custom/role-badge';
import { usersApi } from '@/lib/api';
import { Role } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/roles';
import type { User } from '@/lib/types';

const ROLES = Object.values(Role);

function UserManagementContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', password: '', rol: Role.CREADOR as Role });

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
      setConfirmDeactivate(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo desactivar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Usuarios</h1>
          <p className="text-muted-foreground">Gestiona miembros del equipo y sus roles.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          {showForm ? 'Cancelar' : 'Añadir usuario'}
        </button>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Nuevo usuario</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Correo</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="usuario@correo.com"
                required
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Rol</label>
              <select
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value as Role })}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
            >
              {busy ? (
                <>
                  <LoadingSpinner size="sm" />
                  Creando…
                </>
              ) : (
                'Crear usuario'
              )}
            </button>
          </form>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Correo</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm">{u.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <RoleBadge role={u.rol} />
                        <select
                          value={u.rol}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={busy || !u.activo}
                          className="px-2 py-1 text-xs rounded border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${
                          u.activo
                            ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300'
                        }`}
                      >
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.activo && (
                        <button
                          onClick={() => setConfirmDeactivate(u.id)}
                          disabled={busy}
                          className="text-sm text-destructive hover:text-red-700 font-medium disabled:opacity-50"
                        >
                          Desactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmDeactivate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Desactivar usuario</h3>
            <p className="text-sm text-muted-foreground mb-6">
              El usuario ya no podrá acceder al sistema. ¿Confirmas?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDeactivate(confirmDeactivate)}
                disabled={busy}
                className="flex-1 px-4 py-2 bg-destructive text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {busy ? 'Desactivando…' : 'Desactivar'}
              </button>
              <button
                onClick={() => setConfirmDeactivate(null)}
                disabled={busy}
                className="flex-1 px-4 py-2 border border-input rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
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
