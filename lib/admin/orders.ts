'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { revalidatePath } from 'next/cache'
import type {
  AdminOrder, OrderStatus, DashboardMetrics, RevenuePoint,
  TopProduct, LowStockProduct, RecentCustomerEntry,
  QuickDashboardData, ActivityEvent,
} from './types'

async function checkAdmin() {
  const { userId } = await auth()
  const adminId = process.env.ADMIN_USER_ID || 'user_3G8ZXADowWQkNZdX65U1djf8JYZ'
  if (!userId || (adminId && userId !== adminId)) throw new Error('Unauthorized')
}

export async function bulkDeleteOrders(ids: string[]) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('orders').delete().in('id', ids)
  if (error) return { error: error.message }
  revalidatePath('/admin/orders')
  return { success: true }
}

export async function bulkUpdateOrdersStatus(ids: string[], status: OrderStatus) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('orders').update({ status }).in('id', ids)
  if (error) return { error: error.message }
  revalidatePath('/admin/orders')
  return { success: true }
}

export async function getOrders(status?: string): Promise<AdminOrder[]> {
  await checkAdmin()
  const supabase = createAdminClient()
  let q = supabase.from('orders').select('*').neq('status', 'draft').order('created_at', { ascending: false })
  if (status && status !== 'all') q = q.eq('status', status)
  const { data } = await q
  return (data ?? []) as AdminOrder[]
}

export async function getOrder(id: string): Promise<AdminOrder | null> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase.from('orders').select('*').eq('id', id).single()
  return data as AdminOrder | null
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/orders')
  return { success: true }
}

export async function updateOrderNotes(id: string, notes: string) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('orders').update({ notes }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/orders')
  return { success: true }
}

export async function updateOrderShipping(id: string, tracking_number: string, shipping_carrier: string) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('orders').update({ tracking_number, shipping_carrier }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/orders')
  return { success: true }
}

export async function getStripeSessionUrl(sessionId: string): Promise<string | null> {
  await checkAdmin()
  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return `https://dashboard.stripe.com/payments/${session.payment_intent || sessionId}`
  } catch {
    return null
  }
}

export interface StripePaymentStatus {
  status: string
  paid: boolean
  amount_received_cents: number
  payment_intent: string | null
  dashboard_url: string
}

export async function verifyStripePayment(orderId: string): Promise<StripePaymentStatus | { error: string }> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data: order } = await supabase.from('orders').select('stripe_session_id, stripe_payment_intent').eq('id', orderId).single()
  if (!order) return { error: 'Order not found' }
  if (!order.stripe_session_id && !order.stripe_payment_intent) return { error: 'No Stripe session or payment intent associated' }

  try {
    const stripe = getStripe()

    if (order.stripe_payment_intent) {
      const pi = await stripe.paymentIntents.retrieve(order.stripe_payment_intent)
      return {
        status: pi.status,
        paid: pi.status === 'succeeded',
        amount_received_cents: pi.amount_received,
        payment_intent: pi.id,
        dashboard_url: `https://dashboard.stripe.com/payments/${pi.id}`,
      }
    }

    const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id!)
    const paymentIntentId = session.payment_intent as string | null

    if (paymentIntentId) {
      await supabase.from('orders').update({ stripe_payment_intent: paymentIntentId }).eq('id', orderId)
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
      return {
        status: pi.status,
        paid: pi.status === 'succeeded',
        amount_received_cents: pi.amount_received,
        payment_intent: pi.id,
        dashboard_url: `https://dashboard.stripe.com/payments/${pi.id}`,
      }
    }

    return {
      status: session.status ?? 'unknown',
      paid: session.payment_status === 'paid',
      amount_received_cents: session.amount_total ?? 0,
      payment_intent: null,
      dashboard_url: `https://dashboard.stripe.com/session/${order.stripe_session_id}`,
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Stripe verification failed' }
  }
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  await checkAdmin()
  const supabase = createAdminClient()

  const { data: orders } = await supabase.from('orders').select('total_cents, status, created_at, user_id')

  const confirmedStatuses = ['paid', 'processing', 'shipped', 'delivered']

  const totalOrders = orders?.length ?? 0
  const confirmedOrders = orders?.filter((o) => confirmedStatuses.includes(o.status)) ?? []
  const totalRevenue = confirmedOrders.reduce((s, o) => s + o.total_cents, 0)
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

  const today = new Date().toISOString().split('T')[0]
  const thisMonth = new Date().toISOString().slice(0, 7)

  const todayOrders = orders?.filter((o) => o.created_at?.startsWith(today)) ?? []
  const todayValid = todayOrders.filter((o) => confirmedStatuses.includes(o.status))
  const revenueToday = todayValid.reduce((s, o) => s + o.total_cents, 0)

  const thisMonthOrders = orders?.filter((o) => o.created_at?.startsWith(thisMonth)) ?? []
  const thisMonthValid = thisMonthOrders.filter((o) => confirmedStatuses.includes(o.status))
  const revenueThisMonth = thisMonthValid.reduce((s, o) => s + o.total_cents, 0)

  const ordersPending = orders?.filter((o) => o.status === 'pending').length ?? 0

  const { count: outOfStock } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .or('in_stock.eq.false,and(track_inventory.eq.true,stock_quantity.lte.0)')

  const thisMonthUserIds = new Set(thisMonthOrders.map((o) => o.user_id).filter(Boolean))
  let newCustomers = 0
  let returningCustomers = 0

  for (const userId of Array.from(thisMonthUserIds)) {
    const userOrders = orders?.filter((o) => o.user_id === userId) ?? []
    const dates = userOrders.map((o) => o.created_at).filter(Boolean).sort() as string[]
    const firstOrderMonth = dates[0]?.slice(0, 7)
    if (firstOrderMonth === thisMonth) {
      newCustomers++
    } else {
      returningCustomers++
    }
  }

  return {
    revenue_today: revenueToday,
    revenue_this_month: revenueThisMonth,
    orders_today: todayOrders.length,
    orders_pending: ordersPending,
    average_order_value: avgOrderValue,
    products_out_of_stock: outOfStock ?? 0,
    new_customers: newCustomers,
    returning_customers: returningCustomers,
  }
}

