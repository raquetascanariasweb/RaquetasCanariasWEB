'use client'

import { useState, createContext, useContext } from 'react'
import { Toaster } from 'sonner'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { formatPrice as fmtPrice, formatPriceRaw as fmtPriceRaw } from '@/lib/utils'

export interface CurrencyConfig {
  code: string
  locale: string
}

const CurrencyContext = createContext<CurrencyConfig>({ code: 'EUR', locale: 'es-ES' })

export function useAdminCurrency() {
  const cfg = useContext(CurrencyContext)
  return {
    ...cfg,
    formatPrice: (cents: number) => fmtPrice(cents, cfg.code, cfg.locale),
    formatPriceRaw: (price: number) => fmtPriceRaw(price, cfg.code, cfg.locale),
  }
}

interface Props {
  children: React.ReactNode
  currencyConfig: CurrencyConfig
}

export default function AdminLayoutClient({ children, currencyConfig }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <CurrencyContext.Provider value={currencyConfig}>
      <div data-theme="dark" className="min-h-screen bg-background flex text-foreground">
        <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">{children}</div>
        </main>
        <Toaster />
      </div>
    </CurrencyContext.Provider>
  )
}
