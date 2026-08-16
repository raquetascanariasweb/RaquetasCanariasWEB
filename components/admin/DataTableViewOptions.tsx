'use client'

import { type Table } from '@tanstack/react-table'
import { Columns } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Props<T> {
  table: Table<T>
}

export default function DataTableViewOptions<T>({ table }: Props<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs border-admin-border bg-admin-surface text-admin-text hover:bg-white/5 hover:text-white">
          <Columns size={14} /> Columnas
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 border-admin-border bg-admin-surface">
        <DropdownMenuLabel className="text-xs font-medium text-admin-muted">Mostrar/ocultar columnas</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-admin-border" />
        {table.getAllColumns().filter((c) => c.getCanHide()).map((col) => {
          const header = typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id
          return (
            <DropdownMenuCheckboxItem
              key={col.id}
              checked={col.getIsVisible()}
              onCheckedChange={(v) => col.toggleVisibility(v)}
              className="text-xs capitalize text-admin-text hover:bg-white/5 focus:bg-white/5"
            >
              {col.id === 'select' ? 'Seleccionar' : header}
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
