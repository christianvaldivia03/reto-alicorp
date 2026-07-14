import { RuleType } from '@/lib/types';

const CONFIG: Record<string, { label: string; className: string }> = {
  [RuleType.PROHIBICION]: {
    label: 'Prohibición',
    className: 'bg-destructive/10 text-destructive-text ring-destructive/25',
  },
  [RuleType.OBLIGACION]: {
    label: 'Obligación',
    className: 'bg-brand/10 text-brand-text ring-brand/25',
  },
  [RuleType.RECOMENDACION]: {
    label: 'Recomendación',
    className: 'bg-success/10 text-success-text ring-success/25',
  },
};

export function RuleTypeBadge({ tipo }: { tipo: RuleType | string }) {
  const config = CONFIG[tipo] || { label: tipo, className: 'bg-muted text-muted-foreground ring-border' };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[0.7rem] font-medium ring-1 ring-inset ${config.className}`}
    >
      {config.label}
    </span>
  );
}
