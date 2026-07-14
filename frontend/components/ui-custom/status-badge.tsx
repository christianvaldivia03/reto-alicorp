import { ContentStatus } from '@/lib/types';

const CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  [ContentStatus.PENDIENTE]: {
    label: 'Pendiente',
    className: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-800/60',
    dot: 'bg-amber-500',
  },
  [ContentStatus.APROBADO]: {
    label: 'Aprobado',
    className: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800/60',
    dot: 'bg-emerald-500',
  },
  [ContentStatus.RECHAZADO]: {
    label: 'Rechazado',
    className: 'bg-red-50 text-red-800 ring-red-200 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-800/60',
    dot: 'bg-red-500',
  },
};

export function StatusBadge({ status }: { status: ContentStatus | string }) {
  const config = CONFIG[status] || {
    label: status,
    className: 'bg-muted text-muted-foreground ring-border',
    dot: 'bg-muted-foreground',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${config.className}`}
    >
      <span className={`size-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
