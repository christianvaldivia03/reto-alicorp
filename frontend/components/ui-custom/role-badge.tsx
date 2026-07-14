import { Role } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/roles';

const CLASSES: Record<Role, string> = {
  [Role.SUPERADMIN]: 'bg-purple-50 text-purple-800 ring-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:ring-purple-800/60',
  [Role.CREADOR]: 'bg-cyan-50 text-cyan-800 ring-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:ring-cyan-800/60',
  [Role.APROBADOR_A]: 'bg-orange-50 text-orange-800 ring-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:ring-orange-800/60',
  [Role.APROBADOR_B]: 'bg-pink-50 text-pink-800 ring-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:ring-pink-800/60',
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[0.7rem] font-medium ring-1 ring-inset ${
        CLASSES[role] || 'bg-muted text-muted-foreground ring-border'
      }`}
    >
      {ROLE_LABELS[role] || role}
    </span>
  );
}
