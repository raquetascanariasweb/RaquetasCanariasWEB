'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  page: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
}

export default function SimplePagination({ page, totalPages, totalItems, onPageChange }: Props) {
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
      <span>{totalItems} elemento(s)</span>
      <div className="flex items-center gap-2">
        <span>Página {page + 1} de {Math.max(1, totalPages)}</span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => onPageChange(page - 1)} disabled={page <= 0}>
            <ChevronLeft size={12} />
          </Button>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1}>
            <ChevronRight size={12} />
          </Button>
        </div>
      </div>
    </div>
  )
}
