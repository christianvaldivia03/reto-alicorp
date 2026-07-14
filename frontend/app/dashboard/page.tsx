'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Palette,
  PenLine,
  ClipboardCheck,
  ScanEye,
  Users,
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { ErrorAlert } from '@/components/ui-custom/error-alert';
import { PageHeader } from '@/components/ui-custom/page-header';
import { StatCard } from '@/components/ui-custom/stat-card';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import { useAuth } from '@/contexts/auth-context';
import { brandApi, contentApi, usersApi } from '@/lib/api';
import { ContentStatus, Role } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/roles';

type Stat = { label: string; value: string | number; hint?: string; icon?: typeof Clock };
type DashData = { stats: Stat[]; ctaLabel: string; ctaHref: string; ctaIcon: typeof ArrowRight };

function DashboardContent() {
  const { user } = useAuth();
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showObs, setShowObs] = useState(false);

  useEffect(() => {
    if (!user) return;
    const langfuse = process.env.NEXT_PUBLIC_LANGFUSE_URL;
    setShowObs(user.rol === Role.SUPERADMIN && !!langfuse);

    (async () => {
      setLoading(true);
      setError(null);
      try {
        setData(await buildDashboard(user.rol));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las métricas');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8">
      <PageHeader
        icon={LayoutDashboard}
        title={`Hola, ${user.email.split('@')[0]}`}
        description={`Tu espacio como ${ROLE_LABELS[user.rol]}. Resumen y acción principal.`}
        action={
          data && (
            <Button size="xl" nativeButton={false} render={<Link href={data.ctaHref} />}>
              {data.ctaLabel}
              <data.ctaIcon />
            </Button>
          )
        }
      />

      {error && (
        <div className="mb-6">
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading || !data
          ? Array.from({ length: 3 }).map((_, i) => (
              <StatCard key={i} label="—" value="" loading />
            ))
          : data.stats.map((s) => (
              <Reveal key={s.label}>
                <StatCard label={s.label} value={s.value} hint={s.hint} icon={s.icon} />
              </Reveal>
            ))}
      </div>

      {showObs && (
        <a
          href={process.env.NEXT_PUBLIC_LANGFUSE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-premium transition-colors hover:text-foreground"
        >
          <Activity className="size-4" />
          Abrir Observabilidad (Langfuse)
          <span className="text-xs opacity-60">↗</span>
        </a>
      )}
    </div>
  );
}

// Deriva KPIs de los endpoints de lista existentes (no hay endpoint de métricas).
async function buildDashboard(rol: Role): Promise<DashData> {
  switch (rol) {
    case Role.CREADOR: {
      const [brands, content] = await Promise.all([brandApi.list(), contentApi.list()]);
      const aprobados = content.filter((c) => c.estado === ContentStatus.APROBADO).length;
      const pct = content.length ? Math.round((aprobados / content.length) * 100) : 0;
      return {
        stats: [
          { label: 'Marcas', value: brands.length, icon: Palette },
          { label: 'Contenidos generados', value: content.length, icon: PenLine },
          { label: 'Aprobados', value: `${pct}%`, hint: `${aprobados} de ${content.length}`, icon: CheckCircle2 },
        ],
        ctaLabel: 'Generar contenido',
        ctaHref: '/studio/content',
        ctaIcon: ArrowRight,
      };
    }
    case Role.APROBADOR_A: {
      const content = await contentApi.list();
      const count = (s: ContentStatus) => content.filter((c) => c.estado === s).length;
      return {
        stats: [
          { label: 'Pendientes en cola', value: count(ContentStatus.PENDIENTE), icon: Clock },
          { label: 'Aprobados', value: count(ContentStatus.APROBADO), icon: CheckCircle2 },
          { label: 'Rechazados', value: count(ContentStatus.RECHAZADO), icon: XCircle },
        ],
        ctaLabel: 'Ir a la cola',
        ctaHref: '/studio/approvals',
        ctaIcon: ClipboardCheck,
      };
    }
    case Role.APROBADOR_B: {
      const content = await contentApi.list();
      const auditables = content.filter((c) => c.estado === ContentStatus.APROBADO).length;
      return {
        stats: [
          { label: 'Contenidos aprobados', value: auditables, hint: 'Auditables por imagen', icon: CheckCircle2 },
          { label: 'Rechazados', value: content.filter((c) => c.estado === ContentStatus.RECHAZADO).length, icon: XCircle },
          { label: 'Total contenido', value: content.length, icon: ScanEye },
        ],
        ctaLabel: 'Auditar imagen',
        ctaHref: '/studio/audit',
        ctaIcon: ScanEye,
      };
    }
    case Role.SUPERADMIN: {
      const users = await usersApi.list();
      const activos = users.filter((u) => u.activo).length;
      const creadores = users.filter((u) => u.rol === Role.CREADOR).length;
      return {
        stats: [
          { label: 'Usuarios activos', value: activos, hint: `${users.length} en total`, icon: Users },
          { label: 'Creadores', value: creadores, icon: PenLine },
          { label: 'Aprobadores', value: users.filter((u) => u.rol === Role.APROBADOR_A || u.rol === Role.APROBADOR_B).length, icon: ClipboardCheck },
        ],
        ctaLabel: 'Gestionar usuarios',
        ctaHref: '/admin/users',
        ctaIcon: Users,
      };
    }
    default:
      return { stats: [], ctaLabel: 'Continuar', ctaHref: '/', ctaIcon: ArrowRight };
  }
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <DashboardContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
