'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import {
  useReactTable, getCoreRowModel, getPaginationRowModel,
  getSortedRowModel, getFilteredRowModel, flexRender,
  type SortingState, type ColumnDef,
} from '@tanstack/react-table'
import {
  Search, ArrowUpDown, Eye, Trash2, Globe, FileText, Archive, FilterX, Keyboard, Download, Plus,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getOrders, updateOrderStatus, bulkDeleteOrders, bulkUpdateOrdersStatus, createOrder } from '@/lib/admin/orders'
import type { AdminOrder, OrderStatus } from '@/lib/admin/types'
import { ORDER_STATUS_LABELS } from '@/lib/admin/types'
import { toast } from 'sonner'
import DataTableViewOptions from '@/components/admin/DataTableViewOptions'
import DataTablePagination from '@/components/admin/DataTablePagination'
import RowContextMenu from '@/components/admin/RowContextMenu'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useAdminCurrency } from '../AdminLayoutClient'
import OrderDetailDialog from './OrderDetailDialog'

const STATUS_COLORS: Record<OrderStatus, string> = {
  draft: 'bg-admin-slate/10 text-admin-slate border-admin-slate/30',
  pending: 'bg-admin-warning/10 text-admin-warning border-admin-warning/30',
  paid: 'bg-admin-info/10 text-admin-info border-admin-info/30',
  processing: 'bg-admin-info/10 text-admin-info border-admin-info/30',
  shipped: 'bg-admin-info/10 text-admin-info border-admin-info/30',
  delivered: 'bg-admin-success/10 text-admin-success border-admin-success/30',
  cancelled: 'bg-admin-danger/10 text-admin-danger border-admin-danger/30',
  refunded: 'bg-admin-slate/10 text-admin-slate border-admin-slate/30',
}

