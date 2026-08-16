import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'accent'
  className?: string
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'accent' }> = {
  active: { label: 'Activo', variant: 'default' },
  draft: { label: 'Borrador', variant: 'secondary' },
  archived: { label: 'Archivado', variant: 'outline' },
  paid: { label: 'Pagado', variant: 'default' },
  pending: { label: 'Pendiente', variant: 'accent' },
  processing: { label: 'Procesando', variant: 'secondary' },
  shipped: { label: 'Enviado', variant: 'default' },
  delivered: { label: 'Entregado', variant: 'default' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
  refunded: { label: 'Reembolsado', variant: 'destructive' },
  true: { label: 'Sí', variant: 'default' },
  false: { label: 'No', variant: 'outline' },
}

const variantClasses: Record<'default' | 'secondary' | 'outline' | 'destructive' | 'accent', string> = {
  default: 'border-transparent bg-admin-info/15 text-admin-info',
  secondary: 'border-transparent bg-admin-muted/15 text-admin-muted',
  outline: 'border-admin-border text-admin-muted',
  destructive: 'border-transparent bg-admin-danger/15 text-admin-danger',
  accent: 'border-transparent bg-admin-warning/15 text-admin-warning',
}

export default function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const config = statusMap[status] ?? { label: status, variant: 'outline' }
  const activeVariant = variant ?? config.variant

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        variantClasses[activeVariant],
        className
      )}
    >
      {config.label}
    </span>
  )
}
