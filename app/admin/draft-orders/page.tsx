'use client'

import { useEffect, useState } from 'react'
import {
  Plus, Eye, ShoppingCart, Trash2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { getDraftOrders, createDraftOrder, updateDraftOrder, convertDraftToOrder, deleteDraftOrder } from '@/lib/admin/draft-orders'
import type { DraftOrder } from '@/lib/admin/types'
import { toast } from 'sonner'
import { useAdminCurrency } from '../AdminLayoutClient'

export default function AdminDraftOrdersPage() {
  const { formatPrice: fmt } = useAdminCurrency()
  const [data, setData] = useState<DraftOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [viewOrder, setViewOrder] = useState<DraftOrder | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({
    user_id: '',
    items: [{ product_id: '', product_name: '', quantity: 1, price_cents: 0, size: '', color: '' }],
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      setData(await getDraftOrders())
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function resetForm() {
    setForm({
      user_id: '',
      items: [{ product_id: '', product_name: '', quantity: 1, price_cents: 0, size: '', color: '' }],
      notes: '',
    })
  }

  function addItem() {
    setForm({
      ...form,
      items: [...form.items, { product_id: '', product_name: '', quantity: 1, price_cents: 0, size: '', color: '' }],
    })
  }

  function removeItem(idx: number) {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })
  }

  function updateItem(idx: number, field: string, value: any) {
    const items = [...form.items]
    items[idx] = { ...items[idx], [field]: value }
    setForm({ ...form, items })
  }

  async function handleCreate() {
    if (!form.user_id.trim()) return toast.error('Customer ID required')
    if (form.items.length === 0 || !form.items[0].product_name) return toast.error('At least one item required')
    setSaving(true)
    const res = await createDraftOrder({ user_id: form.user_id, items: form.items, notes: form.notes })
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Draft order created')
      setShowCreate(false)
      resetForm()
      load()
    }
    setSaving(false)
  }

  async function handleConvert(id: string) {
    const res = await convertDraftToOrder(id)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Order converted to pending')
      setViewOrder(null)
      load()
    }
  }

  async function handleDelete(id: string) {
    const res = await deleteDraftOrder(id)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Draft order deleted')
      setDeleteId(null)
      load()
    }
  }

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-10 w-48 bg-muted rounded" />
      <div className="h-72 bg-muted rounded-lg" />
    </div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif tracking-wider text-foreground">Draft Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage orders on behalf of customers</p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreate(true) }}>
          <Plus size={16} className="mr-2" /> New Draft Order
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Order</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Customer</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Items</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Total</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Created</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground py-12">No draft orders</td>
                </tr>
              )}
              {data.map((order) => (
                <tr key={order.id} className="hover:bg-accent/5">
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs">{order.id.slice(0, 8)}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{order.user_id.slice(0, 12)}</td>
                  <td className="py-3 px-4 text-right">{(order.items ?? []).length}</td>
                  <td className="py-3 px-4 text-right font-medium">{fmt(order.total_cents)}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground text-xs">
                    {new Date(order.created_at).toLocaleDateString('en-US')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setViewOrder(order)} className="h-7 w-7 p-0">
                        <Eye size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(order.id)} className="h-7 w-7 p-0 text-destructive">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={(o) => !o && setShowCreate(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Draft Order</DialogTitle>
            <DialogDescription>Create an order on behalf of a customer</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label htmlFor="do_user">Customer Clerk ID *</Label>
              <Input
                id="do_user"
                value={form.user_id}
                onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                placeholder="user_..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Items</Label>
                <Button variant="outline" size="sm" onClick={addItem} className="h-7 text-xs">
                  <Plus size={12} className="mr-1" /> Add Item
                </Button>
              </div>
              {form.items.map((item, idx) => (
                <div key={idx} className="border border-border rounded-lg p-3 mb-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Item {idx + 1}</span>
                    {form.items.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="text-xs text-destructive">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <Input
                        placeholder="Product name"
                        value={item.product_name}
                        onChange={(e) => updateItem(idx, 'product_name', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Qty"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Price (cents)"
                        min={0}
                        value={item.price_cents}
                        onChange={(e) => updateItem(idx, 'price_cents', parseInt(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Size"
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
              <Label htmlFor="do_notes">Notes</Label>
              <textarea
                id="do_notes"
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating...' : 'Create Draft Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewOrder} onOpenChange={(o) => !o && setViewOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Draft Order</DialogTitle>
            <DialogDescription>
              Order #{viewOrder?.id.slice(0, 8)} — {viewOrder && fmt(viewOrder.total_cents)}
            </DialogDescription>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground">
                Customer: <span className="font-mono">{viewOrder.user_id}</span>
              </div>
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Items</h4>
                <div className="space-y-2">
                  {(viewOrder.items ?? []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm border-b border-border pb-1">
                      <div>
                        <span className="font-medium">{item.product_name}</span>
                        <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                        {item.size && <Badge variant="outline" className="ml-2 text-[10px]">{item.size}</Badge>}
                        {item.color && <span className="text-muted-foreground ml-1 text-xs">{item.color}</span>}
                      </div>
                      <span>{fmt(item.price_cents * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {viewOrder.notes && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Notes</h4>
                  <p className="text-sm text-muted-foreground">{viewOrder.notes}</p>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="font-medium">Total</span>
                <span className="font-semibold">{fmt(viewOrder.total_cents)}</span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setViewOrder(null)}>Close</Button>
            <Button onClick={() => viewOrder && handleConvert(viewOrder.id)}>
              <ShoppingCart size={14} className="mr-2" /> Convert to Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Draft Order</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
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
