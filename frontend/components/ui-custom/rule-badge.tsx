import { RuleType } from '@/lib/types';

const CONFIG: Record<string, { label: string; className: string }> = {
  [RuleType.PROHIBICION]: {
    label: 'Prohibición',
    className: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300',
  },
  [RuleType.OBLIGACION]: {
    label: 'Obligación',
    className: 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300',
  },
  [RuleType.RECOMENDACION]: {
    label: 'Recomendación',
    className: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
};

export function RuleTypeBadge({ tipo }: { tipo: RuleType | string }) {
  const config = CONFIG[tipo] || { label: tipo, className: 'bg-muted text-muted-foreground' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
