import { ContentStatus } from '@/lib/types';

const CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  [ContentStatus.PENDIENTE]: {
    label: 'Pendiente',
    className: 'bg-warning/10 text-warning-text ring-warning/25',
    dot: 'bg-warning',
  },
  [ContentStatus.APROBADO]: {
    label: 'Aprobado',
    className: 'bg-success/10 text-success-text ring-success/25',
    dot: 'bg-success',
  },
  [ContentStatus.RECHAZADO]: {
    label: 'Rechazado',
    className: 'bg-destructive/10 text-destructive-text ring-destructive/25',
    dot: 'bg-destructive',
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
