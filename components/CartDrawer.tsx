"use client"

import { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { useCartStore } from "@/store/cart"

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2)
}

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal } = useCartStore()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  async function handleCheckout() {
    closeCart()
    window.location.href = "/checkout"
  }

  const shipping = subtotal() >= 7500 ? 0 : 300
  const total = subtotal() + shipping

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={closeCart}
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#111] border-l border-white/10 z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="font-display text-lg font-bold text-white">
                Carrito ({items.reduce((s, i) => s + i.quantity, 0)})
              </h2>
              <button
                onClick={closeCart}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
                    <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                  </svg>
                </div>
                <p className="text-white font-medium">Tu carrito está vacío</p>
                <button
                  onClick={closeCart}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-ember text-black font-semibold text-sm hover:bg-ember/90 transition-colors"
                >
                  Seguir comprando
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="w-16 h-16 rounded-lg bg-white/5 overflow-hidden shrink-0 relative">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/20" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white leading-tight truncate">{item.name}</h4>
                        <p className="text-xs text-white/40 mt-0.5">{item.color}{item.size ? ` / ${item.size}` : ""}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-white/10 rounded-md">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center text-xs text-white/60 hover:text-white transition-colors"
                            >−</button>
                            <span className="w-6 text-center text-xs text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center text-xs text-white/60 hover:text-white transition-colors"
                            >+</button>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-xs text-white/30 hover:text-ember transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="font-mono text-sm font-semibold text-white shrink-0">
                        {formatPrice(item.price_cents * item.quantity)}€
                      </p>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-white/10 space-y-3">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-white/60">
                      <span>Subtotal</span>
                      <span className="font-mono">{formatPrice(subtotal())}€</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>Envío</span>
                      <span className="font-mono">
                        {shipping === 0 ? <span className="text-ember">Gratis</span> : `${formatPrice(shipping)}€`}
                      </span>
                    </div>
                    <div className="h-px bg-white/10 my-2" />
                    <div className="flex justify-between font-semibold text-white">
                      <span>Total</span>
                      <span className="font-mono">{formatPrice(total)}€</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full py-3 rounded-xl bg-ember text-black font-semibold text-sm hover:bg-ember/90 transition-colors"
                  >
                    Pagar {formatPrice(total)}€
                  </button>

                  <Link
                    href="/cart"
                    onClick={closeCart}
                    className="block text-center text-xs text-white/40 hover:text-white transition-colors"
                  >
                    Ver carrito completo
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
