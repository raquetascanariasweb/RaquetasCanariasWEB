'use client'

import { type Table } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Props<T> {
  table: Table<T>
}

export default function DataTablePagination<T>({ table }: Props<T>) {
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span className="text-xs">
        {table.getFilteredSelectedRowModel().rows.length} of{' '}
        {table.getFilteredRowModel().rows.length} row(s) selected
      </span>
      <div className="flex items-center gap-4">
        <span className="text-xs">Rows per page</span>
        <Select
          value={String(table.getState().pagination.pageSize)}
          onValueChange={(v) => table.setPageSize(Number(v))}
        >
          <SelectTrigger className="h-7 w-16 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50, 100].map((s) => (
              <SelectItem key={s} value={String(s)} className="text-xs">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
            <ChevronsLeft size={12} />
          </Button>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft size={12} />
          </Button>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight size={12} />
          </Button>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
            <ChevronsRight size={12} />
          </Button>
        </div>
      </div>
    </div>
  )
}
