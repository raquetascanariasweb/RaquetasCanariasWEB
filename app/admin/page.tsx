'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  DollarSign, Package, TrendingUp,
  AlertTriangle, CheckCircle, Clock, Ban,
  ArrowRight, Layers, Users, Percent, ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getQuickDashboard } from '@/lib/admin/orders'
import type { QuickDashboardData, ActivityEvent } from '@/lib/admin/types'
import { useAdminCurrency } from './AdminLayoutClient'
import Link from 'next/link'

const DashboardCharts = dynamic(() => import('@/components/admin/DashboardCharts'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
      <div className="lg:col-span-4 h-72 bg-muted rounded-lg animate-pulse" />
      <div className="lg:col-span-3 h-72 bg-muted rounded-lg animate-pulse" />
    </div>
  ),
})

const timeAgo = (ts: string) => {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const activityIcons: Record<ActivityEvent['type'], React.ComponentType<{ size?: number; className?: string }>> = {
  order_paid: CheckCircle,
  order_pending: Clock,
  order_shipped: TrendingUp,
  stock_low: AlertTriangle,
  stock_out: Ban,
  no_action: CheckCircle,
}

const activityColors: Record<ActivityEvent['type'], string> = {
  order_paid: 'text-admin-success',
  order_pending: 'text-admin-warning',
  order_shipped: 'text-admin-info',
  stock_low: 'text-admin-warning',
  stock_out: 'text-admin-danger',
  no_action: 'text-muted-foreground',
}

export default function AdminDashboard() {
  const { formatPrice: fmt } = useAdminCurrency()
  const [data, setData] = useState<QuickDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getQuickDashboard().then(setData).catch(console.error).finally(() => setLoading(false))
  }, [])

  const chartData = useMemo(() => (data?.revenue_chart ?? []).map((d) => ({
    date: d.date.slice(5),
    revenue: Math.round(d.revenue_cents / 100),
    orders: d.orders,
  })), [data])

  const weeklyChartData = useMemo(() => {
    const weekMap = new Map<string, { revenue: number; orders: number }>()
    ;(data?.revenue_chart ?? []).forEach((d) => {
      const dObj = new Date(d.date)
      const weekStart = new Date(dObj)
      weekStart.setDate(dObj.getDate() - dObj.getDay() + 1)
      const weekKey = weekStart.toISOString().slice(0, 10)
      const w = weekMap.get(weekKey) ?? { revenue: 0, orders: 0 }
      w.revenue += Math.round(d.revenue_cents / 100)
      w.orders += d.orders
      weekMap.set(weekKey, w)
    })
    return Array.from(weekMap.entries()).map(([week, vals]) => ({
      week: week.slice(5),
      ...vals,
    }))
  }, [data])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-44 bg-muted rounded-md" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          <div className="lg:col-span-5 h-72 bg-muted rounded-lg" />
          <div className="lg:col-span-2 h-72 bg-muted rounded-lg" />
        </div>
        <div className="h-52 bg-muted rounded-lg" />
      </div>
    )
  }

  if (!data) return null

  const hasAttention = data.orders_pending > 0 || data.products_out_of_stock > 0 || data.products_low_stock > 0 || data.expired_discounts > 0

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif tracking-wider text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-admin-success" />
            Store active &middot; last updated {timeAgo(new Date().toISOString())}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="text-xs text-muted-foreground hover:text-foreground">
          Refresh
        </Button>
      </div>

      {/* ── Pulse Strip ────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Revenue Today
              </span>
              <DollarSign size={15} className="text-admin-success/70" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {fmt(data.revenue_today_cents)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {data.orders_today} order{data.orders_today !== 1 ? 's' : ''} today
            </p>
          </CardContent>
        </Card>

        <Card className={`border-border/60 bg-card/80 backdrop-blur ${data.orders_pending > 0 ? 'ring-1 ring-admin-warning/20' : ''}`}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Pending Orders
              </span>
              <Clock size={15} className={data.orders_pending > 0 ? 'text-admin-warning' : 'text-muted-foreground/50'} />
            </div>
            <div className={`text-2xl font-bold tracking-tight ${data.orders_pending > 0 ? 'text-admin-warning' : 'text-foreground'}`}>
              {data.orders_pending}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {data.orders_pending > 0 ? 'Needs your attention' : 'All caught up'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Revenue This Month
              </span>
              <TrendingUp size={15} className="text-muted-foreground/50" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {fmt(data.revenue_this_month_cents)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              AOV {fmt(data.avg_order_value_cents)}
            </p>
          </CardContent>
        </Card>

        <Card className={`border-border/60 bg-card/80 backdrop-blur ${data.products_out_of_stock + data.products_low_stock > 0 ? 'ring-1 ring-admin-danger/20' : ''}`}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Inventory
              </span>
              <Package size={15} className={data.products_out_of_stock + data.products_low_stock > 0 ? 'text-admin-danger' : 'text-muted-foreground/50'} />
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {data.active_products}<span className="text-base font-normal text-muted-foreground">/{data.total_products}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              active &middot; {data.products_out_of_stock} out, {data.products_low_stock} low
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Needs Attention ────────────────────────── */}
      <Card className={`overflow-hidden border-border/60 transition-all ${hasAttention ? 'shadow-lg shadow-admin-warning/5' : ''}`}>
        <CardContent className={`p-5 ${hasAttention ? '' : 'py-4'}`}>
          {!hasAttention ? (
            <div className="flex items-center gap-3 text-emerald-500/80">
              <CheckCircle size={16} />
              <span className="text-sm font-medium">Everything looks good. No issues need your attention.</span>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={14} className="text-admin-warning" />
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-admin-warning">Needs Attention</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {data.orders_pending > 0 && (
                  <Link href="/admin/orders" className="group flex items-center gap-3 p-3 rounded-md bg-admin-warning/5 border border-admin-warning/15 hover:bg-admin-warning/10 transition-colors">
                    <span className="text-lg font-bold text-admin-warning">{data.orders_pending}</span>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Pending orders</span>
                    <ChevronRight size={12} className="ml-auto text-admin-warning/40 group-hover:text-admin-warning transition-colors" />
                  </Link>
                )}
                {data.products_out_of_stock > 0 && (
                  <Link href="/admin/inventory" className="group flex items-center gap-3 p-3 rounded-md bg-admin-danger/5 border border-admin-danger/15 hover:bg-admin-danger/10 transition-colors">
                    <span className="text-lg font-bold text-admin-danger">{data.products_out_of_stock}</span>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Out of stock</span>
                    <ChevronRight size={12} className="ml-auto text-admin-danger/40 group-hover:text-admin-danger transition-colors" />
                  </Link>
                )}
                {data.products_low_stock > 0 && (
                  <Link href="/admin/inventory" className="group flex items-center gap-3 p-3 rounded-md bg-admin-warning/5 border border-admin-warning/15 hover:bg-admin-warning/10 transition-colors">
                    <span className="text-lg font-bold text-admin-warning">{data.products_low_stock}</span>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Low stock</span>
                    <ChevronRight size={12} className="ml-auto text-admin-warning/40 group-hover:text-admin-warning transition-colors" />
                  </Link>
                )}
                {data.expired_discounts > 0 && (
                  <Link href="/admin/discounts" className="group flex items-center gap-3 p-3 rounded-md bg-admin-danger/5 border border-admin-danger/15 hover:bg-admin-danger/10 transition-colors">
                    <span className="text-lg font-bold text-admin-danger">{data.expired_discounts}</span>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Expired discounts</span>
                    <ChevronRight size={12} className="ml-auto text-admin-danger/40 group-hover:text-admin-danger transition-colors" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <DashboardCharts chartData={chartData} weeklyChartData={weeklyChartData} fmt={fmt} />

      <Card className="border-border/60 lg:col-span-3">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Layers size={12} /> Categories
            </span>
            <span className="font-medium tabular-nums">{data.total_categories}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Users size={12} /> Customers
            </span>
            <span className="font-medium tabular-nums">{data.total_customers}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Users size={12} /> New this month
            </span>
            <span className="font-medium tabular-nums">{data.new_customers_this_month}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Percent size={12} /> Active discounts
            </span>
            <span className="font-medium tabular-nums">{data.active_discounts}</span>
          </div>
          <Link href="/admin/analytics" className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors pt-1 border-t border-border/50">
            Full analytics <ArrowRight size={10} />
          </Link>
        </CardContent>
      </Card>

      {/* ── Recent Activity ─────────────────────────── */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {data.recent_activity.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              No recent activity. Activity will appear as your store grows.
            </p>
          ) : (
            <div className="divide-y divide-border/50">
              {data.recent_activity.slice(0, 8).map((event, i) => {
                const Icon = activityIcons[event.type]
                return (
                  <div key={i} className="flex items-center gap-3 py-2.5">
                    <Icon size={14} className={`flex-shrink-0 ${activityColors[event.type]}`} />
                    <span className="text-xs text-foreground/80 flex-1">{event.text}</span>
                    {event.detail && (
                      <span className="text-[10px] text-muted-foreground hidden sm:inline">{event.detail}</span>
                    )}
                    <span className="text-[10px] text-muted-foreground/60 w-12 text-right flex-shrink-0">
                      {timeAgo(event.timestamp)}
                    </span>
                    {event.link && (
                      <Link href={event.link} className="text-muted-foreground/30 hover:text-foreground transition-colors flex-shrink-0">
                        <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
