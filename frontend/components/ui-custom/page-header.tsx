import type { ComponentType, ReactNode } from 'react';

// Encabezado de página consistente (título sobredimensionado + descripción + acción).
export function PageHeader({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3.5">
        {Icon && (
          <span className="mt-0.5 flex size-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Icon className="size-5" />
          </span>
        )}
        <div>
          <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-bold leading-tight tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
