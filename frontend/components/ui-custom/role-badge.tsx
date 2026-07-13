import { Role } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/roles';

const CLASSES: Record<Role, string> = {
  [Role.SUPERADMIN]: 'bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-300',
  [Role.CREADOR]: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-900/30 dark:text-cyan-300',
  [Role.APROBADOR_A]: 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-300',
  [Role.APROBADOR_B]: 'bg-pink-100 text-pink-900 dark:bg-pink-900/30 dark:text-pink-300',
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${
        CLASSES[role] || 'bg-muted text-muted-foreground'
      }`}
    >
      {ROLE_LABELS[role] || role}
    </span>
  );
}
