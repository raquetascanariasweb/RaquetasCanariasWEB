'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, Minus, Plus, Trash2, ChevronLeft, Lock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useCartStore } from '@/store/cart'
import { useShipping } from '@/hooks/useShipping'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function CheckoutPage() {
  const { items, updateQuantity, removeItem, subtotal, totalItems, clearCart } = useCartStore()
  const { settings, shippingCost } = useShipping()
  const { user, isSignedIn } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()!
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)

  const [paymentSettings, setPaymentSettings] = useState<{ bizum_enabled: boolean; bizum_phone: string; stripe_enabled: boolean; paypal_enabled: boolean } | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'bizum'>('stripe')
  const [bizumOrder, setBizumOrder] = useState<{ orderId: string; total: number } | null>(null)

  useEffect(() => {
    fetch('/api/public/payments')
      .then((res) => res.json())
      .then((data) => {
        setPaymentSettings(data)
        setPaymentMethod(data.stripe_enabled ? 'stripe' : data.bizum_enabled ? 'bizum' : 'stripe')
      })
      .catch((e) => console.error('[checkout] payment settings error', e))
  }, [])

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'España',
    notes: '',
  })

  const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? ''
  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''
  const [prefilledEmail, setPrefilledEmail] = useState(userEmail)
  if (user && userEmail !== prefilledEmail) {
    setPrefilledEmail(userEmail)
    setForm((prev) => ({
      ...prev,
      name: userName || prev.name,
      email: userEmail || prev.email,
    }))
  }

  const subtotalCents = subtotal()
  const shipping = shippingCost(subtotalCents)
  const total = subtotalCents + shipping

  const canceled = searchParams.get('canceled') === '1'

  if (canceled) {
    return (
      <main className="flex-1 pt-16 sm:pt-18">
        <div className="container-main py-8 sm:py-12">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-linen/30 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-linen">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Pago cancelado</h1>
            <p className="text-sm text-linen mt-2 max-w-sm">No se ha realizado ningún cargo. Puedes volver al carrito cuando quieras.</p>
            <Link href="/cart" className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-ember text-black font-semibold text-sm hover:bg-ember/90 transition-colors">
              Volver al carrito
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (bizumOrder) {
    const bizumPhone = paymentSettings?.bizum_phone || ''
    return (
      <main className="flex-1 pt-16 sm:pt-18">
        <div className="container-main py-8 sm:py-12">
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-ember/20 flex items-center justify-center mb-4">
              <span className="text-2xl">📱</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Confirma tu pago por Bizum</h1>
            <p className="text-sm text-linen mt-2">
              Para completar tu pedido <strong>#{bizumOrder.orderId.slice(0, 8)}</strong>, envía <strong>{formatPrice(bizumOrder.total)}</strong> al número:
            </p>
            <p className="text-xl font-bold text-ink mt-4">{bizumPhone}</p>
            <p className="text-xs text-linen mt-2">
              Indica en el concepto: <span className="font-mono text-ink">Pedido #{bizumOrder.orderId.slice(0, 8)}</span>
            </p>
            <p className="text-xs text-linen/70 mt-6 max-w-sm">
              Tu pedido quedará en estado pendiente hasta que el equipo de Sportbalin verifique el pago. Recibirás un correo de confirmación en cuanto lo revisemos.
            </p>
            <Link href="/shop" className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-ember text-black font-semibold text-sm hover:bg-ember/90 transition-colors">
              Volver a la tienda
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const handleCheckout = async () => {
    if (!isSignedIn) {
      if (!form.name || !form.address || !form.city) {
        setError('Por favor completa nombre, dirección y ciudad')
        return
      }
    }
    setLoading(true)
    setError(null)
    try {
      const body: {
        items: { product_id: string; size: string; color: string; quantity: number }[]
        shippingAddress?: typeof form
        paymentMethod: 'stripe' | 'bizum'
        notes?: string
      } = {
        items: items.map((i) => ({
          product_id: i.product_id,
          size: i.size,
          color: i.color,
          quantity: i.quantity,
        })),
        paymentMethod,
        notes: form.notes,
      }
      if (!isSignedIn) body.shippingAddress = form

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al procesar el pago')
      if (data.paymentMethod === 'bizum') {
        clearCart()
        setBizumOrder({ orderId: data.orderId, total })
      } else {
        window.location.href = data.url
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo salió mal')
      toast.error(e instanceof Error ? e.message : 'Error al procesar el pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex-1 bg-paper">
      <div className="container-main py-6 sm:py-10">
        <Link href="/cart" className="mb-8 inline-flex items-center gap-1.5 text-sm text-linen hover:text-ink transition-colors">
          <ChevronLeft size={16} strokeWidth={1.5} />
          Volver al carrito
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Left: Shipping + Cart */}
          <div className="lg:col-span-7 space-y-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-ink">Checkout</h1>

            {/* Shipping form — only for guests */}
            {!isSignedIn && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">Dirección de envío</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  placeholder="Nombre completo *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <Input
                  placeholder="Teléfono"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="sm:col-span-2"
                />
                <Input
                  placeholder="Dirección *"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="sm:col-span-2"
                  required
                />
                <Input
                  placeholder="Ciudad *"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                />
                <Input
                  placeholder="Código postal"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                />
                <Input
                  placeholder="País"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="sm:col-span-2"
                />
              </div>
              <div>
                <Input
                  placeholder="Notas del pedido (opcional)"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            )}

            {/* Cart items */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">Tu pedido ({mounted ? totalItems() : 0} artículos)</h2>
              {items.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <ShoppingBag size={40} strokeWidth={1} className="mx-auto mb-4 text-linen/30" />
                  <p className="text-sm text-linen">Tu carrito está vacío</p>
                  <Link href="/shop" className="mt-4 text-sm text-ember hover:underline">Ir a la tienda</Link>
                </div>
              ) : (
                <div className="divide-y divide-[#E5E0D8]">
                  {items.map((item) => (
                    <motion.div key={item.id} layout className="flex gap-4 py-4">
                      <div className="relative w-20 h-24 shrink-0 bg-linen/20 rounded-lg overflow-hidden">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-black text-white/50 text-xs">Sin imagen</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{item.name}</p>
                        <p className="text-xs text-linen mt-0.5">
                          {[item.size, item.color].filter(Boolean).join(' / ') || '-'}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 border border-[#E5E0D8] rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1.5 text-linen hover:text-ink transition-colors"
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-sm min-w-[28px] text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1.5 text-linen hover:text-ink transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-ink">{formatPrice(item.price_cents * item.quantity)}</span>
                            <button onClick={() => removeItem(item.id)} className="text-linen/40 hover:text-red-500 transition-colors">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-[76px] bg-white border border-[#E5E0D8] rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-bold text-ink">Resumen del pedido</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-linen">Subtotal</span>
                  <span className="text-ink">{mounted ? formatPrice(subtotalCents) : '...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-linen">Envío</span>
                  <span className="text-ink">{mounted ? (shipping === 0 ? 'Gratis' : formatPrice(shipping)) : '...'}</span>
                </div>
                {mounted && subtotalCents > 0 && subtotalCents < settings.free_shipping_threshold * 100 && (
                  <p className="text-xs text-linen/70">
                    Añade {formatPrice(settings.free_shipping_threshold * 100 - subtotalCents)} más para envío gratis
                  </p>
                )}
                <div className="border-t border-[#E5E0D8] pt-3 flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>{mounted ? formatPrice(total) : '...'}</span>
                </div>
              </div>

              {paymentSettings && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Método de pago</p>
                  {paymentSettings.stripe_enabled && (
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${paymentMethod === 'stripe' ? 'border-ember bg-ember/5' : 'border-[#E5E0D8] hover:bg-gray-50'}`}>
                      <input type="radio" name="paymentMethod" value="stripe" checked={paymentMethod === 'stripe'} onChange={() => setPaymentMethod('stripe')} className="accent-ember" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink">Tarjeta (Stripe)</p>
                        <p className="text-xs text-linen">Pago seguro con tarjeta</p>
                      </div>
                    </label>
                  )}
                  {paymentSettings.bizum_enabled && (
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${paymentMethod === 'bizum' ? 'border-ember bg-ember/5' : 'border-[#E5E0D8] hover:bg-gray-50'}`}>
                      <input type="radio" name="paymentMethod" value="bizum" checked={paymentMethod === 'bizum'} onChange={() => setPaymentMethod('bizum')} className="accent-ember" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink">Bizum</p>
                        <p className="text-xs text-linen">Pago manual por Bizum</p>
                      </div>
                    </label>
                  )}
                  {!paymentSettings.stripe_enabled && !paymentSettings.bizum_enabled && (
                    <p className="text-sm text-red-500">No hay métodos de pago activos.</p>
                  )}
                </div>
              )}

              {error && (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</div>
              )}

              <Button
                className="w-full h-12 bg-ember hover:bg-ember/90 text-black font-semibold text-sm rounded-xl gap-2"
                onClick={handleCheckout}
                disabled={loading || items.length === 0 || (!paymentSettings?.stripe_enabled && !paymentSettings?.bizum_enabled)}
              >
                {loading ? (
                  'Procesando...'
                ) : paymentMethod === 'bizum' ? (
                  `Confirmar pedido ${mounted ? formatPrice(total) : '...'}`
                ) : (
                  <>
                    <Lock size={15} />
                    Confirmar y pagar {mounted ? formatPrice(total) : '...'}
                  </>
                )}
              </Button>

              <p className="text-[11px] text-linen/60 text-center">
                Al confirmar aceptas nuestros{' '}
                <Link href="/terms" className="underline hover:text-ink">términos y condiciones</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
