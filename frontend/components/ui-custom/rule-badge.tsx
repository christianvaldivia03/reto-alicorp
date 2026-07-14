import { RuleType } from '@/lib/types';

const CONFIG: Record<string, { label: string; className: string }> = {
  [RuleType.PROHIBICION]: {
    label: 'Prohibición',
    className: 'bg-red-50 text-red-800 ring-red-200 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-800/60',
  },
  [RuleType.OBLIGACION]: {
    label: 'Obligación',
    className: 'bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800/60',
  },
  [RuleType.RECOMENDACION]: {
    label: 'Recomendación',
    className: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800/60',
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
