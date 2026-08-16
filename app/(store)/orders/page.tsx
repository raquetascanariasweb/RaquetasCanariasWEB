"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { getUserOrders, lookupGuestOrder } from "@/services/orders"
import type { Order } from "@/services/orders"

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const statusLabels: Record<string, { label: string; color: string }> = {
  paid: { label: "Pagado", color: "bg-green-100 text-green-700 border-green-200" },
  pending: { label: "Pendiente", color: "bg-amber-100 text-amber-700 border-amber-200" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700 border-red-200" },
  refunded: { label: "Reembolsado", color: "bg-gray-100 text-gray-700 border-gray-200" },
}

function OrderCard({ order }: { order: Order }) {
  const status = statusLabels[order.status] || statusLabels.pending

  return (
    <div className="rounded-xl bg-white border border-[#DDD8CC] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-[#DDD8CC] bg-linen/20">
        <div>
          <p className="text-sm font-medium text-ink">
            Pedido del {formatDate(order.created_at)}
          </p>
          <p className="text-xs text-[#A09C95] font-mono mt-0.5">
            #{order.id.slice(0, 8)}
          </p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="p-4">
        <div className="space-y-2">
          {(order.items ?? []).slice(0, 3).map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex-1 min-w-0">
                <p className="text-ink truncate">
                  {item.product_name}
                  {item.size ? ` — ${item.size}` : ""}
                </p>
                <p className="text-xs text-[#A09C95]">x{item.quantity}</p>
              </div>
              <span className="font-mono text-ink ml-4 shrink-0">
                {formatPrice(item.price_cents * item.quantity)}€
              </span>
            </div>
          ))}
          {order.items && order.items.length > 3 && (
            <p className="text-xs text-[#A09C95]">+{order.items.length - 3} productos más</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#DDD8CC]">
          <span className="text-sm text-[#8A8680]">Total</span>
          <span className="font-mono text-lg font-semibold text-ink">
            {formatPrice(order.total_cents)}€
          </span>
        </div>
      </div>
    </div>
  )
}

function OrderHistory() {
  const { isLoaded } = useUser()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded) return
    getUserOrders()
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [isLoaded])

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-white border border-[#DDD8CC] overflow-hidden animate-pulse">
            <div className="h-14 bg-linen/20" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-linen/30 rounded w-3/4" />
              <div className="h-4 bg-linen/30 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-linen/30 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-linen">
            <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
          </svg>
        </div>
        <h2 className="text-lg font-medium text-ink">No tienes pedidos todavía</h2>
        <p className="text-sm text-linen mt-1">Tus pedidos aparecerán aquí cuando realices una compra.</p>
        <Link
          href="/"
          className="mt-4 px-6 py-2.5 rounded-xl bg-ember text-black font-semibold text-sm hover:bg-ember/90 transition-colors"
        >
          Ir a la tienda
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}

