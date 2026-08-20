'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, ExternalLink, Home } from 'lucide-react'
import { UserButton, useUser } from '@clerk/nextjs'
import { cn } from '@/lib/utils'

const breadcrumbLabels: Record<string, string> = {
  admin: 'Panel',
  products: 'Productos',
  categories: 'Categorías',
  inventory: 'Inventario',
  orders: 'Pedidos',
  discounts: 'Descuentos',
  'gift-cards': 'Tarjetas regalo',
  customers: 'Clientes',
  campaigns: 'Campañas',
  newsletter: 'Newsletter',
  banners: 'Banners',
  analytics: 'Analítica',
  media: 'Medios',
  settings: 'Ajustes',
  system: 'Sistema',
}

interface AdminHeaderProps {
  className?: string
}

export default function AdminHeader({ className }: AdminHeaderProps) {
  const pathname = usePathname()
  const { user } = useUser()

  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const label = breadcrumbLabels[segment] ?? segment
    const isLast = index === segments.length - 1
    return { href, label, isLast }
  })

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center justify-between border-b border-admin-border bg-admin-bg/95 px-4 backdrop-blur sm:px-8',
        className
      )}
    >
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm">
          <li>
            <Link
              href="/admin"
              className="flex items-center text-admin-muted transition hover:text-admin-text"
            >
              <Home className="mr-1 size-4" />
              <span className="hidden sm:inline">Inicio</span>
            </Link>
          </li>
          {breadcrumbs.map(({ href, label, isLast }) => (
            <li key={href} className="flex items-center gap-1.5">
              <ChevronRight className="size-4 text-admin-muted" />
              {isLast ? (
                <span className="font-medium text-admin-text">{label}</span>
              ) : (
                <Link
                  href={href}
                  className="text-admin-muted transition hover:text-admin-text"
                >
                  {label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          target="_blank"
          className="hidden items-center gap-1.5 rounded-lg border border-admin-border px-3 py-1.5 text-xs font-medium text-admin-muted transition hover:bg-white/5 hover:text-admin-text sm:inline-flex"
        >
          <ExternalLink className="size-3.5" />
          Visitar tienda
        </Link>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-admin-text">
            {user?.fullName ?? 'Administrador'}
          </p>
          <p className="text-xs text-admin-muted">
            {user?.primaryEmailAddress?.emailAddress ?? 'admin@raquetascanarias.com'}
          </p>
        </div>
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'size-9 border border-admin-border',
            },
          }}
        />
      </div>
    </header>
  )
}
