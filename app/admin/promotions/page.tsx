'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Sparkles, Plus, Trash2, Edit, Eye, EyeOff, Search, ImageIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  getPromotionalSections, createPromotionalSection, updatePromotionalSection,
  deletePromotionalSection, reorderPromotionalSections, togglePromotionalSectionActive,
} from '@/lib/admin/promotions'
import { getProducts } from '@/lib/admin/products'
import type { PromotionalSection, AdminProduct } from '@/lib/admin/types'
import { toast } from 'sonner'
import { useAdminCurrency } from '../AdminLayoutClient'

const LAYOUT_LABELS: Record<string, string> = {
  grid: 'Product Grid',
  carousel: 'Carousel',
  banner: 'Full Banner',
  split: 'Split Layout',
}

export default function PromotionsPage() {
  const { formatPrice: fmt } = useAdminCurrency()
  const [data, setData] = useState<PromotionalSection[]>([])
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [editItem, setEditItem] = useState<PromotionalSection | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [productSearch, setProductSearch] = useState('')

  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formLayout, setFormLayout] = useState('grid')
  const [formBgColor, setFormBgColor] = useState('#0a0a0a')
  const [formTextColor, setFormTextColor] = useState('#f5f2eb')
  const [formActive, setFormActive] = useState(true)
  const [formProductIds, setFormProductIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const [secs, prods] = await Promise.all([getPromotionalSections(), getProducts()])
      setData(secs)
      setProducts(prods)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openEdit(s: PromotionalSection) {
    setEditItem(s)
    setFormTitle(s.title)
    setFormDescription(s.description ?? '')
    setFormLayout(s.layout)
    setFormBgColor(s.background_color)
    setFormTextColor(s.text_color)
    setFormActive(s.active)
    setFormProductIds(s.product_ids ?? [])
    setShowAdd(true)
  }

  function openAdd() {
    setEditItem(null)
    setFormTitle('')
    setFormDescription('')
    setFormLayout('grid')
    setFormBgColor('#0a0a0a')
    setFormTextColor('#f5f2eb')
    setFormActive(true)
    setFormProductIds([])
    setShowAdd(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle.trim()) { toast.error('Title required'); return }
    setSaving(true)
    const fd = new FormData()
    fd.append('title', formTitle)
    fd.append('description', formDescription)
    fd.append('layout', formLayout)
    fd.append('background_color', formBgColor)
    fd.append('text_color', formTextColor)
    fd.append('active', String(formActive))
    fd.append('product_ids', JSON.stringify(formProductIds))

    const res = editItem
      ? await updatePromotionalSection(editItem.id, fd)
      : await createPromotionalSection(fd)

    if (res.error) { toast.error(res.error) }
    else {
      toast.success(editItem ? 'Section updated' : 'Section created')
      setShowAdd(false)
      setEditItem(null)
      load()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const res = await deletePromotionalSection(id)
    if (res.error) { toast.error(res.error) }
    else {
      toast.success('Section deleted')
      setData((prev) => prev.filter((s) => s.id !== id))
    }
    setDeleteId(null)
  }

  async function handleToggleActive(s: PromotionalSection) {
    const res = await togglePromotionalSectionActive(s.id, !s.active)
    if (res.error) { toast.error(res.error) }
    else {
      setData((prev) => prev.map((x) => x.id === s.id ? { ...x, active: !x.active } : x))
    }
  }

  function moveUp(index: number) {
    if (index === 0) return
    const newList = [...data]; [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]]
    setData(newList); reorderPromotionalSections(newList.map((s) => s.id))
  }

  function moveDown(index: number) {
    if (index === data.length - 1) return
    const newList = [...data]; [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]]
    setData(newList); reorderPromotionalSections(newList.map((s) => s.id))
  }

  function toggleProduct(id: string) {
    setFormProductIds((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id])
  }

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products
    return products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
  }, [products, productSearch])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        <div className="h-8 w-36 bg-muted rounded animate-pulse" />
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />)}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif tracking-wider text-foreground">Promotional Sections</h1>
          <p className="text-sm text-muted-foreground mt-1">Create promotional content sections for the homepage</p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={16} className="mr-2" /> Add Section
        </Button>
      </div>

      {data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-muted-foreground/60" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">No promotional sections</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Create promotional sections to highlight collections, sales, and curated product selections.
            </p>
            <Button onClick={openAdd}><Plus size={16} className="mr-2" /> Add Section</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.map((s, i) => (
            <Card key={s.id} className={`border-l-4 ${s.active ? 'border-l-admin-success' : 'border-l-admin-slate/25'}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <button onClick={() => moveUp(i)} disabled={i === 0} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6"/></svg>
                    </button>
                    <span className="text-[10px] font-mono text-muted-foreground">{i + 1}</span>
                    <button onClick={() => moveDown(i)} disabled={i === data.length - 1} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <h3 className="text-sm font-medium">{s.title}</h3>
                      <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${s.active ? 'bg-admin-success/10 text-admin-success' : 'bg-admin-slate/10 text-admin-slate'}`}>
                        {s.active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] flex-shrink-0">{LAYOUT_LABELS[s.layout] ?? s.layout}</Badge>
                    </div>
                    {s.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{s.description}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{s.product_ids?.length ?? 0} product(s) Â· {s.sort_order}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleToggleActive(s)} className="h-8 w-8 p-0">
                      {s.active ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(s)} className="h-8 w-8 p-0">
                      <Edit size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(s.id)} className="h-8 w-8 p-0 text-destructive">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={(o) => !o && (setShowAdd(false), setEditItem(null))}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Section' : 'New Promotional Section'}</DialogTitle>
            <DialogDescription>Configure the section content and appearance.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description" rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formDescription} onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div>
              <Label>Layout</Label>
              <Select value={formLayout} onValueChange={setFormLayout}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Product Grid</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                  <SelectItem value="banner">Full Banner</SelectItem>
                  <SelectItem value="split">Split Layout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Background</Label>
                <div className="flex gap-2 mt-1">
                  <input type="color" value={formBgColor} onChange={(e) => setFormBgColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                  <Input value={formBgColor} onChange={(e) => setFormBgColor(e.target.value)} className="flex-1 font-mono text-xs" />
                </div>
              </div>
              <div>
                <Label>Text Color</Label>
                <div className="flex gap-2 mt-1">
                  <input type="color" value={formTextColor} onChange={(e) => setFormTextColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                  <Input value={formTextColor} onChange={(e) => setFormTextColor(e.target.value)} className="flex-1 font-mono text-xs" />
                </div>
              </div>
            </div>
            <div>
              <Label>Products</Label>
              <div className="relative mt-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-8 text-sm"
                />
              </div>
              <div className="mt-2 max-h-40 overflow-y-auto border border-border rounded-md divide-y divide-border">
                {filteredProducts.slice(0, 20).map((p) => (
                  <label key={p.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent/10 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={formProductIds.includes(p.id)}
                      onChange={() => toggleProduct(p.id)}
                      className="rounded border-input"
                    />
                    <div className="w-6 h-6 rounded bg-muted overflow-hidden flex-shrink-0">
                      {p.images?.[0]?.url ? <img src={p.images[0].url} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={10} className="m-auto text-muted-foreground" />}
                    </div>
                    <span className="truncate flex-1">{p.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{fmt(p.price_cents)}</span>
                  </label>
                ))}
                {filteredProducts.length === 0 && <p className="text-xs text-center text-muted-foreground py-4">No products found</p>}
              </div>
              {formProductIds.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{formProductIds.length} product(s) selected</p>
              )}
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} className="rounded border-input" />
              <span className="text-sm">Active</span>
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => (setShowAdd(false), setEditItem(null))}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editItem ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Section</DialogTitle>
            <DialogDescription>Are you sure? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

