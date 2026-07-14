'use client';

import { useState, ReactNode, type ComponentType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Palette,
  Library,
  PenLine,
  ClipboardCheck,
  ScanEye,
  Users,
  Activity,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Role } from '@/lib/types';
import { homeForRole } from '@/lib/roles';
import { RoleBadge } from '@/components/ui-custom/role-badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  href: string;
  roles: Role[];
  icon: ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Marcas', href: '/studio/brand', roles: [Role.CREADOR], icon: Palette },
  { label: 'Marcas existentes', href: '/studio/brands', roles: [Role.CREADOR], icon: Library },
  { label: 'Generar contenido', href: '/studio/content', roles: [Role.CREADOR], icon: PenLine },
  { label: 'Cola de aprobación', href: '/studio/approvals', roles: [Role.APROBADOR_A], icon: ClipboardCheck },
  { label: 'Auditoría de imágenes', href: '/studio/audit', roles: [Role.APROBADOR_B], icon: ScanEye },
  { label: 'Usuarios', href: '/admin/users', roles: [Role.SUPERADMIN], icon: Users },
];

// Título de la página actual para el header (contexto de navegación).
const PAGE_TITLES: Record<string, string> = Object.fromEntries(
  NAV_ITEMS.map((i) => [i.href, i.label]),
);

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleNavItems = NAV_ITEMS.filter((item) => user && item.roles.includes(user.rol));
  const homeHref = user ? homeForRole(user.rol) : '/';
  const langfuseUrl = process.env.NEXT_PUBLIC_LANGFUSE_URL;
  const showLangfuse = user?.rol === Role.SUPERADMIN && !!langfuseUrl;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <Link href={homeHref} className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              C
            </span>
            <span className="text-[0.95rem] font-semibold tracking-tight">Content Suite</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <p className="px-3 pb-2 pt-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Espacio de trabajo
          </p>
          <ul className="space-y-1">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand/10 text-brand'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <Icon className={`size-[1.15rem] ${isActive ? 'text-brand' : ''}`} />
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
                  className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Activity className="size-[1.15rem]" />
                  Observabilidad
                  <span className="ml-auto text-xs opacity-60">↗</span>
                </a>
              </li>
            )}
          </ul>
        </nav>

        <div className="border-t border-sidebar-border p-3">
          {user && (
            <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-2">
              <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-full bg-brand/12 text-sm font-semibold text-brand">
                {user.email.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.email}</p>
                <RoleBadge role={user.rol} />
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              logout();
              setSidebarOpen(false);
            }}
            className="w-full justify-start gap-3 px-2 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="size-[1.15rem]" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Columna principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="size-5" />
          </button>
          <h1 className="text-sm font-semibold tracking-tight">
            {PAGE_TITLES[pathname] ?? 'Content Suite'}
          </h1>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <span className="hidden max-w-[16rem] truncate pl-2 text-sm text-muted-foreground sm:block">
              {user?.email}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
