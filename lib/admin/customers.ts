'use server'

import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AdminCustomer } from './types'

async function checkAdmin() {
  await requireAdmin()
}

export async function getCustomers(): Promise<AdminCustomer[]> {
  await checkAdmin()
  const supabase = createAdminClient()

  // 1. Fetch order stats
  const { data: orders } = await supabase.from('orders').select('user_id, total_cents, status, created_at')
  const orderStats = new Map<string, { order_count: number; total_spent: number; first_order: string }>()

  for (const o of orders ?? []) {
    if (!o.user_id) continue
    const entry = orderStats.get(o.user_id) ?? { order_count: 0, total_spent: 0, first_order: o.created_at }
    entry.order_count++
    if (o.status !== 'cancelled' && o.status !== 'refunded') entry.total_spent += o.total_cents
    if (o.created_at && o.created_at < entry.first_order) entry.first_order = o.created_at
    orderStats.set(o.user_id, entry)
  }

  // 2. Fetch all Clerk users
  const customers: AdminCustomer[] = []
  try {
    const secretKey = process.env.CLERK_SECRET_KEY
    if (secretKey) {
      let page = 1
      let hasMore = true
      while (hasMore) {
        const res = await fetch(`https://api.clerk.com/v1/users?limit=100&offset=${(page - 1) * 100}`, {
          headers: { Authorization: `Bearer ${secretKey}` },
        })
        if (!res.ok) break
        const clerkUsers = await res.json() as any[]
        if (clerkUsers.length === 0) break
        for (const u of clerkUsers) {
          const stats = orderStats.get(u.id)
          customers.push({
            id: u.id,
            email: u.email_addresses?.[0]?.email_address ?? '',
            first_name: u.first_name ?? '',
            last_name: u.last_name ?? '',
            order_count: stats?.order_count ?? 0,
            total_spent: stats?.total_spent ?? 0,
            created_at: u.created_at ?? '',
          })
        }
        hasMore = clerkUsers.length === 100
        page++
      }
    }
  } catch { /* clerk api not available */ }

  // 3. Fallback: if Clerk API failed, show order-only customers
  if (customers.length === 0) {
    for (const [userId, stats] of Array.from(orderStats.entries())) {
      customers.push({
        id: userId,
        email: '',
        first_name: '',
        last_name: '',
        order_count: stats.order_count,
        total_spent: stats.total_spent,
        created_at: stats.first_order ?? '',
      })
    }
  }

  return customers.sort((a, b) => b.total_spent - a.total_spent)
}

export async function getCustomerOrders(userId: string): Promise<any[]> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data ?? []
}
