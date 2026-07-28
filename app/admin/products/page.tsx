'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import {
  useReactTable, getCoreRowModel, getPaginationRowModel,
  getSortedRowModel, getFilteredRowModel, flexRender,
  type SortingState, type ColumnDef, type ColumnFiltersState,
} from '@tanstack/react-table'
import {
  Plus, Search, Edit, Trash2, MoreHorizontal, ArrowUpDown, ImageIcon,
  Copy, Eye, Globe, FileText, Archive, FilterX, Keyboard,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { getProducts, deleteProduct, bulkDeleteProducts, bulkUpdateProducts, duplicateProduct } from '@/lib/admin/products'
import { getCategories } from '@/lib/admin/categories'
import { useAdminCurrency } from '../AdminLayoutClient'
import type { AdminProduct, AdminCategory, ProductStatus } from '@/lib/admin/types'
import { toast } from 'sonner'
import DataTableViewOptions from '@/components/admin/DataTableViewOptions'
import DataTablePagination from '@/components/admin/DataTablePagination'
import RowContextMenu from '@/components/admin/RowContextMenu'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import ProductFormDialog from './ProductFormDialog'
import QuickEditDialog from './QuickEditDialog'
import ProductPreviewDialog from './ProductPreviewDialog'

const STATUS_CONFIG: Record<ProductStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-admin-success/10 text-admin-success border-admin-success/20' },
  draft: { label: 'Draft', className: 'bg-admin-warning/10 text-admin-warning border-admin-warning/20' },
  archived: { label: 'Archived', className: 'bg-admin-slate/10 text-admin-slate border-admin-slate/20' },
}

type StockFilter = 'all' | 'in' | 'out' | 'low'

