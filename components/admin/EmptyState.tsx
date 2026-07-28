import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon size={28} className="text-muted-foreground/60" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
            {description}
          </p>
        )}
        {action}
      </CardContent>
    </Card>
  )
}
