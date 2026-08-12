'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Search, Plus, Filter, Package, AlertTriangle, Warehouse, ChevronDown, Layers,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { getInventory, updateProductStock, updateVariantStock } from '@/lib/admin/inventory'
import type { InventoryItem } from '@/lib/admin/types'
import { toast } from 'sonner'
import { useAdminCurrency } from '../AdminLayoutClient'

export default function AdminInventoryPage() {
  const { formatPrice: fmt } = useAdminCurrency()
  const [data, setData] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [editStock, setEditStock] = useState(0)
  const [editingVariant, setEditingVariant] = useState<{ id: string; sku: string; stock: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [bulkStock, setBulkStock] = useState(0)
  const [bulkLoading, setBulkLoading] = useState(false)

  async function load() {
    try {
      setData(await getInventory(search || undefined, lowStockOnly || undefined))
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [search, lowStockOnly])

  function openEdit(item: InventoryItem) {
    setEditingItem(item)
    setEditStock(item.stock_quantity)
  }

  async function handleSaveStock() {
    if (!editingItem) return
    setSaving(true)
    const res = await updateProductStock(editingItem.id, {
      stock_quantity: editStock,
    })
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Stock updated')
      setEditingItem(null)
      load()
    }
    setSaving(false)
  }

  async function handleSaveVariant() {
    if (!editingVariant) return
    setSaving(true)
    const res = await updateVariantStock(editingVariant.id, {
      stock_quantity: editingVariant.stock,
    })
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Variant stock updated')
      setEditingVariant(null)
      load()
    }
    setSaving(false)
  }

  const filtered = useMemo(() => {
    let items = data
    if (search) {
      const q = search.toLowerCase()
      items = items.filter((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
    }
    if (lowStockOnly) {
      items = items.filter((i) => i.stock_quantity <= 5 && i.stock_quantity > 0)
    }
    return items
  }, [data, search, lowStockOnly])

  async function handleBulkStock() {
    setBulkLoading(true)
    try {
      const res = await fetch('/api/admin/products/bulk-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_quantity: bulkStock }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed')
      toast.success(`Stock actualizado a ${bulkStock} unidades en ${d.updated} productos`)
      load()
    } catch (e: any) {
      toast.error(e.message || 'Error')
    }
    setBulkLoading(false)
  }

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-10 w-48 bg-muted rounded" />
      <div className="h-8 bg-muted rounded w-full" />
      <div className="h-72 bg-muted rounded-lg" />
    </div>
  }

  const totalStock = data.reduce((s, i) => s + i.stock_quantity, 0)
  const lowStockCount = data.filter((i) => i.stock_quantity <= 5 && i.stock_quantity > 0).length
  const outOfStockCount = data.filter((i) => i.stock_quantity === 0).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif tracking-wider text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Track stock levels across all products</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Stock</CardTitle>
            <Package size={14} className="text-muted-foreground/60" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{totalStock.toLocaleString('en-US')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Low Stock</CardTitle>
            <AlertTriangle size={14} className="text-admin-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-admin-warning">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Out of Stock</CardTitle>
            <Warehouse size={14} className="text-admin-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-admin-danger">{outOfStockCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-4 flex items-center gap-3">
          <Layers size={16} className="text-muted-foreground shrink-0" />
          <span className="text-sm font-medium whitespace-nowrap">Set all stock to:</span>
          <Input
            type="number"
            min={0}
            value={bulkStock}
            onChange={(e) => setBulkStock(Number(e.target.value))}
            className="w-20 h-8 text-sm"
          />
          <Button size="sm" onClick={handleBulkStock} disabled={bulkLoading}>
            {bulkLoading ? 'Updating...' : 'Apply to all'}
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Button
          variant={lowStockOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setLowStockOnly(!lowStockOnly)}
        >
          <Filter size={14} className="mr-2" /> Low Stock Only
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 && (
            <div className="text-center text-muted-foreground py-12">No products found</div>
          )}
          {filtered.map((item) => (
            <div key={item.id} className="border-b border-border last:border-0">
              <div className="flex items-center justify-between py-3 px-4 hover:bg-accent/5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{item.name}</span>
                    {item.sku && <span className="text-xs text-muted-foreground font-mono">/{item.sku}</span>}
                    {item.category_name && (
                      <Badge variant="outline" className="text-[10px]">{item.category_name}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm shrink-0">
                  <span className="text-muted-foreground w-20 text-right">{fmt(item.price_cents)}</span>
                  <div className="w-24 text-right">
                    {item.stock_quantity > 0 ? (
                      <span className={item.stock_quantity <= 0 ? 'text-admin-danger' : item.stock_quantity <= 5 ? 'text-admin-warning' : ''}>
                        {item.stock_quantity}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </div>
                  <Badge variant={item.in_stock ? 'default' : 'secondary'} className="text-[10px] w-14 justify-center">
                    {item.in_stock ? 'Active' : 'Hidden'}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)} className="h-7 text-xs">
                    Edit
                  </Button>
                </div>
              </div>
              {item.variants.length > 0 && (
                <div className="ml-8 pb-2">
                  {item.variants.map((v) => (
                    <div key={v.id} className="flex items-center justify-between py-1.5 px-4 text-xs text-muted-foreground hover:bg-accent/3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{v.sku || '—'}</span>
                        {v.size && <Badge variant="outline" className="text-[10px]">{v.size}</Badge>}
                        {v.color_slug && <span className="capitalize">{v.color_slug}</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span>{v.stock_quantity}</span>
                        <button
                          onClick={() => setEditingVariant({ id: v.id, sku: v.sku, stock: v.stock_quantity })}
                          className="text-muted-foreground hover:text-foreground underline text-[10px]"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!editingItem} onOpenChange={(o) => !o && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Stock</DialogTitle>
            <DialogDescription>{editingItem?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="stock_qty">Stock Quantity</Label>
              <Input
                id="stock_qty"
                type="number"
                min={0}
                value={editStock}
                onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
            <Button onClick={handleSaveStock} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingVariant} onOpenChange={(o) => !o && setEditingVariant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Variant Stock</DialogTitle>
            <DialogDescription>{editingVariant?.sku}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="variant_stock">Stock Quantity</Label>
              <Input
                id="variant_stock"
                type="number"
                min={0}
                value={editingVariant?.stock ?? 0}
                onChange={(e) => setEditingVariant(editingVariant ? { ...editingVariant, stock: parseInt(e.target.value) || 0 } : null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingVariant(null)}>Cancel</Button>
            <Button onClick={handleSaveVariant} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
