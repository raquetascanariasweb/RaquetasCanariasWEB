"use server"

import { auth } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"

export interface OrderItem {
  product_id: string
  product_name: string
  quantity: number
  price_cents: number
  size: string
  color: string
}

export interface Order {
  id: string
  status: string
  total_cents: number
  created_at: string
  stripe_session_id: string
  items: OrderItem[]
}

export async function getUserOrders(): Promise<Order[]> {
  const { userId } = await auth()
  if (!userId) return []

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("[getUserOrders] Supabase error:", error)
    return []
  }

  return (data ?? []).map((o: any) => ({
    id: o.id,
    status: o.status,
    total_cents: o.total_cents,
    created_at: o.created_at,
    stripe_session_id: o.stripe_session_id,
    items: o.items ?? [],
  }))
}