export default function AdminProductsPage() {
  const { formatPrice: fmt, code: currencyCode } = useAdminCurrency()
  const [data, setData] = useState<AdminProduct[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<AdminProduct | null>(null)
  const [quickEditProduct, setQuickEditProduct] = useState<AdminProduct | null>(null)
  const [previewProduct, setPreviewProduct] = useState<AdminProduct | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const searchRef = useRef<HTMLInputElement>(null)

  async function load() {
    try {
      const [products, cats] = await Promise.all([getProducts(), getCategories()])
      setData(products)
      setCategories(cats)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useKeyboardShortcuts({
    'k': () => searchRef.current?.focus(),
    'n': () => setShowAdd(true),
    'Escape': () => {
      setShowShortcuts(false); setDeleteId(null); setBulkDeleteOpen(false);
      setEditProduct(null); setQuickEditProduct(null); setPreviewProduct(null)
    },
    '?': () => setShowShortcuts(true),
  })

  const selectedCount = Object.keys(rowSelection).length
  const selectedIds = useMemo(() => Object.keys(rowSelection), [rowSelection])

  async function handleDelete(id: string) {
    const res = await deleteProduct(id)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Product deleted')
      setData((prev) => prev.filter((p) => p.id !== id))
    }
    setDeleteId(null)
  }

  async function handleBulkDelete() {
    const res = await bulkDeleteProducts(selectedIds)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(`${selectedIds.length} products deleted`)
      setData((prev) => prev.filter((p) => !selectedIds.includes(p.id)))
      setRowSelection({})
    }
    setBulkDeleteOpen(false)
  }

  async function handleBulkStatus(status: ProductStatus) {
    const res = await bulkUpdateProducts(selectedIds, { status })
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(`${selectedIds.length} products updated to ${status}`)
      setData((prev) => prev.map((p) => selectedIds.includes(p.id) ? { ...p, status } : p))
      setRowSelection({})
    }
  }

  async function handleDuplicate(id: string) {
    const res = await duplicateProduct(id)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Product duplicated')
      load()
    }
  }

  const handleGlobalFilter = useCallback((value: string) => {
    setGlobalFilter(value)
    setRowSelection({})
  }, [])

  const filteredData = useMemo(() => {
    let result = [...data]
    if (statusFilter !== 'all') result = result.filter((p) => p.status === statusFilter)
    if (categoryFilter !== 'all') result = result.filter((p) => p.category_id === categoryFilter)
    if (stockFilter !== 'all') {
      result = result.filter((p) => {
        if (stockFilter === 'in') return p.in_stock
        if (stockFilter === 'out') return !p.in_stock
        if (stockFilter === 'low') return p.track_inventory && p.stock_quantity > 0 && p.stock_quantity <= 5
        return true
      })
    }
    return result
  }, [data, statusFilter, categoryFilter, stockFilter])

  const columns: ColumnDef<AdminProduct>[] = useMemo(() => [
    {
      id: 'select',
      size: 40,
      minSize: 40,
      header: ({ table }) => (
        <input type="checkbox" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} className="rounded border-input" />
      ),
      cell: ({ row }) => (
        <input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} className="rounded border-input" />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 text-xs font-medium">
          Name <ArrowUpDown size={12} />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
            {row.original.images?.[0]?.url ? (
              <img src={row.original.images[0].url} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon size={14} className="text-muted-foreground" />
            )}
          </div>
          <span className="font-medium text-sm truncate">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'category_name',
      size: 130,
      minSize: 100,
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 text-xs font-medium">
          Category <ArrowUpDown size={12} />
        </button>
      ),
      cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{String(getValue() ?? '-')}</span>,
    },
    {
      accessorKey: 'status',
      size: 100,
      minSize: 80,
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 text-xs font-medium">
          Status <ArrowUpDown size={12} />
        </button>
      ),
      cell: ({ getValue }) => {
        const status = getValue() as ProductStatus
        const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
        return <Badge variant="outline" className={`${cfg.className} text-[10px]`}>{cfg.label}</Badge>
      },
    },
    {
      accessorKey: 'price_cents',
      size: 100,
      minSize: 80,
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 text-xs font-medium">
          Price <ArrowUpDown size={12} />
        </button>
      ),
      cell: ({ getValue }) => <span className="font-mono text-xs">{fmt(Number(getValue()))}</span>,
    },
    {
      id: 'stock_status',
      accessorFn: (row) => {
        if (!row.in_stock) return 'out'
        if (row.track_inventory && row.stock_quantity <= 5) return 'low'
        return 'in'
      },
      size: 130,
      minSize: 100,
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 text-xs font-medium">
          Stock <ArrowUpDown size={12} />
        </button>
      ),
      cell: ({ row }) => {
        const hasInv = row.original.track_inventory
        const qty = row.original.stock_quantity
        const inStock = row.original.in_stock
        const isLow = hasInv && qty > 0 && qty <= 5
        return (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLow ? 'bg-admin-warning' : inStock ? 'bg-admin-success' : 'bg-admin-danger'}`} />
            <span className="text-xs">{isLow ? 'Low Stock' : inStock ? 'In Stock' : 'Out of Stock'}</span>
            {hasInv && <span className="text-[10px] text-muted-foreground">({qty})</span>}
          </div>
        )
      },
    },
    {
      accessorKey: 'created_at',
      size: 130,
      minSize: 100,
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 text-xs font-medium">
          Created <ArrowUpDown size={12} />
        </button>
      ),
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(String(getValue())).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
    {
      id: 'actions',
      size: 60,
      minSize: 60,
      header: () => null,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal size={14} /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => setEditProduct(row.original)}><Edit size={14} className="mr-2" /> Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setQuickEditProduct(row.original)}><FileText size={14} className="mr-2" /> Quick Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDuplicate(row.original.id)}><Copy size={14} className="mr-2" /> Duplicate</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPreviewProduct(row.original)}><Eye size={14} className="mr-2" /> Preview</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(row.original.id)}><Trash2 size={14} className="mr-2" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, columnFilters, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: handleGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
    getRowId: (originalRow: AdminProduct) => originalRow.id,
  })

  function clearFilters() {
    setStatusFilter('all'); setCategoryFilter('all'); setStockFilter('all')
    setGlobalFilter(''); setColumnFilters([])
  }

  const hasFilters = statusFilter !== 'all' || categoryFilter !== 'all' || stockFilter !== 'all' || globalFilter !== ''

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
          <div className="h-9 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-10 w-full max-w-sm bg-muted rounded animate-pulse" />
        <div className="h-96 bg-muted rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif tracking-wider text-foreground">Products</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1 h-8 text-xs" onClick={() => setShowShortcuts(true)}>
            <Keyboard size={14} /> Shortcuts
          </Button>
          <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => setShowAdd(true)}><Plus size={14} /> Add Product</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input ref={searchRef} placeholder="Search products..." value={globalFilter} onChange={(e) => handleGlobalFilter(e.target.value)} className="pl-9" />
        </div>
        <DataTableViewOptions table={table} />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as StockFilter)}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Stock" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock</SelectItem>
            <SelectItem value="in">In Stock</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (<Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1"><FilterX size={12} /> Clear</Button>)}
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-accent/30 rounded-lg border border-border">
          <span className="text-sm font-medium">{selectedCount} selected</span>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => handleBulkStatus('active')}><Globe size={12} /> Publish</Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => handleBulkStatus('draft')}><FileText size={12} /> Draft</Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => handleBulkStatus('archived')}><Archive size={12} /> Archive</Button>
          <Button variant="destructive" size="sm" className="h-8 text-xs gap-1" onClick={() => setBulkDeleteOpen(true)}><Trash2 size={12} /> Delete</Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table className="table-fixed">
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => {
                    const size = h.getSize()
                    return (
                      <TableHead key={h.id} style={size ? { width: size } : undefined}>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <RowContextMenu key={row.id} actions={[
                  { label: 'Edit', icon: <Edit size={14} />, onClick: () => setEditProduct(row.original) },
                  { label: 'Quick Edit', icon: <FileText size={14} />, onClick: () => setQuickEditProduct(row.original) },
                  { label: 'Duplicate', icon: <Copy size={14} />, onClick: () => handleDuplicate(row.original.id) },
                  { label: 'Preview', icon: <Eye size={14} />, onClick: () => setPreviewProduct(row.original) },
                  { label: 'Delete', icon: <Trash2 size={14} />, onClick: () => setDeleteId(row.original.id), destructive: true },
                ]}>
                  <TableRow data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                </RowContextMenu>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <TableRow><TableCell colSpan={columns.length} className="text-center text-muted-foreground py-12">No products found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DataTablePagination table={table} />

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Product</DialogTitle><DialogDescription>Are you sure? This action cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedCount} Products</DialogTitle>
            <DialogDescription>Are you sure? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDelete}>Delete {selectedCount} Products</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent>
          <DialogHeader><DialogTitle>Keyboard Shortcuts</DialogTitle><DialogDescription>Available shortcuts for the products page.</DialogDescription></DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Focus search</span><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Ctrl+K</kbd></div>
            <div className="flex justify-between"><span className="text-muted-foreground">New product</span><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">N</kbd></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Close dialogs</span><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Esc</kbd></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Show shortcuts</span><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">?</kbd></div>
          </div>
        </DialogContent>
      </Dialog>

      {showAdd && <ProductFormDialog open={showAdd} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load() }} />}
      {editProduct && <ProductFormDialog key={editProduct.id} open={!!editProduct} product={editProduct} onClose={() => setEditProduct(null)} onSaved={() => { setEditProduct(null); load() }} />}
      {quickEditProduct && <QuickEditDialog key={quickEditProduct.id} open={true} product={quickEditProduct} onClose={() => setQuickEditProduct(null)} onSaved={() => { setQuickEditProduct(null); load() }} />}
      {previewProduct && <ProductPreviewDialog open={!!previewProduct} product={previewProduct} onClose={() => setPreviewProduct(null)} />}
    </div>
  )
}

