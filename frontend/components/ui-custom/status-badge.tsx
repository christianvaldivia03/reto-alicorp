import { ContentStatus, AuditStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: ContentStatus | AuditStatus | string;
  variant?: 'content' | 'audit';
}

export function StatusBadge({ status, variant = 'content' }: StatusBadgeProps) {
  const statusConfig = {
    // Content statuses
    [ContentStatus.DRAFT]: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
    [ContentStatus.PENDING_APPROVAL]: {
      label: 'Pending Approval',
      className: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300',
    },
    [ContentStatus.APPROVED]: {
      label: 'Approved',
      className: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300',
    },
    [ContentStatus.REJECTED]: {
      label: 'Rejected',
      className: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300',
    },
    [ContentStatus.PUBLISHED]: {
      label: 'Published',
      className: 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300',
    },
    // Audit statuses
    [AuditStatus.COMPLIANT]: {
      label: 'Compliant',
      className: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300',
    },
    [AuditStatus.NON_COMPLIANT]: {
      label: 'Non-Compliant',
      className: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300',
    },
    [AuditStatus.NEEDS_REVIEW]: {
      label: 'Needs Review',
      className: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300',
    },
  };

  const config = statusConfig[status as ContentStatus | AuditStatus] || {
    label: status,
    className: 'bg-muted text-muted-foreground',
  };

  return (
    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
