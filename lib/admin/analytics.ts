'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AnalyticsData } from './types'

async function checkAdmin() {
  const { userId } = await auth()
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID || process.env.ADMIN_USER_ID || 'user_3G8ZXADowWQkNZdX65U1djf8JYZ'
  if (!userId || (adminId && userId !== adminId)) throw new Error('Unauthorized')
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  await checkAdmin()
  const supabase = createAdminClient()

  const [
    ordersRes,
    ordersAllStatusesRes,
    productsRes,
    productsByStatusRes,
    productsWithCatRes,
    categoriesRes,
    discountsRes,
    giftsRes,
    subscribersRes,
    bannersRes,
    blocksRes,
    landingRes,
    campaignsRes,
    featuredRes,
  ] = await Promise.all([
    supabase.from('orders').select('*').in('status', ['paid', 'processing', 'shipped', 'delivered']),
    supabase.from('orders').select('status'),
    supabase.from('products').select('id'),
    supabase.from('products').select('status'),
    supabase.from('products').select('id, name, category_id'),
    supabase.from('categories').select('id'),
    supabase.from('discounts').select('id, active'),
    supabase.from('gift_cards').select('id, active'),
    supabase.from('newsletter_subscribers').select('id, status'),
    supabase.from('banners').select('id, active'),
    supabase.from('editorial_blocks').select('id, active'),
    supabase.from('landing_pages').select('id, active'),
    supabase.from('email_campaigns').select('id, status'),
    supabase.from('featured_products').select('product_id'),
  ])

  const paidOrders = ordersRes.data ?? []
  const allOrderStatuses = ordersAllStatusesRes.data ?? []

  const totalRevenueCents = paidOrders.reduce((sum, o) => sum + (o.total_cents ?? 0), 0)
  const totalOrders = paidOrders.length
  const avgOrderValueCents = totalOrders > 0 ? Math.round(totalRevenueCents / totalOrders) : 0

  const statusCounts = new Map<string, number>()
  for (const o of allOrderStatuses) {
    statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1)
  }

  const dayMap = new Map<string, number>()
  const hourMap = new Map<number, number>()
  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>()

  for (const o of paidOrders) {
    const d = new Date(o.created_at).toISOString().slice(0, 10)
    dayMap.set(d, (dayMap.get(d) ?? 0) + (o.total_cents ?? 0))

    const h = new Date(o.created_at).getHours()
    hourMap.set(h, (hourMap.get(h) ?? 0) + 1)

    if (Array.isArray(o.items)) {
      for (const item of o.items as any[]) {
        const existing = productMap.get(item.product_id)
        if (existing) {
          existing.quantity += item.quantity ?? 0
          existing.revenue += (item.price_cents ?? 0) * (item.quantity ?? 0)
        } else {
          productMap.set(item.product_id, {
            name: item.product_name ?? 'Unknown',
            quantity: item.quantity ?? 0,
            revenue: (item.price_cents ?? 0) * (item.quantity ?? 0),
          })
        }
      }
    }
  }

  const revenueByDay = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenueCents]) => ({ date, revenue_cents: revenueCents }))

  const ordersByHour = Array.from(hourMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([hour, count]) => ({ hour, count }))

  const topProducts = Array.from(productMap.entries())
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 10)
    .map(([, v]) => ({ name: v.name, quantity: v.quantity, revenue_cents: v.revenue }))

  const productsSold = paidOrders.reduce((sum, o) => {
    const items = (o.items as any[]) ?? []
    return sum + items.reduce((s, i) => s + (i.quantity ?? 0), 0)
  }, 0)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('user_id, created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .in('status', ['paid', 'processing', 'shipped', 'delivered'])

  const allUserIds = new Set<string>()
  const recentUserIds = new Set(recentOrders?.map((o: any) => o.user_id).filter(Boolean) ?? [])
  for (const o of ordersRes.data ?? []) {
    if (o.user_id) allUserIds.add(o.user_id)
  }

  const repeatCustomers = Array.from(recentUserIds).filter((uid: string) => {
    const count = ordersRes.data?.filter((o: any) => o.user_id === uid).length ?? 0
    return count > 1
  }).length

  const customerDates = new Map<string, Set<string>>()
  for (const o of ordersRes.data ?? []) {
    if (!o.user_id) continue
    const d = (o as any).created_at.slice(0, 10)
    if (!customerDates.has(d)) customerDates.set(d, new Set())
    customerDates.get(d)!.add(o.user_id as string)
  }

  const customerAcquisition = Array.from(customerDates.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, users]) => ({ date, new_customers: users.size }))

  const totalCustomers = allUserIds.size

  const allProducts = productsRes.data ?? []
  const totalProducts = allProducts.length

  const statusCountsProd = new Map<string, number>()
  for (const p of productsByStatusRes.data ?? []) {
    statusCountsProd.set(p.status ?? 'draft', (statusCountsProd.get(p.status ?? 'draft') ?? 0) + 1)
  }

  const activeProducts = statusCountsProd.get('active') ?? 0
  const draftProducts = statusCountsProd.get('draft') ?? 0
  const archivedProducts = statusCountsProd.get('archived') ?? 0

  const categoryNames = new Map<string, string>()
  const { data: allCategories } = await supabase.from('categories').select('id, name')
  for (const c of allCategories ?? []) {
    categoryNames.set(c.id, c.name)
  }

  const catCount = new Map<string, number>()
  for (const p of productsWithCatRes.data ?? []) {
    const cid = p.category_id ?? 'uncategorized'
    catCount.set(cid, (catCount.get(cid) ?? 0) + 1)
  }
  const productsByCategory = Array.from(catCount.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([cid, count]) => ({
      category: categoryNames.get(cid) ?? (cid === 'uncategorized' ? 'Uncategorized' : 'Unknown'),
      count,
    }))

  const totalCategories = categoriesRes.data?.length ?? 0

  const allDiscounts = discountsRes.data ?? []
  const allGiftCards = giftsRes.data ?? []

  const totalDiscounts = allDiscounts.length
  const activeDiscounts = allDiscounts.filter((d: any) => d.active).length

  const totalGiftCards = allGiftCards.length
  const activeGiftCards = allGiftCards.filter((g: any) => g.active).length

  const allSubscribers = subscribersRes.data ?? []
  const totalSubscribers = allSubscribers.length
  const activeSubscribers = allSubscribers.filter((s: any) => s.status === 'active').length

  const totalBanners = bannersRes.data?.length ?? 0
  const activeBanners = (bannersRes.data ?? []).filter((b: any) => b.active).length

  const totalContentBlocks = blocksRes.data?.length ?? 0
  const activeContentBlocks = (blocksRes.data ?? []).filter((b: any) => b.active).length

  const totalLandingPages = landingRes.data?.length ?? 0
  const publishedLandingPages = (landingRes.data ?? []).filter((l: any) => l.active).length

  const allCampaigns = campaignsRes.data ?? []
  const totalCampaigns = allCampaigns.length
  const sentCampaigns = allCampaigns.filter((c: any) => c.status === 'sent').length

  const featuredCount = featuredRes.data?.length ?? 0

  return {
    total_orders: totalOrders,
    total_revenue_cents: totalRevenueCents,
    avg_order_value_cents: avgOrderValueCents,
    products_sold: productsSold,
    orders_by_status: Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count })),
    revenue_by_day: revenueByDay,
    orders_by_hour: ordersByHour,
    total_products: totalProducts,
    products_by_status: [
      { status: 'active', count: activeProducts },
      { status: 'draft', count: draftProducts },
      { status: 'archived', count: archivedProducts },
    ].filter((s) => s.count > 0),
    products_by_category: productsByCategory,
    active_products: activeProducts,
    draft_products: draftProducts,
    archived_products: archivedProducts,
    total_categories: totalCategories,
    customer_acquisition: customerAcquisition,
    repeat_customers: repeatCustomers,
    total_customers: totalCustomers,
    top_products: topProducts,
    total_discounts: totalDiscounts,
    active_discounts: activeDiscounts,
    total_gift_cards: totalGiftCards,
    active_gift_cards: activeGiftCards,
    total_subscribers: totalSubscribers,
    active_subscribers: activeSubscribers,
    total_banners: totalBanners,
    active_banners: activeBanners,
    total_content_blocks: totalContentBlocks,
    active_content_blocks: activeContentBlocks,
    total_landing_pages: totalLandingPages,
    published_landing_pages: publishedLandingPages,
    total_campaigns: totalCampaigns,
    sent_campaigns: sentCampaigns,
    featured_products_count: featuredCount,
  }
}