function OrderConfirmation() {
  const searchParams = useSearchParams()!
  const sessionId = searchParams.get("session_id")
  const [status, setStatus] = useState<"loading" | "paid" | "pending" | "error">(sessionId ? "loading" : "error")
  const [error, setError] = useState(sessionId ? "" : "No se encontró el ID de la sesión.")

  useEffect(() => {
    if (!sessionId) return

    async function verify() {
      try {
        const res = await fetch(`/api/verify-payment?session_id=${sessionId}`)
        const data = await res.json()
        if (data.status === "paid") {
          setStatus("paid")
        } else if (data.status === "pending" || data.status === "unpaid") {
          setStatus("pending")
        } else {
          setStatus("error")
          setError(data.error ?? "Error al verificar el pago.")
        }
      } catch {
        setStatus("error")
        setError("Error de conexión al verificar el pago.")
      }
    }
    verify()
  }, [sessionId])

  if (!sessionId) return null

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-ember/30 border-t-ember animate-spin mb-4" />
        <p className="text-ink font-medium">Verificando tu pago...</p>
      </div>
    )
  }

  if (status === "paid") {
    return (
      <div className="mb-8 rounded-xl bg-green-50 border border-green-200 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-green-800">¡Pago confirmado!</h2>
        <p className="text-sm text-green-700 mt-1">Gracias por tu compra. Te hemos enviado un email con los detalles.</p>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-green-700 underline hover:text-green-800">
          Volver a la tienda
        </Link>
      </div>
    )
  }

  if (status === "pending") {
    return (
      <div className="mb-8 rounded-xl bg-amber-50 border border-amber-200 p-6 text-center">
        <h2 className="text-lg font-semibold text-amber-800">Pago pendiente</h2>
        <p className="text-sm text-amber-700 mt-1">Estamos esperando la confirmación. Te notificaremos cuando se complete.</p>
      </div>
    )
  }

  return (
    <div className="mb-8 rounded-xl bg-red-50 border border-red-200 p-6 text-center">
      <h2 className="text-lg font-semibold text-red-800">Error en el pago</h2>
      <p className="text-sm text-red-700 mt-1">{error}</p>
      <Link href="/cart" className="mt-4 inline-block text-sm font-medium text-red-700 underline hover:text-red-800">
        Volver al carrito
      </Link>
    </div>
  )
}

function GuestOrderLookup() {
  const [reference, setReference] = useState("")
  const [email, setEmail] = useState("")
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setOrders(null)
    const result = await lookupGuestOrder(reference, email)
    if (result.length === 0) {
      setError("No encontramos ningún pedido con esa referencia y ese email.")
    } else {
      setOrders(result)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-linen/30 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-linen">
            <rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="12" cy="10" r="3" /><path d="M7 20v-1a5 5 0 0 1 10 0v1" />
          </svg>
        </div>
        <h2 className="text-lg font-medium text-ink">Consulta un pedido como invitado</h2>
        <p className="text-sm text-linen mt-1">
          Si compraste sin cuenta, busca tu pedido con la referencia que te mostramos al pagar y tu email.
        </p>
      </div>

      <form onSubmit={handleLookup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="order-reference">
            Referencia del pedido
          </label>
          <input
            id="order-reference"
            type="text"
            required
            minLength={4}
            placeholder="Ej: 1a2b3c4d"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-[#DDD8CC] bg-white text-sm text-ink outline-none focus:border-ember transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="order-email">
            Email de la compra
          </label>
          <input
            id="order-email"
            type="email"
            required
            placeholder="tucorreo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-[#DDD8CC] bg-white text-sm text-ink outline-none focus:border-ember transition-colors"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-2.5 rounded-xl bg-ember text-black font-semibold text-sm hover:bg-ember/90 transition-colors disabled:opacity-60"
        >
          {loading ? "Buscando..." : "Buscar mi pedido"}
        </button>
      </form>

      {orders && orders.length > 0 && (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      <div className="mt-10 text-center">
        <p className="text-sm text-linen">¿Tienes una cuenta?</p>
        <Link
          href="/sign-in?redirect_url=/orders"
          className="mt-1 inline-block text-sm font-medium text-ember hover:underline"
        >
          Inicia sesión para ver todos tus pedidos
        </Link>
      </div>
    </div>
  )
}

function OrdersContent() {
  const { isSignedIn } = useUser()

  return (
    <>
      <OrderConfirmation />
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-6">
        Mis Pedidos
      </h1>
      {isSignedIn ? <OrderHistory /> : <GuestOrderLookup />}
    </>
  )
}

export default function OrdersPage() {
  return (
    <main className="flex-1 pt-16 sm:pt-18">
      <div className="container-main py-8 sm:py-12">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full border-2 border-ember/30 border-t-ember animate-spin mb-4" />
            <p className="text-ink font-medium">Cargando...</p>
          </div>
        }>
          <OrdersContent />
        </Suspense>
      </div>
    </main>
  )
}
