'use client'

import { type Table } from '@tanstack/react-table'
import { Columns, EyeOff } from 'lucide-react'
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
        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
          <Columns size={14} /> Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs font-medium">Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table.getAllColumns().filter((c) => c.getCanHide()).map((col) => {
          const header = typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id
          return (
            <DropdownMenuCheckboxItem
              key={col.id}
              checked={col.getIsVisible()}
              onCheckedChange={(v) => col.toggleVisibility(v)}
              className="text-xs capitalize"
            >
              {col.id === 'select' ? 'Select' : header}
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
