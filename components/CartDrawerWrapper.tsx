"use client"

import dynamic from "next/dynamic"

const CartDrawerInner = dynamic(() => import("@/components/CartDrawer"), { ssr: false })

export default function CartDrawerWrapper() {
  return <CartDrawerInner />
}
