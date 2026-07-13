import { UserRole } from '@/lib/types';

interface RoleBadgeProps {
  role: UserRole | string;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const roleConfig = {
    [UserRole.ADMIN]: {
      label: 'Admin',
      className: 'bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-300',
    },
    [UserRole.BRAND_MANAGER]: {
      label: 'Brand Manager',
      className: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-300',
    },
    [UserRole.CONTENT_CREATOR]: {
      label: 'Content Creator',
      className: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-900/30 dark:text-cyan-300',
    },
    [UserRole.APPROVER]: {
      label: 'Approver',
      className: 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-300',
    },
    [UserRole.AUDITOR]: {
      label: 'Auditor',
      className: 'bg-pink-100 text-pink-900 dark:bg-pink-900/30 dark:text-pink-300',
    },
  };

  const config = roleConfig[role as UserRole] || {
    label: role,
    className: 'bg-muted text-muted-foreground',
  };

  return (
    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