export async function getTopSellingProducts(limit = 5): Promise<TopProduct[]> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('items, status')
    .in('status', ['paid', 'processing', 'shipped', 'delivered'])

  const productMap = new Map<string, TopProduct>()

  for (const o of orders ?? []) {
    const items = (o.items as any[]) ?? []
    for (const item of items) {
      const existing = productMap.get(item.product_id) ?? {
        product_id: item.product_id,
        name: item.product_name,
        quantity: 0,
        revenue: 0,
      }
      existing.quantity += item.quantity ?? 1
      existing.revenue += (item.price_cents ?? 0) * (item.quantity ?? 1)
      productMap.set(item.product_id, existing)
    }
  }

  return Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit)
}

export async function getLowStockProducts(limit = 5): Promise<LowStockProduct[]> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('products')
    .select('name, stock_quantity, track_inventory, in_stock')
    .or('in_stock.eq.false,and(track_inventory.eq.true,stock_quantity.lt.10)')
    .order('stock_quantity', { ascending: true })
    .limit(limit)
  return data ?? []
}

export async function getRecentCustomers(limit = 5): Promise<RecentCustomerEntry[]> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('user_id, total_cents, status, created_at')
    .order('created_at', { ascending: false })

  const userMap = new Map<string, { total_spent: number; order_count: number; latest: string }>()

  for (const o of orders ?? []) {
    if (!o.user_id) continue
    const entry = userMap.get(o.user_id) ?? { total_spent: 0, order_count: 0, latest: o.created_at }
    entry.order_count++
    if (o.status !== 'cancelled' && o.status !== 'refunded') entry.total_spent += o.total_cents
    if (o.created_at > entry.latest) entry.latest = o.created_at
    userMap.set(o.user_id, entry)
  }

  const sorted = Array.from(userMap.entries())
    .sort(([, a], [, b]) => b.latest.localeCompare(a.latest))
    .slice(0, limit)

  const clerkBaseUrl = 'https://api.clerk.com/v1'
  const secretKey = process.env.CLERK_SECRET_KEY

  const results: RecentCustomerEntry[] = []
  for (const [userId, info] of sorted) {
    let name = ''
    let email = ''
    if (secretKey) {
      try {
        const res = await fetch(`${clerkBaseUrl}/users/${userId}`, {
          headers: { Authorization: `Bearer ${secretKey}` },
        })
        if (res.ok) {
          const u = await res.json()
          name = [u.first_name, u.last_name].filter(Boolean).join(' ') || userId.slice(0, 8)
          email = u.email_addresses?.[0]?.email_address ?? ''
        }
      } catch {}
    }
    results.push({
      id: userId,
      email,
      name: name || userId.slice(0, 8),
      total_spent: info.total_spent,
      order_count: info.order_count,
    })
  }

  return results
}

