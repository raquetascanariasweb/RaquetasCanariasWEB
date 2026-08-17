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

  const { data: orders } = await supabase.from('orders').select('user_id, total_cents, status, created_at')
  const userMap = new Map<string, { order_count: number; total_spent: number; first_order: string }>()

  for (const o of orders ?? []) {
    if (!o.user_id) continue
    const entry = userMap.get(o.user_id) ?? { order_count: 0, total_spent: 0, first_order: o.created_at }
    entry.order_count++
    if (o.status !== 'cancelled' && o.status !== 'refunded') entry.total_spent += o.total_cents
    if (o.created_at && o.created_at < entry.first_order) entry.first_order = o.created_at
    userMap.set(o.user_id, entry)
  }

  const customers: AdminCustomer[] = []
  const userIds = Array.from(userMap.keys())

  try {
    const secretKey = process.env.CLERK_SECRET_KEY
    if (secretKey && userIds.length > 0) {
      const queryParams = userIds.map((id) => `user_id=${encodeURIComponent(id)}`).join('&')
      const res = await fetch(`https://api.clerk.com/v1/users?limit=100&${queryParams}`, {
        headers: { Authorization: `Bearer ${secretKey}` },
      })
      if (res.ok) {
        const clerkUsers = await res.json() as any[]
        const clerkMap = new Map(clerkUsers.map((u: any) => [u.id, u]))
        for (const userId of userIds) {
          const u = clerkMap.get(userId)
          const info = userMap.get(userId)!
          customers.push({
            id: userId,
            email: u?.email_addresses?.[0]?.email_address ?? '',
            first_name: u?.first_name ?? '',
            last_name: u?.last_name ?? '',
            order_count: info.order_count,
            total_spent: info.total_spent,
            created_at: u?.created_at ?? info.first_order ?? '',
          })
        }
      }
    }
  } catch { /* clerk api not available */ }

  if (customers.length === 0) {
    for (const [userId, info] of Array.from(userMap.entries())) {
      customers.push({
        id: userId,
        email: '',
        first_name: '',
        last_name: '',
        order_count: info.order_count,
        total_spent: info.total_spent,
        created_at: info.first_order ?? '',
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
