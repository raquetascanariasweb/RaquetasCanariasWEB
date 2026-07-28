'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Plus, Upload, ChevronUp, ChevronDown, Image as ImageIcon } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import { createProduct, updateProduct } from '@/lib/admin/products'
import { getCategories } from '@/lib/admin/categories'
import MediaPicker from '@/components/admin/MediaPicker'
import { toast } from 'sonner'
import type { AdminProduct, AdminCategory, ProductStatus } from '@/lib/admin/types'
import { useAdminCurrency } from '../AdminLayoutClient'

const productSchema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().optional(),
  materials: z.string().optional(),
  price_cents: z.coerce.number().min(0.01, 'Price required'),
  compare_at_price_cents: z.coerce.number().optional().nullable(),
  sku: z.string().optional(),
  track_inventory: z.boolean().optional(),
  stock_quantity: z.coerce.number().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  category_id: z.string().optional().nullable(),
  status: z.enum(['active', 'draft', 'archived']).optional(),
  in_stock: z.boolean().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

interface Props {
  open: boolean
  product?: AdminProduct | null
  onClose: () => void
  onSaved: () => void
}

export default function ProductFormDialog({ open, product, onClose, onSaved }: Props) {
  const { code: currencyCode } = useAdminCurrency()
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? [])
  const [sizeInput, setSizeInput] = useState('')
  const [colors, setColors] = useState<{ name: string; hex: string; slug: string }[]>(product?.colors ?? [])
  const [colorName, setColorName] = useState('')
  const [colorHex, setColorHex] = useState('#000000')
  const [images, setImages] = useState<{ file?: File; url?: string; color: string }[]>(
    product?.images?.map((img) => ({ url: img.url, color: img.color })) ?? []
  )
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)
  const [mediaPickerColor, setMediaPickerColor] = useState('')
  const [variants, setVariants] = useState<{
    sku: string; size: string; color_slug: string; price_cents: number | null;
    stock_quantity: number; track_inventory: boolean
  }[]>(product?.variants?.map((v) => ({
    sku: v.sku || '', size: v.size || '', color_slug: v.color_slug || '',
    price_cents: v.price_cents, stock_quantity: v.stock_quantity || 0,
    track_inventory: v.track_inventory || false,
  })) ?? [])

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: product?.name ?? '',
      description: product?.description ?? '',
      materials: product?.materials ?? '',
      price_cents: product ? product.price_cents / 100 : 0,
      compare_at_price_cents: product?.compare_at_price_cents ? product.compare_at_price_cents / 100 : null,
      sku: product?.sku ?? '',
      track_inventory: product?.track_inventory ?? false,
      stock_quantity: product?.stock_quantity ?? 0,
      in_stock: product?.in_stock ?? true,
      seo_title: product?.seo_title ?? '',
      seo_description: product?.seo_description ?? '',
      category_id: product?.category_id ?? null,
      status: product?.status ?? 'active',
    },
  })

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  function addSize() {
    if (sizeInput.trim() && !sizes.includes(sizeInput.trim())) {
      setSizes([...sizes, sizeInput.trim()])
    }
    setSizeInput('')
  }

  function removeSize(s: string) {
    setSizes(sizes.filter((x) => x !== s))
  }

  function addColor() {
    if (colorName.trim()) {
      const slug = colorName.toLowerCase().replace(/\s+/g, '-')
      if (!colors.find((c) => c.slug === slug)) {
        setColors([...colors, { name: colorName.trim(), hex: colorHex, slug }])
      }
    }
    setColorName('')
    setColorHex('#000000')
  }

  function removeColor(slug: string) {
    setColors(colors.filter((c) => c.slug !== slug))
    setImages(images.filter((img) => img.color !== slug))
  }

  function addVariant() {
    if (sizes.length === 0 && colors.length === 0) return
    const newVariants: typeof variants = []
    if (sizes.length > 0 && colors.length > 0) {
      for (const size of sizes) {
        for (const color of colors) {
          if (!variants.find((v) => v.size === size && v.color_slug === color.slug)) {
            newVariants.push({ sku: `${color.slug}-${size}`, size, color_slug: color.slug, price_cents: null, stock_quantity: 0, track_inventory: false })
          }
        }
      }
    } else if (colors.length > 0) {
      for (const color of colors) {
        if (!variants.find((v) => v.color_slug === color.slug && !v.size)) {
          newVariants.push({ sku: color.slug, size: '', color_slug: color.slug, price_cents: null, stock_quantity: 0, track_inventory: false })
        }
      }
    } else if (sizes.length > 0) {
      for (const size of sizes) {
        if (!variants.find((v) => v.size === size && !v.color_slug)) {
          newVariants.push({ sku: size.toLowerCase(), size, color_slug: '', price_cents: null, stock_quantity: 0, track_inventory: false })
        }
      }
    }
    setVariants([...variants, ...newVariants])
  }

  function updateVariant(index: number, field: string, value: any) {
    setVariants(variants.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  function removeVariant(index: number) {
    setVariants(variants.filter((_, i) => i !== index))
  }

  function moveImage(colorSlug: string, colorPosition: number, direction: 'up' | 'down') {
    const newImages = [...images]
    const colorIndices = newImages
      .map((img, i) => img.color === colorSlug ? i : -1)
      .filter(i => i >= 0)
    const fromIdx = colorIndices[colorPosition]
    const toPos = direction === 'up' ? colorPosition - 1 : colorPosition + 1
    if (toPos < 0 || toPos >= colorIndices.length) return
    ;[newImages[fromIdx], newImages[colorIndices[toPos]]] = [newImages[colorIndices[toPos]], newImages[fromIdx]]
    setImages(newImages)
  }

  async function handleSubmit(data: ProductFormValues) {
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', data.name)
      fd.append('description', data.description ?? '')
      fd.append('materials', data.materials ?? '')
      fd.append('price_cents', String(Math.round(data.price_cents * 100)))
      if (data.compare_at_price_cents) fd.append('compare_at_price_cents', String(Math.round(data.compare_at_price_cents * 100)))
      fd.append('sku', data.sku ?? '')
      fd.append('track_inventory', String(!!data.track_inventory))
      fd.append('stock_quantity', String(data.stock_quantity ?? 0))
      fd.append('seo_title', data.seo_title ?? '')
      fd.append('seo_description', data.seo_description ?? '')
      fd.append('category_id', data.category_id ?? '')
      fd.append('status', data.status ?? 'active')
      fd.append('in_stock', String(!!data.in_stock))
      fd.append('sizes', JSON.stringify(sizes))
      fd.append('colors', JSON.stringify(colors))
      fd.append('variants', JSON.stringify(variants))
      const fileImages = images.filter((i) => i.file)
      fd.append('existing_images', JSON.stringify(images.filter((i) => i.url).map((i) => ({ url: i.url, color: i.color }))))
      fd.append('image_colors', JSON.stringify(fileImages.map((i) => i.color)))
      for (const img of fileImages) {
        fd.append('images', img.file!)
      }

      const res = product
        ? await updateProduct(product.id, fd)
        : await createProduct(fd)

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(product ? 'Product updated' : 'Product created')
        onSaved()
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Error saving product')
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'New Product'}</DialogTitle>
          <DialogDescription>Fill in all product details below.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit, (errors) => {
          const msgs = Object.values(errors).map((e) => e?.message).filter(Boolean)
          toast.error(msgs.length > 0 ? msgs.join(', ') : 'Please fix the form errors')
        })} className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full grid grid-cols-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="variants">Variants</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 pt-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input id="name" {...form.register('name')} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...form.register('description')}
                />
              </div>

              <div>
                <Label htmlFor="materials">Materials / Care</Label>
                <textarea
                  id="materials"
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...form.register('materials')}
                />
              </div>

              <div>
                <Label>Category</Label>
                <Select
                  value={form.watch('category_id') ?? ''}
                  onValueChange={(v) => form.setValue('category_id', v || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {categories.flatMap((cat) => [
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>,
                      ...(cat.children?.map((child) => (
                        <SelectItem key={child.id} value={child.id} className="pl-6">
                          â€” {child.name}
                        </SelectItem>
                      )) ?? []),
                    ])}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={form.watch('status') ?? 'active'}
                  onValueChange={(v) => form.setValue('status', v as ProductStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 pt-4">
              <div>
                <Label>Sizes</Label>
                <p className="text-xs text-muted-foreground mb-2 mt-0.5">Leave empty for products without sizes (e.g. bottles, accessories)</p>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    placeholder="e.g. S, M, L"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                  />
                  <Button type="button" variant="outline" onClick={addSize}><Plus size={16} /></Button>
                </div>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {sizes.map((s) => (
                    <Badge key={s} variant="secondary" className="gap-1">
                      {s}
                      <button onClick={() => removeSize(s)} className="hover:text-destructive"><X size={12} /></button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Colors</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={colorName}
                    onChange={(e) => setColorName(e.target.value)}
                    placeholder="Color name"
                    className="flex-1"
                  />
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Button type="button" variant="outline" onClick={addColor}><Plus size={16} /></Button>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {colors.map((c) => (
                    <Badge key={c.slug} variant="secondary" className="gap-1.5">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: c.hex }} />
                      {c.name}
                      <button onClick={() => removeColor(c.slug)} className="hover:text-destructive"><X size={12} /></button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Images (per color)</Label>
                <div className="mt-2 space-y-2">
                  {colors.length === 0 && (
                    <p className="text-xs text-muted-foreground">Add colors above first</p>
                  )}
                  {colors.map((c) => {
                    const colorImages = images.filter((img) => img.color === c.slug)
                    return (
                      <div key={c.slug} className="border border-border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: c.hex }} />
                          <span className="text-sm font-medium">{c.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">{colorImages.length} image(s)</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {colorImages.map((img, i) => (
                            <div key={i} className="relative w-20 h-20 rounded border border-border overflow-hidden group">
                              <img
                                src={img.url ?? (img.file ? URL.createObjectURL(img.file) : '')}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-0.5 pb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  className="bg-black/60 rounded p-0.5 hover:bg-black/80 disabled:opacity-30"
                                  onClick={() => moveImage(c.slug, i, 'up')}
                                  disabled={i === 0}
                                >
                                  <ChevronUp size={10} className="text-white" />
                                </button>
                                <button
                                  type="button"
                                  className="bg-black/60 rounded p-0.5 hover:bg-black/80 disabled:opacity-30"
                                  onClick={() => moveImage(c.slug, i, 'down')}
                                  disabled={i === colorImages.length - 1}
                                >
                                  <ChevronDown size={10} className="text-white" />
                                </button>
                              </div>
                              <button
                                type="button"
                                className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  const imgIdx = images.findIndex((im, idx) => idx === images.indexOf(img) && im.color === c.slug)
                                  setImages(images.filter((_, idx) => idx !== images.indexOf(img)))
                                }}
                              >
                                <X size={10} className="text-white" />
                              </button>
                            </div>
                          ))}
                          <label className="w-20 h-20 rounded border border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-accent/10 transition-colors">
                            <Upload size={14} className="text-muted-foreground" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) setImages([...images, { file, color: c.slug }])
                                e.target.value = ''
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setMediaPickerColor(c.slug)
                              setMediaPickerOpen(true)
                            }}
                            className="w-20 h-20 rounded border border-dashed border-border flex items-center justify-center hover:bg-accent/10 transition-colors"
                            title="Select from media library"
                          >
                            <ImageIcon size={14} className="text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="variants" className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Generate variants from sizes Ã— colors, or each color/size individually</p>
                <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                  <Plus size={14} className="mr-1" /> Generate
                </Button>
              </div>

              {variants.length === 0 && (
                <p className="text-sm text-muted-foreground">No variants yet. Add sizes and/or colors, then generate.</p>
              )}

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded border border-border bg-accent/5">
                    <span className="text-xs font-mono w-20 truncate">{v.color_slug || v.size || 'â€”'}</span>
                    <Input
                      value={v.sku}
                      onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                      placeholder="SKU"
                      className="w-24 h-8 text-xs"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={v.price_cents !== null ? v.price_cents / 100 : ''}
                      onChange={(e) => updateVariant(i, 'price_cents', e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null)}
                      placeholder="Price ($)"
                      className="w-24 h-8 text-xs"
                    />
                    <Input
                      type="number"
                      value={v.stock_quantity}
                      onChange={(e) => updateVariant(i, 'stock_quantity', parseInt(e.target.value) || 0)}
                      placeholder="Qty"
                      className="w-16 h-8 text-xs"
                    />
                    <label className="flex items-center gap-1 text-[10px] whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={v.track_inventory}
                        onChange={(e) => updateVariant(i, 'track_inventory', e.target.checked)}
                        className="rounded"
                      />
                      Track
                    </label>
                    <button type="button" onClick={() => removeVariant(i)} className="p-1 hover:text-destructive">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4 pt-4">
              <div>
                <Label>SEO Title</Label>
                <Input {...form.register('seo_title')} placeholder="Meta title" />
              </div>
              <div>
                <Label>SEO Description</Label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...form.register('seo_description')}
                  placeholder="Meta description"
                />
              </div>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-4 pt-4">
              {variants.length > 0 ? (
                <div className="rounded-lg border border-border bg-accent/5 p-4 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Stock is managed per variant. Product-level values are computed automatically.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Total Stock (computed)</Label>
                      <div className="mt-1 h-10 px-3 rounded-md border border-input bg-background/50 flex items-center text-sm font-mono">
                        {variants.reduce((s, v) => s + (v.stock_quantity || 0), 0)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">In Stock (computed)</Label>
                      <div className="mt-1 h-10 px-3 rounded-md border border-input bg-background/50 flex items-center text-sm">
                        {variants.some((v) => (v.stock_quantity || 0) > 0) ? (
                          <span className="text-admin-success">Yes</span>
                        ) : (
                          <span className="text-admin-danger">No</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="track_inventory"
                      className="rounded border-input"
                      {...form.register('track_inventory')}
                    />
                    <Label htmlFor="track_inventory" className="mb-0">Track inventory</Label>
                  </div>

                  {form.watch('track_inventory') && (
                    <div>
                      <Label htmlFor="stock_quantity">Stock Quantity</Label>
                      <Input id="stock_quantity" type="number" {...form.register('stock_quantity', { valueAsNumber: true })} />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="in_stock"
                      {...form.register('in_stock')}
                      className="rounded border-input"
                    />
                    <Label htmlFor="in_stock" className="mb-0">In Stock</Label>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_cents">Price ({currencyCode}) *</Label>
                  <Input id="price_cents" type="number" step="0.01" {...form.register('price_cents', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="compare_at_price_cents">Compare at ({currencyCode})</Label>
                  <Input id="compare_at_price_cents" type="number" step="0.01" {...form.register('compare_at_price_cents', { valueAsNumber: true })} />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <MediaPicker
            open={mediaPickerOpen}
            onClose={() => setMediaPickerOpen(false)}
            onSelect={(url) => {
              setImages([...images, { url, color: mediaPickerColor }])
            }}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

