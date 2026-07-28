'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Package,
  Layers,
  Archive,
  Warehouse,
  ShoppingCart,
  FileEdit,
  Percent,
  Gift,
  Users,
  Mail,
  Heart,
  Image,
  Sparkles,
  BarChart3,
  FileText,
  Settings,
  Shield,
  ChevronDown,
  ChevronLeft,
  Megaphone,
  FolderOpen,
  ExternalLink,
} from 'lucide-react'

type NavLeaf = {
  href: string
  label: string
  icon: LucideIcon
}

type NavSection = {
  label: string
  children: NavLeaf[]
}

type NavItem =
  | NavLeaf
  | NavSection

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  {
    label: 'Catalog',
    children: [
      { href: '/admin/products', label: 'Products', icon: Package },
      { href: '/admin/categories', label: 'Categories', icon: Layers },
      { href: '/admin/collections', label: 'Collections', icon: Archive },
      { href: '/admin/inventory', label: 'Inventory', icon: Warehouse },
    ],
  },
  {
    label: 'Sales',
    children: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/admin/draft-orders', label: 'Draft Orders', icon: FileEdit },
      { href: '/admin/discounts', label: 'Discounts', icon: Percent },
      { href: '/admin/gift-cards', label: 'Gift Cards', icon: Gift },
    ],
  },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  {
    label: 'Marketing',
    children: [
      { href: '/admin/campaigns', label: 'Campaigns', icon: Megaphone },
      { href: '/admin/newsletter', label: 'Newsletter', icon: Mail },
      { href: '/admin/featured-products', label: 'Featured Products', icon: Heart },
      { href: '/admin/banners', label: 'Banners', icon: Image },
      { href: '/admin/promotions', label: 'Promotions', icon: Sparkles },
    ],
  },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/content', label: 'Content', icon: FileText },
  { href: '/admin/media', label: 'Media', icon: FolderOpen },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/system', label: 'System', icon: Shield },
]

function isSection(item: NavItem): item is NavSection {
  return 'children' in item
}

export default function AdminSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin_sidebar_sections')
      return saved ? new Set(JSON.parse(saved)) : new Set(['Catalog', 'Sales', 'Marketing'])
    }
    return new Set(['Catalog', 'Sales', 'Marketing'])
  })

  function toggleSection(label: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      localStorage.setItem('admin_sidebar_sections', JSON.stringify(Array.from(next)))
      return next
    })
  }

  function isActive(href: string) {
    return pathname === href || (href !== '/admin' && pathname.startsWith(href))
  }

  function renderLeaf(leaf: NavLeaf, depth = 0) {
    const active = isActive(leaf.href)
    const Icon = leaf.icon
    return (
      <Link
        key={leaf.href}
        href={leaf.href}
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all ${
          active
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
        }`}
      >
        <Icon size={depth > 0 ? 16 : 18} strokeWidth={active ? 2 : 1.5} />
        <span>{leaf.label}</span>
      </Link>
    )
  }

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-60'
      } border-r border-border bg-card transition-all duration-300 flex flex-col flex-shrink-0`}
    >
      <div className="h-14 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <Link
            href="/admin"
            className="font-serif text-lg text-foreground tracking-widest uppercase"
          >
            FAV
          </Link>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
        >
          <ChevronLeft size={16} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          if (!isSection(item)) {
            return renderLeaf(item)
          }

          const hasActiveChild = item.children.some((child) => isActive(child.href))
          const isExpanded = expandedSections.has(item.label)

          return (
            <div key={item.label}>
              <button
                onClick={() => toggleSection(item.label)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-widest transition-colors ${
                  hasActiveChild
                    ? 'text-foreground/80'
                    : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent/5'
                }`}
              >
                {!collapsed && (
                  <>
                    <span>{item.label}</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${
                        isExpanded ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                  </>
                )}
              </button>
              {!collapsed && isExpanded && (
                <div className="ml-2 space-y-0.5 mt-0.5 mb-1">
                  {item.children.map((child) => renderLeaf(child, 1))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="border-t border-border">
        {collapsed ? (
          <div className="flex justify-center py-3">
            <Link
              href="/"
              className="p-1.5 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-accent/10 transition-colors"
              aria-label="Back to store"
            >
              <ExternalLink size={16} strokeWidth={1.5} />
            </Link>
          </div>
        ) : (
          <div className="px-4 py-3 space-y-2">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs text-muted-foreground/40 hover:text-foreground transition-colors"
            >
              <ExternalLink size={14} strokeWidth={1.5} />
              <span>Visit Store</span>
            </Link>
            <p className="text-[10px] text-muted-foreground/30 tracking-wider uppercase">
              favsupply backoffice v0.1
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
