'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle size={28} className="text-destructive" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">Algo salió mal</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
          {error.message || 'Ocurrió un error inesperado. Inténtalo de nuevo.'}
        </p>
        <Button variant="outline" onClick={reset}>
          Reintentar
        </Button>
      </CardContent>
    </Card>
  )
}
