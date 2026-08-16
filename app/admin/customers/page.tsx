'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import {
  useReactTable, getCoreRowModel, getPaginationRowModel,
  getSortedRowModel, flexRender,
  type SortingState, type ColumnDef,
} from '@tanstack/react-table'
import { Search, ArrowUpDown, Mail, ShoppingBag, Eye, Keyboard } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { getCustomers, getCustomerOrders } from '@/lib/admin/customers'
import type { AdminCustomer, AdminOrder } from '@/lib/admin/types'
import { ORDER_STATUS_LABELS } from '@/lib/admin/types'
import DataTableViewOptions from '@/components/admin/DataTableViewOptions'
import DataTablePagination from '@/components/admin/DataTablePagination'
import RowContextMenu from '@/components/admin/RowContextMenu'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useAdminCurrency } from '../AdminLayoutClient'

export default function AdminCustomersPage() {
  const { formatPrice: fmt } = useAdminCurrency()
  const [data, setData] = useState<AdminCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'total_spent', desc: true }])
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null)
  const [customerOrders, setCustomerOrders] = useState<AdminOrder[]>([])
  const [showShortcuts, setShowShortcuts] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  async function load() {
    try {
      setData(await getCustomers())
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useKeyboardShortcuts({
    'k': () => searchRef.current?.focus(),
    'Escape': () => { setShowShortcuts(false); setSelectedCustomer(null) },
    '?': () => setShowShortcuts(true),
  })

  async function viewCustomer(customer: AdminCustomer) {
    setSelectedCustomer(customer)
    try {
      const orders = await getCustomerOrders(customer.id)
      setCustomerOrders(orders as AdminOrder[])
    } catch { setCustomerOrders([]) }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })

  const columns: ColumnDef<AdminCustomer>[] = useMemo(() => [
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 text-xs font-medium">
          Cliente <ArrowUpDown size={12} />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">{row.original.first_name?.[0]}{row.original.last_name?.[0]}</span>
          </div>
          <div>
            <p className="text-sm font-medium">
              {row.original.first_name || row.original.last_name
                ? `${row.original.first_name} ${row.original.last_name}`
                : 'Desconocido'}
            </p>
            {row.original.email && <p className="text-xs text-muted-foreground">{row.original.email}</p>}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'order_count',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 text-xs font-medium">
          Pedidos <ArrowUpDown size={12} />
        </button>
      ),
      cell: ({ getValue }) => <span className="text-sm">{String(getValue())}</span>,
    },
    {
      accessorKey: 'total_spent',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 text-xs font-medium">
          Total gastado <ArrowUpDown size={12} />
        </button>
      ),
      cell: ({ getValue }) => <span className="font-mono text-sm">{fmt(Number(getValue()))}</span>,
    },
    {
      accessorKey: 'created_at',
      header: 'Alta',
      cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{formatDate(String(getValue()))}</span>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => viewCustomer(row.original)}>
          <Eye size={14} className="mr-1" /> Ver
        </Button>
      ),
    },
  ], [])

  // eslint-disable-next-line react-hooks/incompatible-library -- uso idiomático de TanStack Table (useReactTable)
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-10 w-48 bg-muted rounded" />
      <div className="h-96 bg-muted rounded-lg" />
    </div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display tracking-wider text-foreground">Clientes</h1>
        <Button variant="outline" size="sm" className="gap-1 h-8 text-xs" onClick={() => setShowShortcuts(true)}>
          <Keyboard size={14} /> Atajos
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input ref={searchRef} placeholder="Buscar clientes..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="pl-9" />
        </div>
        <DataTableViewOptions table={table} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <RowContextMenu key={row.id} actions={[
                  { label: 'Ver detalles', icon: <Eye size={14} />, onClick: () => viewCustomer(row.original) },
                  { label: 'Enviar correo', icon: <Mail size={14} />, onClick: () => row.original.email && window.open(`mailto:${row.original.email}`) },
                ]}>
                  <TableRow data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                </RowContextMenu>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <TableRow><TableCell colSpan={columns.length} className="text-center text-muted-foreground py-12">No se encontraron clientes</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DataTablePagination table={table} />

      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent>
          <DialogHeader><DialogTitle>Atajos de teclado</DialogTitle><DialogDescription>Atajos disponibles para la página de clientes.</DialogDescription></DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Enfocar la búsqueda</span><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Ctrl+K</kbd></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cerrar diálogos</span><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Esc</kbd></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Mostrar atajos</span><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">?</kbd></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedCustomer} onOpenChange={(o) => !o && setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCustomer?.first_name || selectedCustomer?.last_name
                ? `${selectedCustomer?.first_name} ${selectedCustomer?.last_name}`
                : 'Cliente'}
            </DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  {selectedCustomer.email ? (
                    <a href={`mailto:${selectedCustomer.email}`} className="flex items-center gap-1 text-primary"><Mail size={12} /> {selectedCustomer.email}</a>
                  ) : <p className="text-muted-foreground">N/A</p>}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total gastado</p>
                  <p className="font-mono text-lg">{fmt(selectedCustomer.total_spent)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pedidos</p>
                  <p>{selectedCustomer.order_count}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cliente desde</p>
                  <p>{formatDate(selectedCustomer.created_at)}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-1"><ShoppingBag size={14} /> Historial de pedidos</h3>
                {customerOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin pedidos todavía</p>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-2 rounded bg-accent/10 text-sm">
                        <span className="font-mono text-xs">#{order.id.slice(0, 8)}</span>
                        <Badge variant="outline" className="text-[10px]">{ORDER_STATUS_LABELS[order.status] || order.status}</Badge>
                        <span className="font-mono text-xs">{fmt(order.total_cents)}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(order.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
