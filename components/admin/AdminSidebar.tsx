'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
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

type NavItem = NavLeaf | NavSection

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

const SAVED_SECTIONS_KEY = 'admin_sidebar_sections'

export default function AdminSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const pathname = usePathname()!
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Catalog', 'Sales']))
  const [hydrated, setHydrated] = useState(false)
  const [hoveredSection, setHoveredSection] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_SECTIONS_KEY)
      if (saved) setExpandedSections(new Set(JSON.parse(saved)))
    } catch {}
    setHydrated(true)
  }, [])

  function toggleSection(label: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      localStorage.setItem(SAVED_SECTIONS_KEY, JSON.stringify(Array.from(next)))
      return next
    })
  }

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  function renderLeaf(leaf: NavLeaf, depth = 0) {
    const active = isActive(leaf.href)
    const Icon = leaf.icon
    return (
      <Link
        key={leaf.href}
        href={leaf.href}
        className={`flex items-center gap-2.5 px-2.5 py-2 rounded text-[13px] transition-colors ${
          active
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/5'
        }`}
        style={{ paddingLeft: depth > 0 ? '2.25rem' : '0.5rem' }}
      >
        <Icon size={16} strokeWidth={active ? 2 : 1.5} className="shrink-0" />
        <span className="truncate">{leaf.label}</span>
        {active && (
          <span className="ml-auto w-1 h-1 rounded-full bg-primary shrink-0" />
        )}
      </Link>
    )
  }

  return (
    <aside
      className={`${
        collapsed ? 'w-[56px]' : 'w-56'
      } border-r border-border bg-card transition-all duration-300 flex flex-col flex-shrink-0 relative`}
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-border">
        {!collapsed && (
          <Link
            href="/admin"
            className="font-display text-sm font-bold tracking-tight text-foreground"
          >
            Sport<span className="text-primary">balin</span>
          </Link>
        )}
        <button
          onClick={onToggle}
          className={`p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors ${
            collapsed ? 'mx-auto' : ''
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft size={15} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-px">
        {NAV_ITEMS.map((item) => {
          if (!isSection(item)) {
            return collapsed ? (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center justify-center w-10 h-10 mx-auto rounded transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/5'
                }`}
              >
                <item.icon size={18} strokeWidth={isActive(item.href) ? 2 : 1.5} />
              </Link>
            ) : (
              renderLeaf(item)
            )
          }

          const hasActiveChild = item.children.some((child) => isActive(child.href))
          const isExpanded = expandedSections.has(item.label)

          if (collapsed) {
            return (
              <div
                key={item.label}
                className="relative flex justify-center"
                onMouseEnter={() => setHoveredSection(item.label)}
                onMouseLeave={() => setHoveredSection(null)}
              >
                <button
                  onClick={() => toggleSection(item.label)}
                  className={`flex items-center justify-center w-10 h-10 mx-auto rounded transition-colors ${
                    hasActiveChild
                      ? 'text-foreground/80 bg-accent/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/5'
                  }`}
                  title={item.label}
                >
                  {(() => {
                    const Icon = item.children[0]?.icon ?? Layers
                    return <Icon size={18} strokeWidth={1.5} />
                  })()}
                </button>

                <AnimatePresence>
                  {hoveredSection === item.label && (
                    <motion.div
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute left-full top-0 ml-2 w-44 bg-popover border border-border rounded-md shadow-lg py-1.5 z-50"
                    >
                      <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                        {item.label}
                      </div>
                      <div className="h-px bg-border mx-2 my-0.5" />
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center gap-2.5 px-3 py-1.5 text-[13px] transition-colors ${
                            isActive(child.href)
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent/5'
                          }`}
                        >
                          <child.icon size={14} strokeWidth={isActive(child.href) ? 2 : 1.5} />
                          <span>{child.label}</span>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          }

          return (
            <div key={item.label}>
              <button
                onClick={() => toggleSection(item.label)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                  hasActiveChild
                    ? 'text-foreground/70'
                    : 'text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent/5'
                }`}
              >
                <span>{item.label}</span>
                <ChevronDown
                  size={12}
                  strokeWidth={2}
                  className={`transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pt-0.5 pb-1 space-y-px">
                      {item.children.map((child) => renderLeaf(child, 1))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border">
        {collapsed ? (
          <div className="flex justify-center py-3">
            <Link
              href="/"
              className="p-1.5 rounded text-muted-foreground/30 hover:text-foreground hover:bg-accent/10 transition-colors"
              title="Ir a la tienda"
            >
              <ExternalLink size={15} strokeWidth={1.5} />
            </Link>
          </div>
        ) : (
          <div className="px-4 py-3 space-y-1.5">
            <Link
              href="/"
              className="flex items-center gap-2 text-[11px] text-muted-foreground/40 hover:text-foreground transition-colors"
            >
              <ExternalLink size={13} strokeWidth={1.5} />
              <span>Ir a la tienda</span>
            </Link>
            <p className="text-[9px] text-muted-foreground/20 tracking-wider uppercase">
              Sportbalin Admin
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
