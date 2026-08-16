'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { quickUpdateProduct } from '@/lib/admin/products'
import { toast } from 'sonner'
import type { AdminProduct, ProductStatus } from '@/lib/admin/types'

interface Props {
  open: boolean
  product: AdminProduct | null
  onClose: () => void
  onSaved: () => void
}

export default function QuickEditDialog({ open, product, onClose, onSaved }: Props) {
  const [name, setName] = useState(product?.name ?? '')
  const [priceDollars, setPriceDollars] = useState(product ? product.price_cents / 100 : 0)
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? 'active')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!product) return
    setSaving(true)
    const res = await quickUpdateProduct(product.id, { name, price_cents: Math.round(priceDollars * 100), status })
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Producto actualizado')
      onSaved()
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edición rápida: {product?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Precio ($)</Label>
            <Input type="number" step="0.01" value={priceDollars} onChange={(e) => setPriceDollars(parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <Label>Estado</Label>
            <Select value={status} onValueChange={(v: ProductStatus) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="archived">Archivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