export async function getRevenueChart(days = 30): Promise<RevenuePoint[]> {
  await checkAdmin()
  const supabase = createAdminClient()

  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data: orders } = await supabase
    .from('orders')
    .select('total_cents, status, created_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true })

  const map = new Map<string, { revenue: number; orders: number }>()
  const confirmedStatuses = ['paid', 'processing', 'shipped', 'delivered']

  for (let i = 0; i < days; i++) {
    const d = new Date(since)
    d.setDate(d.getDate() + i)
    map.set(d.toISOString().split('T')[0], { revenue: 0, orders: 0 })
  }

  for (const o of orders ?? []) {
    const date = o.created_at?.split('T')[0]
    if (date && map.has(date)) {
      const entry = map.get(date)!
      entry.orders++
      if (confirmedStatuses.includes(o.status)) {
        entry.revenue += o.total_cents
      }
    }
  }

  return Array.from(map.entries()).map(([date, data]) => ({
    date,
    ...data,
  }))
}

export async function getQuickDashboard(): Promise<QuickDashboardData> {
  await checkAdmin()
  const supabase = createAdminClient()

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const thisMonth = now.toISOString().slice(0, 7)
  const fourteenDaysAgo = new Date(now)
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  const confirmed = ['paid', 'processing', 'shipped', 'delivered']

  const [
    { data: orders },
    { data: allOrdersStatus },
    { data: products },
    { data: categories },
    { data: discounts },
    { data: chartOrders },
  ] = await Promise.all([
    supabase.from('orders').select('id, user_id, total_cents, status, created_at, items').neq('status', 'draft').order('created_at', { ascending: false }).limit(100),
    supabase.from('orders').select('status').neq('status', 'draft'),
    supabase.from('products').select('id, name, status, track_inventory, stock_quantity, in_stock'),
    supabase.from('categories').select('id'),
    supabase.from('discounts').select('id, active, expires_at'),
    supabase.from('orders').select('total_cents, status, created_at, items').gte('created_at', fourteenDaysAgo.toISOString()).order('created_at', { ascending: true }),
  ])

  const allOrders = orders ?? []
  const allStatuses = allOrdersStatus ?? []
  const allProducts = products ?? []
  const allCats = categories ?? []
  const allDiscounts = discounts ?? []
  const allChartOrders = chartOrders ?? []

  const todayOrders = allOrders.filter((o: any) => o.created_at?.startsWith(today))
  const todayConfirmed = todayOrders.filter((o: any) => confirmed.includes(o.status))
  const revenueToday = todayConfirmed.reduce((s: number, o: any) => s + o.total_cents, 0)

  const thisMonthOrders = allOrders.filter((o: any) => o.created_at?.startsWith(thisMonth))
  const thisMonthConfirmed = thisMonthOrders.filter((o: any) => confirmed.includes(o.status))
  const revenueThisMonth = thisMonthConfirmed.reduce((s: number, o: any) => s + o.total_cents, 0)

  const confirmedOrders = allOrders.filter((o: any) => confirmed.includes(o.status))
  const totalRevenue = confirmedOrders.reduce((s: number, o: any) => s + o.total_cents, 0)
  const allOrderCount = allOrders.length
  const avgOrderValue = allOrderCount > 0 ? Math.round(totalRevenue / allOrderCount) : 0

  const pendingCount = allStatuses.filter((s: any) => s.status === 'pending').length

  const activeProds = allProducts.filter((p: any) => p.status === 'active').length
  const outOfStock = allProducts.filter((p: any) => !p.in_stock).length
  const lowStock = allProducts.filter((p: any) => p.track_inventory && p.in_stock && p.stock_quantity > 0 && p.stock_quantity < 5).length

  const userSet = new Set<string>()
  const thisMonthUserSet = new Set<string>()
  let newCustomers = 0

  for (const o of allOrders) {
    if (!o.user_id) continue
    userSet.add(o.user_id)
    if (o.created_at?.startsWith(thisMonth)) {
      thisMonthUserSet.add(o.user_id)
    }
  }

  const userFirstOrderMonth = new Map<string, string>()
  for (const o of allOrders) {
    if (!o.user_id) continue
    const m = o.created_at?.slice(0, 7)
    if (!userFirstOrderMonth.has(o.user_id) || m < userFirstOrderMonth.get(o.user_id)!) {
      userFirstOrderMonth.set(o.user_id, m)
    }
  }
  for (const uid of Array.from(thisMonthUserSet)) {
    if (userFirstOrderMonth.get(uid) === thisMonth) newCustomers++
  }

  const activeDiscounts = allDiscounts.filter((d: any) => d.active).length
  const expiredDiscounts = allDiscounts.filter((d: any) => {
    if (!d.active) return false
    if (!d.expires_at) return false
    return new Date(d.expires_at) < now
  }).length

  const chartMap = new Map<string, { revenue_cents: number; orders: number }>()
  for (let i = 0; i < 14; i++) {
    const d = new Date(fourteenDaysAgo)
    d.setDate(d.getDate() + i)
    chartMap.set(d.toISOString().split('T')[0], { revenue_cents: 0, orders: 0 })
  }
  for (const o of allChartOrders) {
    const dateKey = o.created_at?.split('T')[0]
    if (dateKey && chartMap.has(dateKey)) {
      const e = chartMap.get(dateKey)!
      e.orders++
      if (confirmed.includes(o.status)) {
        e.revenue_cents += o.total_cents
      }
    }
  }
  const revenueChart = Array.from(chartMap.entries()).map(([date, d]) => ({
    date,
    revenue_cents: d.revenue_cents,
    orders: d.orders,
  }))

  const prodMap = new Map<string, { name: string; quantity: number; revenue_cents: number }>()
  for (const o of confirmedOrders) {
    const items = (o.items as any[]) ?? []
    for (const item of items) {
      const existing = prodMap.get(item.product_id) ?? {
        name: item.product_name ?? 'Unknown',
        quantity: 0,
        revenue_cents: 0,
      }
      existing.quantity += item.quantity ?? 1
      existing.revenue_cents += (item.price_cents ?? 0) * (item.quantity ?? 1)
      prodMap.set(item.product_id, existing)
    }
  }
  const topProducts = Array.from(prodMap.values())
    .sort((a, b) => b.revenue_cents - a.revenue_cents)
    .slice(0, 5)

  const activity: ActivityEvent[] = []

  const recentOrders = allOrders.slice(0, 8)
  for (const o of recentOrders) {
    const type = o.status === 'pending' ? 'order_pending' as const :
                 o.status === 'paid' ? 'order_paid' as const :
                 o.status === 'shipped' ? 'order_shipped' as const : null
    if (type) {
      const itemCount = (o.items as any[] ?? []).reduce((s: number, i: any) => s + (i.quantity ?? 1), 0)
      activity.push({
        type,
        text: `Order #${(o as any).id.slice(0, 8)} — €${((o.total_cents ?? 0) / 100).toFixed(2)}`,
        detail: `${itemCount} item${itemCount !== 1 ? 's' : ''}`,
        timestamp: o.created_at,
        link: `/admin/orders`,
      })
    }
  }

  const outProducts = allProducts.filter((p: any) => !p.in_stock).slice(0, 3)
  for (const p of outProducts) {
    activity.push({
      type: 'stock_out',
      text: `${p.name} is out of stock`,
      timestamp: new Date().toISOString(),
      link: '/admin/inventory',
    })
  }

  const lowProducts = allProducts.filter((p: any) => p.track_inventory && p.in_stock && p.stock_quantity > 0 && p.stock_quantity < 5).slice(0, 2)
  for (const p of lowProducts) {
    activity.push({
      type: 'stock_low',
      text: `${p.name} running low — ${p.stock_quantity} left`,
      timestamp: new Date().toISOString(),
      link: '/admin/inventory',
    })
  }

  activity.sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  return {
    revenue_today_cents: revenueToday,
    orders_today: todayOrders.length,
    orders_pending: pendingCount,
    revenue_this_month_cents: revenueThisMonth,
    avg_order_value_cents: avgOrderValue,
    products_out_of_stock: outOfStock,
    products_low_stock: lowStock,
    total_products: allProducts.length,
    active_products: activeProds,
    total_categories: allCats.length,
    total_customers: userSet.size,
    new_customers_this_month: newCustomers,
    revenue_chart: revenueChart,
    top_products: topProducts,
    recent_activity: activity.slice(0, 10),
    active_discounts: activeDiscounts,
    expired_discounts: expiredDiscounts,
  }
}
