'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { AdminProduct, ProductStatus } from '@/lib/admin/types'
import { useAdminCurrency } from '../AdminLayoutClient'

const STATUS_BADGE: Record<ProductStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  draft: { label: 'Draft', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  archived: { label: 'Archived', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
}

interface Props {
  open: boolean
  product: AdminProduct | null
  onClose: () => void
}

export default function ProductPreviewDialog({ open, product, onClose }: Props) {
  const { formatPrice: fmt } = useAdminCurrency()
  const [selectedImage, setSelectedImage] = useState(0)

  if (!product) return null

  const allImages = product.images ?? []
  const statusStyle = STATUS_BADGE[product.status ?? 'active']

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Product Preview</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
            {allImages[selectedImage] ? (
              <img
                src={allImages[selectedImage].url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                No image
              </div>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-12 h-12 rounded border overflow-hidden transition-all ${
                    i === selectedImage ? 'border-luxury-gold ring-1 ring-luxury-gold' : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-serif text-lg text-foreground">{product.name}</h3>
              <Badge variant="outline" className={`${statusStyle.className} text-[10px]`}>
                {statusStyle.label}
              </Badge>
            </div>
            <p className="text-xl font-sans text-foreground">
              {fmt(product.price_cents)}
              {product.compare_at_price_cents && (
                <span className="ml-2 text-sm text-muted-foreground line-through">
                  {fmt(product.compare_at_price_cents)}
                </span>
              )}
            </p>
            {product.sizes.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {product.sizes.map((s) => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground">{s}</span>
                ))}
              </div>
            )}
            {product.colors.length > 0 && (
              <div className="flex gap-1.5">
                {product.colors.map((c) => (
                  <span
                    key={c.slug}
                    className="w-4 h-4 rounded-full border border-border inline-block"
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            )}
            {product.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">{product.description}</p>
            )}
            {product.category_name && (
              <p className="text-xs text-muted-foreground">Category: {product.category_name}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`w-2 h-2 rounded-full ${product.in_stock ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {product.in_stock ? 'In Stock' : 'Out of Stock'}
              {product.track_inventory && <span>({product.stock_quantity} units)</span>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

