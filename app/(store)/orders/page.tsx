"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2)
}

function OrderContent() {
  const searchParams = useSearchParams()!
  const sessionId = searchParams.get("session_id")
  const [status, setStatus] = useState<"loading" | "paid" | "pending" | "error">("loading")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!sessionId) {
      setStatus("error")
      setError("No se encontró el ID de la sesión.")
      return
    }

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
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-ember/10 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ember">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
          ¡Pago confirmado!
        </h1>
        <p className="text-sm text-linen mt-2 max-w-sm">
          Gracias por tu compra. Te hemos enviado un email con los detalles del pedido.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-ember text-black font-semibold text-sm hover:bg-ember/90 transition-colors"
        >
          Volver a la tienda
        </Link>
      </div>
    )
  }

  if (status === "pending") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-ember/10 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ember">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
          Pago pendiente
        </h1>
        <p className="text-sm text-linen mt-2 max-w-sm">
          Estamos esperando la confirmación del pago. Te notificaremos cuando se complete.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-ember text-black font-semibold text-sm hover:bg-ember/90 transition-colors"
        >
          Volver a la tienda
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-linen/30 flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-linen">
          <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
        Error en el pago
      </h1>
      <p className="text-sm text-linen mt-2 max-w-sm">{error}</p>
      <Link
        href="/cart"
        className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-ember text-black font-semibold text-sm hover:bg-ember/90 transition-colors"
      >
        Volver al carrito
      </Link>
    </div>
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
          <OrderContent />
        </Suspense>
      </div>
    </main>
  )
}
