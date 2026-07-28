'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Heart, Plus, Trash2, Search, GripVertical, X, ImageIcon, Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { getProducts } from '@/lib/admin/products'
import {
  getFeaturedProducts, addFeaturedProduct, removeFeaturedProduct, reorderFeaturedProducts,
} from '@/lib/admin/featured-products'
import type { AdminProduct, FeaturedProductEntry } from '@/lib/admin/types'
import { toast } from 'sonner'
import { useAdminCurrency } from '../AdminLayoutClient'

export default function FeaturedProductsPage() {
  const { formatPrice: fmt } = useAdminCurrency()
  const [featured, setFeatured] = useState<FeaturedProductEntry[]>([])
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  async function load() {
    try {
      const [f, p] = await Promise.all([getFeaturedProducts(), getProducts()])
      setFeatured(f)
      setProducts(p)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const availableProducts = useMemo(() => {
    const featuredIds = new Set(featured.map((f) => f.product_id))
    let filtered = products.filter((p) => !featuredIds.has(p.id))
    if (productSearch) filtered = filtered.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    return filtered
  }, [products, featured, productSearch])

  async function handleAdd(productId: string) {
    const res = await addFeaturedProduct(productId)
    if (res.error) { toast.error(res.error) }
    else {
      toast.success('Product featured')
      load()
    }
  }

  async function handleRemove(id: string) {
    const res = await removeFeaturedProduct(id)
    if (res.error) { toast.error(res.error) }
    else {
      toast.success('Removed from featured')
      setFeatured((prev) => prev.filter((f) => f.id !== id))
    }
  }

  async function handleReorder(ids: string[]) {
    await reorderFeaturedProducts(ids)
  }

  function moveUp(index: number) {
    if (index === 0) return
    const newList = [...featured]
    ;[newList[index - 1], newList[index]] = [newList[index], newList[index - 1]]
    setFeatured(newList)
    handleReorder(newList.map((f) => f.id))
  }

  function moveDown(index: number) {
    if (index === featured.length - 1) return
    const newList = [...featured]
    ;[newList[index], newList[index + 1]] = [newList[index + 1], newList[index]]
    setFeatured(newList)
    handleReorder(newList.map((f) => f.id))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif tracking-wider text-foreground">Featured Products</h1>
          <p className="text-sm text-muted-foreground mt-1">Curate products to showcase on the homepage</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={16} className="mr-2" /> Add Product
        </Button>
      </div>

      {featured.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Heart size={28} className="text-muted-foreground/60" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">No featured products</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Select products to showcase on your storefront homepage.
            </p>
            <Button onClick={() => setShowAdd(true)}>
              <Plus size={16} className="mr-2" /> Add Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {featured.map((fp, i) => (
            <Card key={fp.id} className="relative">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <button onClick={() => moveUp(i)} disabled={i === 0} className="p-0.5 hover:text-foreground disabled:opacity-30">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6"/></svg>
                  </button>
                  <span className="text-xs font-mono w-4 text-center">{i + 1}</span>
                  <button onClick={() => moveDown(i)} disabled={i === featured.length - 1} className="p-0.5 hover:text-foreground disabled:opacity-30">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                </div>
                <GripVertical size={14} className="text-muted-foreground cursor-grab flex-shrink-0" />
                <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                  {fp.product?.images?.[0]?.url ? (
                    <img src={fp.product.images[0].url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><ImageIcon size={14} className="text-muted-foreground" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fp.product?.name ?? 'Unknown Product'}</p>
                  {fp.product?.price_cents && (
                    <p className="text-xs text-muted-foreground">{fmt(fp.product.price_cents)}</p>
                  )}
                </div>
                <Badge variant="outline" className="text-[10px]">#{fp.sort_order}</Badge>
                <Button variant="ghost" size="sm" onClick={() => handleRemove(fp.id)} className="text-destructive h-8">
                  <Trash2 size={12} />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Featured Product</DialogTitle>
            <DialogDescription>Select a product to feature on the homepage.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {availableProducts.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground py-8">No products available</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Product</TableHead>
                      <TableHead className="text-xs w-16">Price</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableProducts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-muted overflow-hidden flex-shrink-0">
                            {p.images?.[0]?.url ? <img src={p.images[0].url} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={10} className="m-auto text-muted-foreground" />}
                          </div>
                          <span className="text-sm truncate">{p.name}</span>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{fmt(p.price_cents)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => { handleAdd(p.id); setShowAdd(false) }}>
                            <Plus size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
