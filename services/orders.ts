"use server"

import { auth } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { escapeLike } from "@/lib/utils"

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
  customer_email?: string
  discount_code?: string
  discount_amount_cents?: number
  gift_card_code?: string
  gift_card_amount_cents?: number
}

interface DbOrder {
  id: string
  status: string
  total_cents: number
  created_at: string
  stripe_session_id: string
  items: OrderItem[]
  customer_email: string | null
  discount_code: string | null
  discount_amount_cents: number | null
  gift_card_code: string | null
  gift_card_amount_cents: number | null
}

function mapOrder(o: DbOrder): Order {
  return {
    id: o.id,
    status: o.status,
    total_cents: o.total_cents,
    created_at: o.created_at,
    stripe_session_id: o.stripe_session_id,
    items: o.items ?? [],
    customer_email: o.customer_email ?? undefined,
    discount_code: o.discount_code ?? undefined,
    discount_amount_cents: o.discount_amount_cents ?? undefined,
    gift_card_code: o.gift_card_code ?? undefined,
    gift_card_amount_cents: o.gift_card_amount_cents ?? undefined,
  }
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

  return (data ?? []).map(mapOrder)
}

export async function lookupGuestOrder(reference: string, email: string): Promise<Order[]> {
  const cleanReference = reference.trim().replace(/^#/, "")
  const cleanEmail = email.trim().toLowerCase()
  if (cleanReference.length < 4 || !cleanEmail.includes("@")) {
    return []
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .ilike("id", `${escapeLike(cleanReference)}%`)
    .ilike("customer_email", cleanEmail)
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) {
    console.error("[lookupGuestOrder] Supabase error:", error)
    return []
  }

  return (data ?? []).map(mapOrder)
}
