'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Image,
  Library,
  Mail,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Users,
  Warehouse,
  Percent,
  Gift,
  Megaphone,
  LineChart,
  Shield,
  ExternalLink,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

interface NavSection {
  label: string
  href: string
  icon: React.ElementType
}

interface NavGroupDef {
  label: string
  icon: React.ElementType
  items: NavSection[]
}

type NavEntry =
  | { kind: 'link'; label: string; href: string; icon: React.ElementType }
  | { kind: 'group'; group: NavGroupDef }

const marketingGroup: NavGroupDef = {
  label: 'Marketing',
  icon: Megaphone,
  items: [
    { label: 'Descuentos', href: '/admin/discounts', icon: Percent },
    { label: 'Tarjetas regalo', href: '/admin/gift-cards', icon: Gift },
    { label: 'Campañas', href: '/admin/campaigns', icon: Megaphone },
    { label: 'Newsletter', href: '/admin/newsletter', icon: Mail },
  ],
}

const entries: NavEntry[] = [
  { kind: 'link', label: 'Dashboard', href: '/admin', icon: BarChart3 },
  { kind: 'link', label: 'Productos', href: '/admin/products', icon: Package },
  { kind: 'link', label: 'Categorías', href: '/admin/categories', icon: FolderOpen },
  { kind: 'link', label: 'Inventario', href: '/admin/inventory', icon: Warehouse },
  { kind: 'link', label: 'Pedidos', href: '/admin/orders', icon: ShoppingCart },
  { kind: 'group', group: marketingGroup },
  { kind: 'link', label: 'Clientes', href: '/admin/customers', icon: Users },
  { kind: 'link', label: 'Banners', href: '/admin/banners', icon: Image },
  { kind: 'link', label: 'Medios', href: '/admin/media', icon: Library },
  { kind: 'link', label: 'Analítica', href: '/admin/analytics', icon: LineChart },
  { kind: 'link', label: 'Ajustes', href: '/admin/settings', icon: Settings },
  { kind: 'link', label: 'Sistema', href: '/admin/system', icon: Shield },
]

interface AdminSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

function NavGroup({
  group,
  open,
  onToggle,
  collapsed,
  onNavigate,
  pathname,
}: {
  group: NavGroupDef
  open: boolean
  onToggle: () => void
  collapsed: boolean
  onNavigate: () => void
  pathname: string
}) {
  const isActive = group.items.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-center rounded-lg px-3 py-2.5 text-admin-muted transition-colors hover:bg-white/5 hover:text-white"
        title={group.label}
      >
        <group.icon className="size-5 shrink-0" />
      </button>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'text-primary'
            : 'text-admin-muted hover:bg-white/5 hover:text-white'
        )}
      >
        <group.icon className="size-5 shrink-0" />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown
          className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="mt-1 space-y-1 border-l border-admin-border pl-3 ml-5">
          {group.items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-admin-muted hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [marketingOpen, setMarketingOpen] = React.useState(false)

  const marketingActive = marketingGroup.items.some((item) =>
    pathname.startsWith(item.href)
  )

  function handleGroupToggle() {
    if (collapsed) {
      onToggle()
      setMarketingOpen(true)
    } else {
      setMarketingOpen((o) => !o)
    }
  }

  const navContent = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {entries.map((entry) => {
        if (entry.kind === 'group') {
          return (
            <NavGroup
              key={entry.group.label}
              group={entry.group}
              open={marketingActive || marketingOpen}
              onToggle={handleGroupToggle}
              collapsed={collapsed}
              onNavigate={() => setMobileOpen(false)}
              pathname={pathname}
            />
          )
        }
        const active =
          pathname === entry.href ||
          (entry.href !== '/admin' && pathname.startsWith(`${entry.href}/`))
        return (
          <Link
            key={entry.href}
            href={entry.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-admin-muted hover:bg-white/5 hover:text-white',
              collapsed && 'justify-center'
            )}
            title={collapsed ? entry.label : undefined}
          >
            <entry.icon className="size-5 shrink-0" />
            {!collapsed && <span>{entry.label}</span>}
          </Link>
        )
      })}
    </nav>
  )

  const brand = (
    <Link href="/admin" className="flex items-center">
      <Activity className="mr-2 size-6 shrink-0 text-primary" />
      <span className="font-display text-lg font-bold tracking-tight text-white">
        Raquetas Canarias
      </span>
    </Link>
  )

  return (
    <>
      {/* Mobile trigger */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger
          className="fixed left-4 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-admin-border bg-admin-surface text-admin-text lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 border-admin-border bg-admin-surface p-0!">
          <div className="flex h-16 items-center border-b border-admin-border px-6">
            {brand}
          </div>
          {navContent}
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-admin-border bg-admin-surface transition-all duration-300 lg:flex',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-admin-border px-6">
          <Link href="/admin" className="flex items-center">
            <Activity className="size-6 shrink-0 text-primary" />
            {!collapsed && (
              <span className="ml-2 font-display text-lg font-bold tracking-tight text-white">
                Raquetas Canarias
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={onToggle}
            className="rounded-md p-1 text-admin-muted transition-colors hover:bg-white/5 hover:text-white"
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </button>
        </div>
        {navContent}
        <div className="border-t border-admin-border">
          {collapsed ? (
            <div className="flex justify-center py-3">
              <Link
                href="/"
                className="rounded-md p-1.5 text-admin-muted transition-colors hover:bg-white/5 hover:text-white"
                title="Ir a la tienda"
              >
                <ExternalLink size={15} strokeWidth={1.5} />
              </Link>
            </div>
          ) : (
            <div className="space-y-1.5 px-4 py-3">
              <Link
                href="/"
                className="flex items-center gap-2 text-[11px] text-admin-muted transition-colors hover:text-white"
              >
                <ExternalLink size={13} strokeWidth={1.5} />
                <span>Ir a la tienda</span>
              </Link>
              <p className="text-[9px] uppercase tracking-wider text-admin-muted/50">
                Raquetas Canarias Admin
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
