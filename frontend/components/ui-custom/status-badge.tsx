import { ContentStatus } from '@/lib/types';

const CONFIG: Record<string, { label: string; className: string }> = {
  [ContentStatus.PENDIENTE]: {
    label: 'Pendiente',
    className: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300',
  },
  [ContentStatus.APROBADO]: {
    label: 'Aprobado',
    className: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  [ContentStatus.RECHAZADO]: {
    label: 'Rechazado',
    className: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300',
  },
};

export function StatusBadge({ status }: { status: ContentStatus | string }) {
  const config = CONFIG[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
