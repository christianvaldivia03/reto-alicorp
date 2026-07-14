import { cn } from '@/lib/utils'

// Skeleton con shimmer (ver .skeleton en globals.css). Reemplaza spinners en
// listas/tablas para evitar layout shift durante la carga.
export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('skeleton h-4 w-full', className)} {...props} />
}

// Bloque de tarjetas skeleton reutilizable para las colas/listas.
export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border p-4">
      <Skeleton className="mb-2 h-3 w-16" />
      <Skeleton className="mb-1.5 h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}
