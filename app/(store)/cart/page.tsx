"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCartStore } from "@/store/cart"
import { useUser } from "@clerk/nextjs"

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2)
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCartStore()
  const { isSignedIn } = useUser()
  const router = useRouter()
  const [checkingOut, setCheckingOut] = useState(false)

  async function handleCheckout() {
    if (!isSignedIn) {
      router.push("/sign-in?redirect_url=/cart")
      return
    }
    router.push("/checkout")
  }

  const shipping = subtotal() >= 7500 ? 0 : 300
  const total = subtotal() + shipping

  return (
    <main className="flex-1 pt-16 sm:pt-18">
      <div className="container-main py-8 sm:py-12">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight mb-8">
          Carrito
        </h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-linen/60 border border-linen/40 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-linen">
                <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
            </div>
            <p className="text-ink font-medium">Tu carrito está vacío</p>
            <p className="text-sm text-linen mt-1">Explora nuestra colección y añade productos.</p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-ember text-black font-semibold text-sm hover:bg-ember/90 transition-colors"
            >
              Ver productos
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            <div className="flex-1 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 rounded-xl bg-white border border-linen/40"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-linen/30 overflow-hidden shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-linen">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-ink leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-xs text-linen mt-0.5">
                      {item.color}{item.size ? ` / ${item.size}` : ""}
                    </p>
                    <p className="font-mono text-sm font-semibold text-ink mt-1">
                      {formatPrice(item.price_cents)}€
                    </p>

                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-linen/60 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-sm text-ink hover:bg-linen/30 transition-colors"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm text-ink font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-sm text-ink hover:bg-linen/30 transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-xs text-linen hover:text-ember transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm font-semibold text-ink">
                      {formatPrice(item.price_cents * item.quantity)}€
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:w-80 shrink-0">
              <div className="sticky top-24 p-6 rounded-xl bg-white border border-linen/40">
                <h2 className="text-sm font-semibold text-ink mb-4">Resumen del pedido</h2>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-ink/70">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatPrice(subtotal())}€</span>
                  </div>
                  <div className="flex justify-between text-ink/70">
                    <span>Envío</span>
                    <span className="font-mono">
                      {shipping === 0 ? (
                        <span className="text-ember">Gratis</span>
                      ) : (
                        `${formatPrice(shipping)}€`
                      )}
                    </span>
                  </div>
                  {subtotal() < 7500 && (
                    <p className="text-xs text-linen mt-1">
                      Añade {formatPrice(7500 - subtotal())}€ más para envío gratis
                    </p>
                  )}
                  <div className="h-px bg-linen/60 my-3" />
                  <div className="flex justify-between font-semibold text-ink">
                    <span>Total</span>
                    <span className="font-mono">{formatPrice(total)}€</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="mt-6 w-full py-3 rounded-xl bg-ember text-black font-semibold text-sm hover:bg-ember/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {checkingOut ? "Procesando..." : "Proceder al pago"}
                </button>

                <Link
                  href="/"
                  className="mt-3 block text-center text-xs text-linen hover:text-ink transition-colors"
                >
                  Seguir comprando
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
