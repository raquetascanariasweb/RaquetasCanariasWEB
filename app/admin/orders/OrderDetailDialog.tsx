'use client'

import { useState } from 'react'
import { ExternalLink, Package, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { updateOrderStatus, updateOrderNotes, updateOrderShipping, getStripeSessionUrl, verifyStripePayment } from '@/lib/admin/orders'
import type { StripePaymentStatus } from '@/lib/admin/orders'
import type { AdminOrder, OrderStatus } from '@/lib/admin/types'
import { ORDER_STATUS_LABELS } from '@/lib/admin/types'
import { toast } from 'sonner'
import { useAdminCurrency } from '../AdminLayoutClient'

interface Props {
  open: boolean
  order: AdminOrder
  onClose: () => void
  onUpdated: (order: AdminOrder) => void
}

export default function OrderDetailDialog({ open, order, onClose, onUpdated }: Props) {
  const { formatPrice: fmt } = useAdminCurrency()
  const [updating, setUpdating] = useState(false)
  const [notes, setNotes] = useState(order.notes ?? '')
  const [tracking, setTracking] = useState(order.tracking_number ?? '')
  const [carrier, setCarrier] = useState(order.shipping_carrier ?? '')
  const [stripeUrl, setStripeUrl] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [stripeStatus, setStripeStatus] = useState<StripePaymentStatus | null>(null)

  async function handleStatusChange(status: OrderStatus) {
    setUpdating(true)
    const res = await updateOrderStatus(order.id, status)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(`Status â†’ ${ORDER_STATUS_LABELS[status]}`)
      onUpdated({ ...order, status })
    }
    setUpdating(false)
  }

  async function saveNotes() {
    const res = await updateOrderNotes(order.id, notes)
    if (res?.error) return toast.error(res.error)
    toast.success('Notes saved')
    onUpdated({ ...order, notes })
  }

  async function saveShipping() {
    const res = await updateOrderShipping(order.id, tracking, carrier)
    if (res?.error) return toast.error(res.error)
    toast.success('Shipping info saved')
    onUpdated({ ...order, tracking_number: tracking, shipping_carrier: carrier })
  }

  async function openStripe() {
    if (!order.stripe_session_id) return
    const url = await getStripeSessionUrl(order.stripe_session_id)
    if (url) {
      setStripeUrl(url)
      window.open(url, '_blank')
    } else {
      toast.error('Could not retrieve Stripe session')
    }
  }

  const formatDate = (d: string) => new Date(d).toLocaleString('en-US', {
    dateStyle: 'medium', timeStyle: 'short',
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Order #{order.id.slice(0, 8)}
            <Badge variant="outline" className="text-xs">{ORDER_STATUS_LABELS[order.status]}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Date</Label>
              <p>{formatDate(order.created_at)}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Total</Label>
              <p className="font-mono text-lg">{fmt(order.total_cents)}</p>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Status</Label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => {
                const current = key === order.status
                return (
                  <Button
                    key={key}
                    variant={current ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange(key as OrderStatus)}
                    disabled={updating}
                    className="text-xs"
                  >
                    {label}
                  </Button>
                )
              })}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Items</Label>
            <div className="space-y-2">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-accent/10">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-muted-foreground" />
                    <span>{item.product_name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {item.size && <span>Size: {item.size}</span>}
                    {item.color && <span>Color: {item.color}</span>}
                    <span>x{item.quantity}</span>
                    <span className="font-mono">{fmt(item.price_cents)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {order.shipping_address && Object.keys(order.shipping_address).length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Shipping Address</Label>
              <div className="text-sm bg-accent/10 rounded p-3">
                {Object.entries(order.shipping_address).map(([key, val]) => (
                  <p key={key}><span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span> {String(val)}</p>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Shipping & Tracking</Label>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px]">Carrier</Label>
                  <Input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="UPS, FedEx..." className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px]">Tracking Number</Label>
                  <Input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="1Z..." className="h-8 text-xs" />
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={saveShipping} className="text-xs">Save Shipping</Button>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Notes</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Internal notes..."
            />
            <Button variant="outline" size="sm" onClick={saveNotes} className="mt-1 text-xs">Save Notes</Button>
          </div>

          {(order.stripe_session_id || order.stripe_payment_intent) && (
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Stripe Payment</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={openStripe}>
                    <ExternalLink size={14} className="mr-1" /> Open in Stripe
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setVerifying(true)
                      setStripeStatus(null)
                      const result = await verifyStripePayment(order.id)
                      if ('error' in result) {
                        toast.error(result.error)
                      } else {
                        setStripeStatus(result)
                        if (result.paid && order.status !== 'paid' && order.status !== 'processing' && order.status !== 'shipped' && order.status !== 'delivered') {
                          const updateRes = await updateOrderStatus(order.id, 'paid')
                          if (updateRes.success) {
                            toast.success('Payment confirmed â€” order marked as Paid')
                            onUpdated({ ...order, status: 'paid', stripe_payment_intent: result.payment_intent })
                          }
                        } else if (!result.paid && order.status === 'paid') {
                          toast.warning('Payment not confirmed by Stripe â€” check manually')
                        } else {
                          toast.success(`Payment status: ${result.status}`)
                        }
                      }
                      setVerifying(false)
                    }}
                    disabled={verifying}
                    className="gap-1"
                  >
                    {verifying ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <ShieldCheck size={14} />
                    )}
                    {verifying ? 'Verifying...' : 'Verify Payment'}
                  </Button>
                </div>
                {stripeStatus && (
                  <div className="rounded-lg border border-border bg-accent/10 p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Stripe Status</span>
                      <Badge variant={stripeStatus.paid ? 'default' : 'secondary'} className="text-[10px]">
                        {stripeStatus.paid ? 'PAID' : stripeStatus.status.toUpperCase()}
                      </Badge>
                    </div>
                    {stripeStatus.payment_intent && (
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Payment Intent</span>
                        <span className="text-xs font-mono">{stripeStatus.payment_intent.slice(0, 20)}...</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Amount Received</span>
                      <span className="text-xs font-mono">{fmt(stripeStatus.amount_received_cents)}</span>
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => window.open(stripeStatus.dashboard_url, '_blank')}
                    >
                      <ExternalLink size={10} className="mr-1" /> View in Stripe Dashboard
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

