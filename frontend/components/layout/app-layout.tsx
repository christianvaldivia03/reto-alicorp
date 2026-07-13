'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Role } from '@/lib/types';
import { homeForRole } from '@/lib/roles';
import { RoleBadge } from '@/components/ui-custom/role-badge';

interface NavItem {
  label: string;
  href: string;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Marcas', href: '/studio/brand', roles: [Role.CREADOR] },
  { label: 'Generar contenido', href: '/studio/content', roles: [Role.CREADOR] },
  { label: 'Cola de aprobación', href: '/studio/approvals', roles: [Role.APROBADOR_A] },
  { label: 'Auditoría de imágenes', href: '/studio/audit', roles: [Role.APROBADOR_B] },
  { label: 'Usuarios', href: '/admin/users', roles: [Role.SUPERADMIN] },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleNavItems = NAV_ITEMS.filter((item) => user && item.roles.includes(user.rol));
  const homeHref = user ? homeForRole(user.rol) : '/';
  // Observabilidad: enlace externo al proyecto de Langfuse (Superadmin), si está configurado.
  const langfuseUrl = process.env.NEXT_PUBLIC_LANGFUSE_URL;
  const showLangfuse = user?.rol === Role.SUPERADMIN && !!langfuseUrl;

  return (
    <div className="flex h-screen bg-background">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <Link href={homeHref} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">C</span>
              </div>
              <span className="font-bold text-lg">Content Suite</span>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {visibleNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-card-foreground/10'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              {showLangfuse && (
                <li>
                  <a
                    href={langfuseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-card-foreground/10"
                  >
                    Observabilidad ↗
                  </a>
                </li>
              )}
            </ul>
          </nav>

          <div className="border-t border-border p-4">
            {user && (
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="font-semibold text-sm text-primary">
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.email}</p>
                  <RoleBadge role={user.rol} />
                </div>
              </div>
            )}
            <button
              onClick={() => {
                logout();
                setSidebarOpen(false);
              }}
              className="w-full px-4 py-2 text-sm font-medium text-destructive hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-border bg-card">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-accent rounded-md"
              aria-label="Abrir menú"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1" />
            <span className="text-sm text-muted-foreground truncate">{user?.email}</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
