'use client'

import { useState, createContext, useContext } from 'react'
import { Toaster } from 'sonner'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from './AdminHeader'
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
      <div data-theme="dark" className="min-h-screen bg-admin-bg text-admin-text">
        <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <AdminHeader />
          <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
        <Toaster />
      </div>
    </CurrencyContext.Provider>
  )
}
