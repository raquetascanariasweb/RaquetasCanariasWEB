'use client'

import { useEffect, useState } from 'react'
import {
  DollarSign, ShoppingCart, TrendingUp, Package, Layers, Users,
  Percent, Gift, Mail, Image, FileText, BarChart3, Repeat,
  Megaphone, BookOpen, Heart, Archive,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getAnalyticsData } from '@/lib/admin/analytics'
import type { AnalyticsData } from '@/lib/admin/types'
import { useAdminCurrency } from '../AdminLayoutClient'

const COLORS = {
  gold: '#d4b76a',
  goldDim: '#d4b76a66',
  green: '#55a868',
  blue: '#4c72b0',
  orange: '#dd8452',
  red: '#c44e52',
  purple: '#8172b3',
  teal: '#55a8a8',
}

const CHART_COLORS = ['#d4b76a', '#55a868', '#4c72b0', '#dd8452', '#8172b3', '#c44e52', '#55a8a8', '#937860']

export default function AdminAnalyticsPage() {
  const { formatPrice: fmt, code: currencyCode } = useAdminCurrency()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      setData(await getAnalyticsData())
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount via async load()
  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-3">
          <div className="h-8 w-48 bg-muted rounded-md" />
          <div className="h-4 w-72 bg-muted rounded-md" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-muted rounded-lg animate-pulse" />
          <div className="h-80 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  if (!data) return null

  // â”€â”€ Data transformations â”€â”€

  const revenueChartData = data.revenue_by_day.map((d) => ({
    date: d.date.slice(5),
    revenue: Math.round(d.revenue_cents / 100),
  }))

  const customerChartData = data.customer_acquisition.map((d) => ({
    date: d.date.slice(5),
    customers: d.new_customers,
  }))

  const ordersByHourData = Array.from({ length: 24 }, (_, i) => {
    const found = data.orders_by_hour.find((h) => h.hour === i)
    return { hour: `${i}h`, count: found?.count ?? 0 }
  })

  const topProductsData = data.top_products.slice(0, 5).map((p) => ({
    name: p.name.length > 18 ? p.name.slice(0, 18) + 'â€¦' : p.name,
    revenue: Math.round(p.revenue_cents / 100),
    qty: p.quantity,
  }))

  const statusChartData = data.orders_by_status.map((s) => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    count: s.count,
  }))

  const productsByCatData = data.products_by_category.map((p) => ({
    name: p.category.length > 18 ? p.category.slice(0, 18) + 'â€¦' : p.category,
    count: p.count,
  }))

  const productsByStatusData = data.products_by_status.map((s) => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    count: s.count,
  }))

  // â”€â”€ KPI section helpers â”€â”€

  type KpiGroup = { label: string; value: string; icon: any; color?: string; sub?: string }[]

  const revenueKpis: KpiGroup = [
    { label: 'Ingresos totales', value: fmt(data.total_revenue_cents), icon: DollarSign, color: COLORS.gold },
    { label: 'Pedidos totales', value: data.total_orders.toLocaleString('es-ES'), icon: ShoppingCart, color: COLORS.blue },
    { label: 'Ticket medio', value: fmt(data.avg_order_value_cents), icon: TrendingUp, color: COLORS.green },
    { label: 'Productos vendidos', value: data.products_sold.toLocaleString('es-ES'), icon: Package, color: COLORS.orange },
  ]

  const catalogKpis: KpiGroup = [
    { label: 'Productos activos', value: data.active_products.toLocaleString('es-ES'), icon: Package, sub: `${data.draft_products} borradores, ${data.archived_products} archivados` },
    { label: 'CategorÃ­as', value: data.total_categories.toLocaleString('es-ES'), icon: Layers, color: COLORS.blue },
    { label: 'Productos totales', value: data.total_products.toLocaleString('es-ES'), icon: Archive, color: COLORS.purple },
    { label: 'Productos destacados', value: data.featured_products_count.toLocaleString('es-ES'), icon: Heart, color: COLORS.red },
  ]

  const audienceKpis: KpiGroup = [
    { label: 'Clientes totales', value: data.total_customers.toLocaleString('es-ES'), icon: Users, sub: `${data.repeat_customers} repetidos (Ãºltimos 30 dÃ­as)` },
    { label: 'Suscriptores activos', value: data.active_subscribers.toLocaleString('es-ES'), icon: Mail, sub: `${data.total_subscribers} en total` },
    { label: 'Descuentos activos', value: data.active_discounts.toLocaleString('es-ES'), icon: Percent, sub: `${data.total_discounts} en total` },
    { label: 'Tarjetas regalo activas', value: data.active_gift_cards.toLocaleString('es-ES'), icon: Gift, sub: `${data.total_gift_cards} en total` },
  ]

  const cmsKpis: KpiGroup = [
    { label: 'Banners activos', value: data.active_banners.toLocaleString('es-ES'), icon: Image, sub: `${data.total_banners} en total` },
    { label: 'Bloques activos', value: data.active_content_blocks.toLocaleString('es-ES'), icon: FileText, sub: `${data.total_content_blocks} en total` },
    { label: 'PÃ¡ginas publicadas', value: data.published_landing_pages.toLocaleString('es-ES'), icon: BookOpen, sub: `${data.total_landing_pages} en total` },
    { label: 'CampaÃ±as enviadas', value: data.sent_campaigns.toLocaleString('es-ES'), icon: Megaphone, sub: `${data.total_campaigns} en total` },
  ]

  function renderKpiRow(items: KpiGroup, cols: number = 4) {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3`}>
        {items.map((m) => {
          const Icon = m.icon
          return (
            <Card key={m.label} className="border-border/60">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  {m.label}
                </CardTitle>
                <Icon
                  size={16}
                  style={{ color: m.color || undefined }}
                  className={m.color ? '' : 'text-muted-foreground/60'}
                />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold tracking-tight text-foreground">
                  {m.value}
                </div>
                {m.sub && (
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">{m.sub}</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display tracking-wider text-foreground">AnalÃ­tica</h1>
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
          <BarChart3 size={14} className="text-muted-foreground/50" />
          Real-time store overview â€” todas las mÃ©tricas de tus datos de Supabase
        </p>
      </div>

      {/* Section: Revenue & Orders */}
      <div>
        <h2 className="text-sm font-semibold text-foreground/80 mb-3 uppercase tracking-wider">Ingresos y pedidos</h2>
        {renderKpiRow(revenueKpis)}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Revenue Trend â€” wider */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              EvoluciÃ³n de ingresos
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72 pt-4">
            {revenueChartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.gold} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={COLORS.gold} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${currencyCode} ${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value: any) => [fmt(Number(value) * 100), 'Ingresos']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke={COLORS.gold} strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Orders by Status â€” doughnut */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pedidos por estado
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72 pt-4">
            {statusChartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {statusChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value: any, name: any) => [`${value} pedidos`, name]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span className="text-xs text-muted-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Hour */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pedidos por hora del dÃ­a
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersByHourData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: any) => [`${value} pedidos`, 'Pedidos']}
                />
                <Bar dataKey="count" fill={COLORS.blue} radius={[2, 2, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Productos mÃ¡s vendidos por ingresos
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            {topProductsData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${currencyCode} ${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={110} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value: any) => [fmt(Number(value) * 100), 'Ingresos']}
                  />
                  <Bar dataKey="revenue" fill={COLORS.gold} radius={[0, 4, 4, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section: Catalog */}
      <div>
        <h2 className="text-sm font-semibold text-foreground/80 mb-3 uppercase tracking-wider">CatÃ¡logo</h2>
        {renderKpiRow(catalogKpis)}
      </div>

      {/* Charts Row 3 â€” Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products by Category */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Productos por categorÃ­a
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            {productsByCatData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productsByCatData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={110} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill={COLORS.purple} radius={[0, 4, 4, 0]} maxBarSize={24} name="Productos" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Customer Acquisition */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              AdquisiciÃ³n de clientes
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            {customerChartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={customerChartData}>
                  <defs>
                    <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.green} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={COLORS.green} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value: any) => [`${value} clientes`, 'Nuevos']}
                  />
                  <Area type="monotone" dataKey="customers" stroke={COLORS.green} strokeWidth={2} fill="url(#custGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section: Audience & Marketing */}
      <div>
        <h2 className="text-sm font-semibold text-foreground/80 mb-3 uppercase tracking-wider">Audiencia y marketing</h2>
        {renderKpiRow(audienceKpis)}
      </div>

      {/* Section: CMS */}
      <div>
        <h2 className="text-sm font-semibold text-foreground/80 mb-3 uppercase tracking-wider">Contenido y CMS</h2>
        {renderKpiRow(cmsKpis)}
      </div>

      {/* Bottom: Top Products Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground">Detalle de productos mÃ¡s vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          {data.top_products.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">AÃºn no hay datos de productos. Empieza a vender para ver tus productos mÃ¡s vendidos.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">#</th>
                    <th className="text-left py-3 px-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Producto</th>
                    <th className="text-right py-3 px-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Unidades vendidas</th>
                    <th className="text-right py-3 px-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_products.map((p, i) => (
                    <tr key={i} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2 text-muted-foreground text-xs">{i + 1}</td>
                      <td className="py-3 px-2 font-medium">{p.name}</td>
                      <td className="py-3 px-2 text-right">{p.quantity.toLocaleString('es-ES')}</td>
                      <td className="py-3 px-2 text-right font-medium">{fmt(p.revenue_cents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer note */}
      <div className="text-center text-[10px] text-muted-foreground/40 uppercase tracking-wider pt-4">
        Los datos se actualizan al cargar la pÃ¡gina &mdash; todas las mÃ©tricas de datos en vivo de Supabase
      </div>
    </div>
  )
}
