"use client"

import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

interface ChartDataPoint {
  date: string
  revenue: number
  orders: number
}

interface WeeklyDataPoint {
  week: string
  revenue: number
  orders: number
}

function DailyRevenueChart({ chartData, fmt }: { chartData: ChartDataPoint[]; fmt: (v: number) => string }) {
  if (chartData.every((d) => d.revenue === 0 && d.orders === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground gap-2">
        <BarChart3 size={28} className="text-muted-foreground/30" />
        No sales data yet. Your revenue will appear here.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
        <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => fmt(v * 100)} tickLine={false} axisLine={false} width={65} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value: any, name: any) => [name === "revenue" ? fmt(value * 100) : value, name === "revenue" ? "Revenue" : "Orders"]}
        />
        <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revGrad)" />
        <Bar yAxisId="right" dataKey="orders" fill="hsl(var(--muted-foreground))" fillOpacity={0.35} radius={[2, 2, 0, 0]} maxBarSize={18} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function WeeklyBarChart({ data, fmt }: { data: WeeklyDataPoint[]; fmt: (v: number) => string }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-xs text-muted-foreground gap-1">
        No weekly data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
        <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => fmt(v * 100)} tickLine={false} axisLine={false} width={65} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value: any, name: any) => [name === "revenue" ? fmt(value * 100) : value, name === "revenue" ? "Revenue" : "Orders"]}
        />
        <Bar yAxisId="left" dataKey="revenue" fill="hsl(var(--primary))" fillOpacity={0.7} radius={[3, 3, 0, 0]} maxBarSize={32} />
        <Bar yAxisId="right" dataKey="orders" fill="hsl(var(--muted-foreground))" fillOpacity={0.4} radius={[3, 3, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface DashboardChartsProps {
  chartData: ChartDataPoint[]
  weeklyChartData: WeeklyDataPoint[]
  fmt: (v: number) => string
}

export default function DashboardCharts({ chartData, weeklyChartData, fmt }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
      <Card className="lg:col-span-4 border-border/60">
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Revenue &amp; Orders — por Día
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="h-72">
            <DailyRevenueChart chartData={chartData} fmt={fmt} />
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-3 space-y-4">
        <Card className="border-border/60">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Revenue &amp; Orders — por Semana
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="h-36">
              <WeeklyBarChart data={weeklyChartData} fmt={fmt} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