export default function AdminOrdersPage() {
  const { formatPrice: fmt } = useAdminCurrency()
  const [data, setData] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }])
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [rowSelection, setRowSelection] = useState({})
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [createForm, setCreateForm] = useState({
    user_id: '',
    items: [{ product_id: '', product_name: '', quantity: 1, price_cents: 0, size: '', color: '' }],
    notes: '',
  })

  function resetCreateForm() {
    setCreateForm({
      user_id: '',
      items: [{ product_id: '', product_name: '', quantity: 1, price_cents: 0, size: '', color: '' }],
      notes: '',
    })
  }

  function addItem() {
    setCreateForm({
      ...createForm,
      items: [...createForm.items, { product_id: '', product_name: '', quantity: 1, price_cents: 0, size: '', color: '' }],
    })
  }

  function removeItem(idx: number) {
    setCreateForm({ ...createForm, items: createForm.items.filter((_, i) => i !== idx) })
  }

  function updateItem(idx: number, field: string, value: any) {
    const items = [...createForm.items]
    items[idx] = { ...items[idx], [field]: value }
    setCreateForm({ ...createForm, items })
  }

  async function handleCreate() {
    if (!createForm.user_id.trim()) return toast.error('ID de cliente requerido')
    if (createForm.items.length === 0 || !createForm.items[0].product_name) return toast.error('Se requiere al menos un artículo')
    setSaving(true)
    const res = await createOrder({ user_id: createForm.user_id, items: createForm.items, notes: createForm.notes })
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Pedido creado')
      setShowCreate(false)
      resetCreateForm()
      load()
    }
    setSaving(false)
  }

  async function load() {
    try {
      const orders = await getOrders(statusFilter !== 'all' ? statusFilter : undefined)
      setData(orders)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [statusFilter])

  useKeyboardShortcuts({
    'k': () => searchRef.current?.focus(),
    'Escape': () => { setShowShortcuts(false); setSelectedOrder(null); setBulkDeleteOpen(false) },
    '?': () => setShowShortcuts(true),
  })

  const selectedIds = useMemo(() => Object.keys(rowSelection), [rowSelection])
  const selectedCount = selectedIds.length

  async function handleStatusChange(id: string, status: OrderStatus) {
    const res = await updateOrderStatus(id, status)
    if (res.error) { toast.error(res.error) }
    else {
      toast.success(`Pedido #${id.slice(0, 8)} → ${ORDER_STATUS_LABELS[status]}`)
      setData((prev) => prev.map((o) => o.id === id ? { ...o, status } : o))
    }
  }

  async function handleBulkStatus(status: OrderStatus) {
    const res = await bulkUpdateOrdersStatus(selectedIds, status)
    if (res.error) { toast.error(res.error) }
    else {
      toast.success(`${selectedIds.length} pedidos marcados como ${ORDER_STATUS_LABELS[status]}`)
      setData((prev) => prev.map((o) => selectedIds.includes(o.id) ? { ...o, status } : o))
      setRowSelection({})
    }
  }

  async function handleBulkDelete() {
    const res = await bulkDeleteOrders(selectedIds)
    if (res.error) { toast.error(res.error) }
    else {
      toast.success(`${selectedIds.length} pedidos eliminados`)
      setData((prev) => prev.filter((o) => !selectedIds.includes(o.id)))
      setRowSelection({})
    }
    setBulkDeleteOpen(false)
  }

  function handleExportExcel() {
    const headers = ['ID de pedido', 'Fecha', 'Estado', 'Total (€)', 'Artículos', 'Cliente', 'Dirección de envío', 'Seguimiento']
    const rows = data.map((order) => {
      const total = (order.total_cents / 100).toFixed(2)
      const date = new Date(order.created_at).toLocaleDateString('es-ES')
      const items = order.items?.map((i) => `${i.product_name} x${i.quantity}`).join('; ') || ''
      const address = order.shipping_address
        ? `${order.shipping_address.name || ''}, ${order.shipping_address.line1 || ''}, ${order.shipping_address.city || ''}, ${order.shipping_address.country || ''}`
        : ''
      return [
        `#${order.id.slice(0, 8)}`,
        date,
        ORDER_STATUS_LABELS[order.status] || order.status,
        total,
        items,
        order.user_id.slice(0, 8),
        address,
        order.tracking_number || '',
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pedidos-sportbalin-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${data.length} pedidos exportados`)
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const columns: ColumnDef<AdminOrder>[] = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <input type="checkbox" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} className="rounded border-input" />
      ),
      cell: ({ row }) => (
        <input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} className="rounded border-input" />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'id',
      header: 'Pedido',
      cell: ({ getValue }) => <span className="font-mono text-xs">#{(String(getValue())).slice(0, 8)}</span>,
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 text-xs font-medium">
          Fecha <ArrowUpDown size={12} />
        </button>
      ),
      cell: ({ getValue }) => <span className="text-xs">{formatDate(String(getValue()))}</span>,
    },
    {
      accessorKey: 'items',
      header: 'Artículos',
      cell: ({ getValue }) => {
        const items = getValue() as any[]
        const count = items?.reduce((s: number, i: any) => s + (i.quantity ?? 1), 0) ?? 0
        return <span className="text-xs">{count}</span>
      },
    },
    {
      accessorKey: 'total_cents',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 text-xs font-medium">
          Total <ArrowUpDown size={12} />
        </button>
      ),
      cell: ({ getValue }) => <span className="font-mono text-xs">{fmt(Number(getValue()))}</span>,
    },
    {
      accessorKey: 'payment_method',
      header: 'Pago',
      cell: ({ getValue }) => {
        const method = getValue() as string | null
        if (!method) return <span className="text-xs text-muted-foreground">—</span>
        const label = method === 'bizum' ? 'Bizum' : method === 'stripe' ? 'Stripe' : method
        return <Badge variant="outline" className="text-xs capitalize">{label}</Badge>
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.original.status as OrderStatus
        return (
          <Select value={status} onValueChange={(v) => handleStatusChange(row.original.id, v as OrderStatus)}>
            <SelectTrigger className={`w-32 h-8 text-xs ${STATUS_COLORS[status] ?? ''}`}>
              <SelectValue>{ORDER_STATUS_LABELS[status] ?? status}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(row.original)}>
          <Eye size={14} className="mr-1" /> Ver
        </Button>
      ),
    },
  ], [])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
    getRowId: (originalRow: AdminOrder) => originalRow.id,
  })

  function clearFilters() {
    setStatusFilter('all'); setGlobalFilter('')
  }

  const hasFilters = statusFilter !== 'all' || globalFilter !== ''

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-10 w-48 bg-muted rounded" />
      <div className="h-96 bg-muted rounded-lg" />
    </div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display tracking-wider text-foreground">Pedidos</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => { resetCreateForm(); setShowCreate(true) }}>
            <Plus size={16} className="mr-2" /> Nuevo pedido
          </Button>
          <Button variant="outline" size="sm" className="gap-1 h-8 text-xs" onClick={() => setShowShortcuts(true)}>
            <Keyboard size={14} /> Atajos
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input ref={searchRef} placeholder="Buscar pedidos..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="pl-9" />
        </div>
        <DataTableViewOptions table={table} />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (<Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1"><FilterX size={12} /> Limpiar</Button>)}
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleExportExcel}>
          <Download size={12} /> Exportar Excel
        </Button>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-accent/30 rounded-lg border border-border">
          <span className="text-sm font-medium">{selectedCount} seleccionados</span>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                <Globe size={12} /> Marcar como...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                <DropdownMenuItem key={key} onClick={() => handleBulkStatus(key as OrderStatus)} className="text-xs">{label}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="destructive" size="sm" className="h-8 text-xs gap-1" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 size={12} /> Eliminar
          </Button>
        </div>
      )}

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
                  { label: 'Ver detalles', icon: <Eye size={14} />, onClick: () => setSelectedOrder(row.original) },
                  ...(row.original.stripe_session_id ? [{
                    label: 'Enlace de Stripe', icon: <Globe size={14} />, onClick: () => window.open(`https://dashboard.stripe.com/payments/${row.original.stripe_session_id}`, '_blank'),
                  }] : []),
                ]}>
                  <TableRow data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                </RowContextMenu>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <TableRow><TableCell colSpan={columns.length} className="text-center text-muted-foreground py-12">No se encontraron pedidos</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DataTablePagination table={table} />

      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar {selectedCount} pedidos</DialogTitle>
            <DialogDescription>¿Estás seguro? Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleBulkDelete}>Eliminar {selectedCount} pedidos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent>
          <DialogHeader><DialogTitle>Atajos de teclado</DialogTitle><DialogDescription>Atajos disponibles para la página de pedidos.</DialogDescription></DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Enfocar la búsqueda</span><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Ctrl+K</kbd></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cerrar diálogos</span><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Esc</kbd></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Mostrar atajos</span><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">?</kbd></div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedOrder && (
        <OrderDetailDialog
          open={!!selectedOrder}
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdated={(updated) => {
            setData((prev) => prev.map((o) => o.id === updated.id ? updated : o))
            setSelectedOrder(updated)
          }}
        />
      )}

      <Dialog open={showCreate} onOpenChange={(o) => !o && setShowCreate(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear pedido</DialogTitle>
            <DialogDescription>Crear un pedido en nombre de un cliente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label htmlFor="no_user">ID de cliente de Clerk *</Label>
              <Input
                id="no_user"
                value={createForm.user_id}
                onChange={(e) => setCreateForm({ ...createForm, user_id: e.target.value })}
                placeholder="user_..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Artículos</Label>
                <Button variant="outline" size="sm" onClick={addItem} className="h-7 text-xs">
                  <Plus size={12} className="mr-1" /> Añadir artículo
                </Button>
              </div>
              {createForm.items.map((item, idx) => (
                <div key={idx} className="border border-border rounded-lg p-3 mb-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Artículo {idx + 1}</span>
                    {createForm.items.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="text-xs text-destructive">Quitar</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <Input
                        placeholder="Nombre del producto"
                        value={item.product_name}
                        onChange={(e) => updateItem(idx, 'product_name', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Cant."
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Precio (céntimos)"
                        min={0}
                        value={item.price_cents}
                        onChange={(e) => updateItem(idx, 'price_cents', parseInt(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Talla"
                        value={item.size}
                        onChange={(e) => updateItem(idx, 'size', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Color"
                        value={item.color}
                        onChange={(e) => updateItem(idx, 'color', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <Label htmlFor="no_notes">Notas</Label>
              <textarea
                id="no_notes"
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? 'Creando...' : 'Crear pedido'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

