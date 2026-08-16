'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import {
  useReactTable, getCoreRowModel, getPaginationRowModel,
  getSortedRowModel, getFilteredRowModel, flexRender,
  type SortingState, type ColumnDef, type ColumnFiltersState,
} from '@tanstack/react-table'
import {
  Plus, Search, Edit, Pencil, Trash2, MoreHorizontal, ArrowUpDown, ImageIcon,
  Copy, Eye, Globe, FileText, Archive, FilterX, Keyboard, Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { getProducts, deleteProduct, bulkDeleteProducts, bulkUpdateProducts, duplicateProduct, quickUpdateProduct } from '@/lib/admin/products'
import { getCategories } from '@/lib/admin/categories'
import { getFeaturedProductIds, toggleFeaturedByProductId } from '@/lib/admin/featured-products'
import { useAdminCurrency } from '../AdminLayoutClient'
import type { AdminProduct, AdminCategory, ProductStatus } from '@/lib/admin/types'
import { toast } from 'sonner'
import DataTableViewOptions from '@/components/admin/DataTableViewOptions'
import DataTablePagination from '@/components/admin/DataTablePagination'
import RowContextMenu from '@/components/admin/RowContextMenu'
import PageHeader from '@/components/admin/PageHeader'
import PageSkeleton from '@/components/admin/PageSkeleton'
import StatusBadge from '@/components/admin/StatusBadge'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import ProductFormDialog from './ProductFormDialog'
import QuickEditDialog from './QuickEditDialog'
import ProductPreviewDialog from './ProductPreviewDialog'

type StockFilter = 'all' | 'in' | 'out' | 'low'

function StockCell({ row, onRefresh }: { row: any; onRefresh?: () => void }) {
  const qty = row.original.stock_quantity
  const inStock = row.original.in_stock
  const isLow = qty > 0 && qty <= 5
  const [editing, setEditing] = useState(false)
  const [editQty, setEditQty] = useState(qty)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

    async function save() {
      const newStock = editQty
      const newInStock = newStock > 0
      const res = await quickUpdateProduct(row.original.id, {
        stock_quantity: newStock,
        in_stock: newInStock,
      })
    if (res.error) {
      toast.error(res.error)
    } else {
      onRefresh?.()
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="number"
          min={0}
          value={editQty}
          onChange={(e) => setEditQty(Number(e.target.value))}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          onBlur={save}
          className="w-16 h-7 px-2 text-xs border border-admin-border rounded bg-admin-surface text-admin-text"
        />
      </div>
    )
  }

  return (
    <button onClick={(e) => { e.stopPropagation(); setEditQty(qty); setEditing(true) }} className="flex items-center gap-2 cursor-pointer hover:opacity-80">
      <div className={`w-2 h-2 rounded-full ${isLow ? 'bg-admin-warning' : inStock ? 'bg-admin-success' : 'bg-admin-danger'}`} />
      <span className="text-xs">{isLow ? 'Stock bajo' : inStock ? 'En stock' : 'Agotado'}</span>
      <span className="text-[10px] text-admin-muted">({qty})</span>
      <span className="text-admin-muted hover:text-admin-text underline text-[10px]">Editar</span>
    </button>
  )
}

function CategorySelectItem({ cat, depth = 0 }: { cat: AdminCategory; depth?: number }) {
  const children = cat.children
  return (
    <>
      <SelectItem value={cat.id}>
        <span style={{ paddingLeft: depth * 16 }}>{cat.name}</span>
      </SelectItem>
      {children?.map((child) => (
        <CategorySelectItem key={child.id} cat={child} depth={depth + 1} />
      ))}
    </>
  )
}

function CategoryCell({ row, categories, onRefresh }: { row: { original: AdminProduct }; categories: AdminCategory[]; onRefresh?: () => void }) {
  const [open, setOpen] = useState(false)

  const catNameMap = useMemo(() => {
    const map = new Map<string, string>()
    function walk(cats: AdminCategory[]) {
      for (const c of cats) {
        map.set(c.id, c.name)
        if (c.children) walk(c.children)
      }
    }
    walk(categories)
    return map
  }, [categories])

  const ids: string[] = row.original.category_ids ?? []
  const displayNames = ids.length > 0
    ? ids.map(id => catNameMap.get(id) || id.slice(0, 8)).join(', ')
    : '-'

  async function toggleCat(catId: string) {
    const current = new Set(row.original.category_ids ?? [])
    if (current.has(catId)) current.delete(catId)
    else current.add(catId)
    const newIds = Array.from(current)
    const res = await quickUpdateProduct(row.original.id, { category_ids: newIds, category_id: newIds[0] || null })
    if (res.error) toast.error(res.error)
    else onRefresh?.()
  }

  async function clearAll() {
    const res = await quickUpdateProduct(row.original.id, { category_ids: [], category_id: null })
    if (res.error) toast.error(res.error)
    else {
      setOpen(false)
      onRefresh?.()
    }
  }

  function renderCategoryItems(cat: AdminCategory, depth: number) {
    const isChecked = ids.includes(cat.id)
    const indent = depth * 16
    return (
      <div key={cat.id}>
        <DropdownMenuItem
          className="text-xs text-admin-text"
          style={{ paddingLeft: `${8 + indent}px` }}
          onClick={async (e) => {
            e.preventDefault()
            await toggleCat(cat.id)
          }}
        >
          <span className={`mr-2 text-[10px] ${isChecked ? 'text-ember' : 'text-admin-muted/30'}`}>
            {isChecked ? '✓' : '○'}
          </span>
          <span className={isChecked ? 'text-admin-text' : 'text-admin-muted'}>
            {cat.name}
          </span>
        </DropdownMenuItem>
        {cat.children?.map((child: AdminCategory) => renderCategoryItems(child, depth + 1))}
      </div>
    )
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="text-xs text-admin-muted hover:text-admin-text cursor-pointer text-left max-w-[160px] truncate" title={displayNames}>
          {displayNames}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60 max-h-[450px] overflow-y-auto border-admin-border bg-admin-surface">
        <DropdownMenuLabel className="text-[11px] text-admin-muted">
          {ids.length} categoría{ids.length !== 1 ? 's' : ''}
        </DropdownMenuLabel>
        {ids.length > 0 && (
          <DropdownMenuItem className="text-xs text-admin-muted" onClick={clearAll}>
            ✕ Quitar todas
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-admin-border" />
        {categories.map((cat) => renderCategoryItems(cat, 0))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

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
  const [featuredIds, setFeaturedIds] = useState<Set<string>>(new Set())
  const searchRef = useRef<HTMLInputElement>(null)

  async function load() {
    try {
      const [products, cats, fIds] = await Promise.all([getProducts(), getCategories(), getFeaturedProductIds()])
      setData(products)
      setCategories(cats)
      setFeaturedIds(new Set(fIds))
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
      toast.success('Producto eliminado')
      setData((prev) => prev.filter((p) => p.id !== id))
    }
    setDeleteId(null)
  }

  async function handleBulkDelete() {
    const res = await bulkDeleteProducts(selectedIds)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(`${selectedIds.length} productos eliminados`)
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
      toast.success(`${selectedIds.length} productos actualizados a ${status}`)
      setData((prev) => prev.map((p) => selectedIds.includes(p.id) ? { ...p, status } : p))
      setRowSelection({})
    }
  }

  async function handleDuplicate(id: string) {
    const res = await duplicateProduct(id)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Producto duplicado')
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
        if (stockFilter === 'low') return p.stock_quantity > 0 && p.stock_quantity <= 5
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
        <input type="checkbox" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} className="rounded border-admin-border bg-admin-surface accent-primary" />
      ),
      cell: ({ row }) => (
        <input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} className="rounded border-admin-border bg-admin-surface accent-primary" />
      ),
      enableSorting: false,
    },
    {
      id: 'featured',
      size: 40,
      minSize: 40,
      header: () => null,
      cell: ({ row }) => {
        const isFeatured = featuredIds.has(row.original.id)
        async function toggle() {
          // Optimistic update
          const wasFeatured = featuredIds.has(row.original.id)
          setFeaturedIds((prev) => {
            const next = new Set(prev)
            if (wasFeatured) next.delete(row.original.id)
            else next.add(row.original.id)
            return next
          })
          try {
            const res = await toggleFeaturedByProductId(row.original.id)
            if (res.error) {
              setFeaturedIds((prev) => {
                const next = new Set(prev)
                if (wasFeatured) next.add(row.original.id)
                else next.delete(row.original.id)
                return next
              })
              toast.error(res.error)
            } else {
              toast.success(res.featured ? 'Añadido a más vendidos' : 'Eliminado de más vendidos')
            }
          } catch (e: any) {
            setFeaturedIds((prev) => {
              const next = new Set(prev)
              if (wasFeatured) next.add(row.original.id)
              else next.delete(row.original.id)
              return next
            })
            toast.error(e.message || 'Error al actualizar')
          }
        }
        return (
          <button
            onClick={toggle}
            className={`p-1 rounded transition-colors ${
              isFeatured ? 'text-ember hover:text-ember/70' : 'text-admin-muted/30 hover:text-admin-muted'
            }`}
            title={isFeatured ? 'Quitar de más vendidos' : 'Añadir a más vendidos'}
          >
            <Star size={15} fill={isFeatured ? 'currentColor' : 'none'} strokeWidth={1.5} />
          </button>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 text-xs font-medium">
          Nombre <ArrowUpDown size={12} />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md border border-admin-border bg-admin-surface flex items-center justify-center overflow-hidden flex-shrink-0">
            {row.original.images?.[0]?.url ? (
              <img src={row.original.images[0].url} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon size={14} className="text-admin-muted" />
            )}
          </div>
          <span className="font-medium text-sm truncate text-admin-text">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'category_ids',
      size: 170,
      minSize: 130,
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 text-xs font-medium">
          Categorías <ArrowUpDown size={12} />
        </button>
      ),
      cell: ({ row }) => <CategoryCell row={row} categories={categories} onRefresh={load} />,
    },
    {
      accessorKey: 'status',
      size: 100,
      minSize: 80,
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 text-xs font-medium">
          Estado <ArrowUpDown size={12} />
        </button>
      ),
      cell: ({ getValue }) => {
        const status = getValue() as ProductStatus
        return <StatusBadge status={status} />
      },
    },
    {
      accessorKey: 'price_cents',
      size: 100,
      minSize: 80,
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 text-xs font-medium">
          Precio <ArrowUpDown size={12} />
        </button>
      ),
      cell: ({ getValue }) => <span className="font-mono text-xs text-admin-text">{fmt(Number(getValue()))}</span>,
    },
    {
      id: 'stock_status',
      accessorFn: (row) => {
        if (!row.in_stock) return 'out'
        if (row.stock_quantity <= 5 && row.stock_quantity > 0) return 'low'
        return 'in'
      },
      size: 130,
      minSize: 100,
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 text-xs font-medium">
          Stock <ArrowUpDown size={12} />
        </button>
      ),
      cell: ({ row }) => <StockCell row={row} onRefresh={load} />,
    },
    {
      accessorKey: 'created_at',
      size: 130,
      minSize: 100,
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 text-xs font-medium">
          Creado <ArrowUpDown size={12} />
        </button>
      ),
      cell: ({ getValue }) => (
        <span className="text-xs text-admin-muted">
          {new Date(String(getValue())).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
    {
      id: 'actions',
      size: 110,
      minSize: 110,
      header: () => null,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-admin-muted hover:text-admin-text hover:bg-white/5" onClick={() => setEditProduct(row.original)}>
            <Pencil size={14} />
            <span className="sr-only">Editar</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-admin-muted hover:text-admin-danger hover:bg-white/5" onClick={() => setDeleteId(row.original.id)}>
            <Trash2 size={14} />
            <span className="sr-only">Eliminar</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-admin-muted hover:text-admin-text hover:bg-white/5"><MoreHorizontal size={14} /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 border-admin-border bg-admin-surface">
              <DropdownMenuItem className="text-admin-text" onClick={() => setQuickEditProduct(row.original)}><FileText size={14} className="mr-2" /> Edición rápida</DropdownMenuItem>
              <DropdownMenuItem className="text-admin-text" onClick={() => handleDuplicate(row.original.id)}><Copy size={14} className="mr-2" /> Duplicar</DropdownMenuItem>
              <DropdownMenuItem className="text-admin-text" onClick={() => setPreviewProduct(row.original)}><Eye size={14} className="mr-2" /> Vista previa</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [categories, featuredIds, fmt])

  // eslint-disable-next-line react-hooks/incompatible-library -- uso idiomático de TanStack Table (useReactTable)
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
    return <PageSkeleton rows={6} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        description="Gestiona el catálogo de productos de la tienda."
        action={
          <>
            <Button variant="outline" size="sm" className="gap-1 h-8 text-xs border-admin-border bg-admin-surface text-admin-text hover:bg-white/5 hover:text-white" onClick={() => setShowShortcuts(true)}>
              <Keyboard size={14} /> Atajos
            </Button>
            <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => setShowAdd(true)}><Plus size={14} /> Añadir producto</Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
          <input
            ref={searchRef}
            placeholder="Buscar productos..."
            value={globalFilter}
            onChange={(e) => handleGlobalFilter(e.target.value)}
            className="h-10 w-full rounded-lg border border-admin-border bg-admin-surface pl-9 pr-3 text-sm text-admin-text placeholder:text-admin-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/70"
          />
        </div>
        <DataTableViewOptions table={table} />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-[130px] border-admin-border bg-admin-surface text-admin-text"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent className="border-admin-border bg-admin-surface">
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="draft">Borrador</SelectItem>
            <SelectItem value="archived">Archivado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-10 w-[200px] border-admin-border bg-admin-surface text-admin-text"><SelectValue placeholder="Categoría" /></SelectTrigger>
          <SelectContent className="max-h-80 overflow-y-auto border-admin-border bg-admin-surface">
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((cat) => (
              <CategorySelectItem key={cat.id} cat={cat} />
            ))}
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as StockFilter)}>
          <SelectTrigger className="h-10 w-[140px] border-admin-border bg-admin-surface text-admin-text"><SelectValue placeholder="Stock" /></SelectTrigger>
          <SelectContent className="border-admin-border bg-admin-surface">
            <SelectItem value="all">Todo el stock</SelectItem>
            <SelectItem value="in">En stock</SelectItem>
            <SelectItem value="out">Agotado</SelectItem>
            <SelectItem value="low">Stock bajo</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (<Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1 text-admin-muted hover:text-admin-text"><FilterX size={12} /> Limpiar</Button>)}
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-admin-border bg-admin-surface/80">
          <span className="text-sm font-medium text-admin-text">{selectedCount} seleccionados</span>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1 border-admin-border bg-admin-surface text-admin-text hover:bg-white/5 hover:text-white" onClick={() => handleBulkStatus('active')}><Globe size={12} /> Publicar</Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1 border-admin-border bg-admin-surface text-admin-text hover:bg-white/5 hover:text-white" onClick={() => handleBulkStatus('draft')}><FileText size={12} /> Borrador</Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1 border-admin-border bg-admin-surface text-admin-text hover:bg-white/5 hover:text-white" onClick={() => handleBulkStatus('archived')}><Archive size={12} /> Archivar</Button>
          <Button variant="destructive" size="sm" className="h-8 text-xs gap-1" onClick={() => setBulkDeleteOpen(true)}><Trash2 size={12} /> Eliminar</Button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="border-admin-border hover:bg-transparent">
                {hg.headers.map((h) => {
                  const size = h.getSize()
                  return (
                    <TableHead key={h.id} className="text-admin-muted" style={size ? { width: size } : undefined}>
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
                { label: 'Editar', icon: <Edit size={14} />, onClick: () => setEditProduct(row.original) },
                { label: 'Edición rápida', icon: <FileText size={14} />, onClick: () => setQuickEditProduct(row.original) },
                { label: 'Duplicar', icon: <Copy size={14} />, onClick: () => handleDuplicate(row.original.id) },
                { label: 'Vista previa', icon: <Eye size={14} />, onClick: () => setPreviewProduct(row.original) },
                { label: 'Eliminar', icon: <Trash2 size={14} />, onClick: () => setDeleteId(row.original.id), destructive: true },
              ]}>
                <TableRow data-state={row.getIsSelected() && 'selected'} className="border-admin-border hover:bg-white/5 data-[state=selected]:bg-white/5">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-admin-text" style={{ width: cell.column.getSize() }}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              </RowContextMenu>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <TableRow className="border-admin-border hover:bg-transparent"><TableCell colSpan={columns.length} className="text-center text-admin-muted py-12">No se encontraron productos</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Eliminar producto</DialogTitle><DialogDescription>¿Estás seguro? Esta acción no se puede deshacer.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar {selectedCount} productos</DialogTitle>
            <DialogDescription>¿Estás seguro? Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleBulkDelete}>Eliminar {selectedCount} productos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent>
          <DialogHeader><DialogTitle>Atajos de teclado</DialogTitle><DialogDescription>Atajos disponibles para la página de productos.</DialogDescription></DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-admin-muted">Buscar</span><kbd className="px-1.5 py-0.5 bg-admin-surface rounded text-xs font-mono">Ctrl+K</kbd></div>
            <div className="flex justify-between"><span className="text-admin-muted">Nuevo producto</span><kbd className="px-1.5 py-0.5 bg-admin-surface rounded text-xs font-mono">N</kbd></div>
            <div className="flex justify-between"><span className="text-admin-muted">Cerrar diálogos</span><kbd className="px-1.5 py-0.5 bg-admin-surface rounded text-xs font-mono">Esc</kbd></div>
            <div className="flex justify-between"><span className="text-admin-muted">Mostrar atajos</span><kbd className="px-1.5 py-0.5 bg-admin-surface rounded text-xs font-mono">?</kbd></div>
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
