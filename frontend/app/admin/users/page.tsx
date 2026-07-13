'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { LoadingSpinner } from '@/components/ui-custom/loading-spinner';
import { ErrorAlert } from '@/components/ui-custom/error-alert';
import { RoleBadge } from '@/components/ui-custom/role-badge';
import { mockApi } from '@/lib/mock-api';
import { mockUsers } from '@/lib/mock-data';
import { User, UserRole } from '@/lib/types';

function UserManagementContent() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: UserRole.CONTENT_CREATOR,
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const newUser = await mockApi.createUser(formData.email, formData.name, formData.role);
      setUsers([...users, newUser]);
      setFormData({ email: '', name: '', role: UserRole.CONTENT_CREATOR });
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const updated = await mockApi.updateUserRole(userId, newRole);
      setUsers(users.map((u) => (u.id === userId ? updated : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async (userId: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const updated = await mockApi.deactivateUser(userId);
      setUsers(users.map((u) => (u.id === userId ? updated : u)));
      setShowDeactivateConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate user');
    } finally {
      setIsLoading(false);
    }
  };

  const roles = Object.values(UserRole);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">
            Manage team members and their roles
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          {showCreateForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {error && (
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Add New User</h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
                required
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
                required
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role.replace(/_/g, ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 border border-input rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-semibold text-sm text-primary">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={isLoading}
                      className="px-2 py-1 text-sm rounded border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role.replace(/_/g, ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${
                        user.isActive
                          ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.isActive && (
                      <button
                        onClick={() => setShowDeactivateConfirm(user.id)}
                        disabled={isLoading}
                        className="text-sm text-destructive hover:text-red-700 font-medium disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deactivate Confirmation Modal */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Deactivate User</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to deactivate this user? They will no longer be able to access the system.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDeactivate(showDeactivateConfirm)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-destructive text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isLoading ? 'Deactivating...' : 'Deactivate'}
              </button>
              <button
                onClick={() => setShowDeactivateConfirm(null)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-input rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Cancel
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
    <ProtectedRoute>
      <AppLayout currentPath="admin">
        <UserManagementContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
