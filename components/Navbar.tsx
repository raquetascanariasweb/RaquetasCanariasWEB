"use client"

import { useState, useRef, useEffect, useSyncExternalStore } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useCartStore } from "@/store/cart"
import { useFavoritesStore } from "@/store/favorites-store"
import type { Category } from "@/types/product"
import { useUser, useClerk } from "@clerk/nextjs"

const SPORT_ORDER = ["padel", "tenis", "squash", "running", "natacion", "fitness"]

function getIcon(name: string) {
  const lower = name.toLowerCase()
  if (/raqueta|palas|pala\b/.test(lower)) return "racket"
  if (/zapatilla|calzado/.test(lower)) return "shoe"
  if (/pelota|bola/.test(lower)) return "ball"
  if (/textil|ropa|camiseta|sudadera|pantal.n|bañador|falda/.test(lower)) return "shirt"
  if (/accesorio|mochila|bolso|gorra|muñequera|estuche|plumier|toalla|frontal|lilo|merendero|navaja|botella|crema|plantilla/i.test(lower)) return "gear"
  if (/gafa/.test(lower)) return "glasses"
  if (/cordaje/.test(lower)) return "string"
  if (/mancuerna|pesa|tensor/.test(lower)) return "dumbbell"
  if (/maquina|banco/.test(lower)) return "machine"
  if (/puls.metro|reloj/.test(lower)) return "watch"
  if (/material|entrenamiento|esterilla|comba|pull|aleta|tabla|patin|bast.n/i.test(lower)) return "training"
  return "tag"
}

const icons: Record<string, React.ReactNode> = {
  racket:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><ellipse cx="12" cy="6" rx="8" ry="5"/><path d="M12 11v10"/><line x1="8" y1="21" x2="16" y2="21"/></svg>,
  shoe:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 15h4l3 3h8a3 3 0 0 0 3-3v-3a2 2 0 0 0-2-2H9L6 6H3l5 9Z"/></svg>,
  ball:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20" strokeWidth="0.8"/></svg>,
  shirt:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>,
  gear:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
  glasses:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="6" cy="12" r="4"/><circle cx="18" cy="12" r="4"/><path d="M10 12h4"/></svg>,
  string:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 20c3-6 6-12 10-16"/><path d="M20 4 8 20"/></svg>,
  dumbbell: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6.5 6.5h11M17.5 17.5h-11"/><path d="M3 8V6a2 2 0 0 1 2-2h2M3 16v2a2 2 0 0 0 2 2h2M21 8V6a2 2 0 0 0-2-2h-2M21 16v2a2 2 0 0 1-2 2h-2"/></svg>,
  machine:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="9" y1="2" x2="9" y2="4"/><line x1="15" y1="2" x2="15" y2="4"/></svg>,
  watch:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="7"/><polyline points="12 9 12 12 13.5 13.5"/></svg>,
  training: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6"/><path d="M14 14.5 11 11l6-6"/></svg>,
  tag:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/></svg>,
}
function MegaMenuPanel({ columns, parentSlug, parentName, onClose, onEnter, onLeave }: {
  columns: Category[]
  parentSlug: string
  parentName: string
  onClose: () => void
  onEnter: () => void
  onLeave: () => void
}) {
  if (columns.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.12 }}
      className="absolute left-1/2 -translate-x-1/2 top-full pt-1"
      style={{ width: "max-content", maxWidth: "95vw" }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="bg-black/85 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] overflow-hidden">
        <div className="px-8 py-7">
          <div className="flex gap-10">
            {columns.map((col) => {
              const subItems = col.children ?? []
              return (
                <div key={col.id} className="min-w-[160px]">
                  <Link
                    href={`/${col.slug}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-2 text-[13px] font-bold text-white hover:text-ember transition-colors mb-3"
                  >
                    <span className="flex items-center justify-center w-5 h-5 rounded bg-ember/10 text-ember text-[11px] font-bold">
                      {col.name.charAt(0).toUpperCase()}
                    </span>
                    {col.name}
                  </Link>
                  {subItems.length > 0 && (
                    <div className="space-y-1">
                      {subItems.slice(0, 8).map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/${sub.slug}`}
                          onClick={onClose}
                          className="flex items-center gap-2 px-2 py-1.5 -mx-2 rounded-md text-[12.5px] text-gray-400 hover:text-white hover:bg-white/[0.04] transition-colors group"
                        >
                          <span className="w-5 h-5 flex items-center justify-center shrink-0 text-gray-500 group-hover:text-gray-300 transition-colors">
                            {icons[getIcon(sub.name)] || icons.tag}
                          </span>
                          {sub.name}
                        </Link>
                      ))}
                      {subItems.length > 8 && (
                        <Link href={`/${col.slug}`} onClick={onClose} className="block px-2 py-1 text-[11px] text-gray-500 hover:text-gray-300 transition-colors">
                          +{subItems.length - 8} más
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-white/[0.06] flex justify-end">
            <Link
              href={`/${parentSlug}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ember hover:text-[#d4f533] transition-colors group"
            >
              Ver todo {parentName}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="group-hover:translate-x-0.5 transition-transform">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function SportsMegaMenu({ categories, onClose, onEnter, onLeave }: { categories: Category[]; onClose: () => void; onEnter: () => void; onLeave: () => void }) {
  const deportes = categories.find((c) => !c.parent_id && c.slug === "deportes")
  const sports = deportes?.children ?? []
  if (sports.length === 0) return null

  const ordered = SPORT_ORDER.map((s) => sports.find((c) => c.slug === s)).filter(Boolean) as Category[]
  const others = sports.filter((c) => !SPORT_ORDER.includes(c.slug))
  const allSports = [...ordered, ...others]

  return (
    <MegaMenuPanel
      columns={allSports}
      parentSlug="shop"
      parentName="Deportes"
      onClose={onClose}
      onEnter={onEnter}
      onLeave={onLeave}
    />
  )
}

function CategoryMegaMenu({ category, onClose, onEnter, onLeave }: { category: Category; onClose: () => void; onEnter: () => void; onLeave: () => void }) {
  return (
    <MegaMenuPanel
      columns={category.children ?? []}
      parentSlug={category.slug}
      parentName={category.name}
      onClose={onClose}
      onEnter={onEnter}
      onLeave={onLeave}
    />
  )
}

function useDropdown() {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  return {
    open,
    enter: () => { clearTimeout(timeoutRef.current!); setOpen(true) },
    leave: () => { timeoutRef.current = setTimeout(() => setOpen(false), 250) },
    close: () => { clearTimeout(timeoutRef.current!); setOpen(false) },
  }
}

function MobileCategoryItem({ category, onClose }: { category: Category; onClose: () => void }) {
  const children = category.children ?? []
  return (
    <details className="border-t border-white/10">
      <summary className="flex items-center justify-between py-4 text-base font-semibold text-white cursor-pointer list-none">
        {category.name} {children.length > 0 && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-500"><path d="m6 9 6 6 6-6"/></svg>}
      </summary>
      <div className="pb-2 pl-4 space-y-3">
        <Link href={`/${category.slug}`} onClick={onClose} className="block text-sm text-gray-400">Ver todo {category.name}</Link>
        {children.map((c) => <MobileCategoryItem key={c.id} category={c} onClose={onClose} />)}
      </div>
    </details>
  )
}

function UserMenu() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [open])

  if (!user) return null

  return (
    <div ref={ref} className="relative hidden lg:block">
      <button
        onClick={() => setOpen(!open)}
        className="w-[22px] h-[22px] rounded-full bg-gray-700 overflow-hidden hover:ring-2 hover:ring-ember/50 transition-all"
      >
        {user.imageUrl ? (
          <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="flex items-center justify-center w-full h-full text-[10px] font-semibold text-white">
            {user.firstName?.charAt(0) || "U"}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-48 rounded-xl bg-zinc-900 border border-white/10 shadow-xl shadow-black/40 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-sm font-medium text-white truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user.emailAddresses?.[0]?.emailAddress}
            </p>
          </div>
          <Link
            href="/orders"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            Mis pedidos
          </Link>
          <Link
            href="/wishlist"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            Favoritos
          </Link>
          <div className="h-px bg-white/10" />
          <button
            onClick={() => { signOut(); setOpen(false) }}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}

export default function Navbar({ categories }: { categories: Category[] }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const sports = useDropdown()
  const moda = useDropdown()
  const varios = useDropdown()
  const itemCount = useCartStore((s) => s.totalItems())
  const favCount = useFavoritesStore((s) => s.items.length)
  const { isSignedIn, user } = useUser()
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
  const isAdmin = isSignedIn && user?.id === (process.env.NEXT_PUBLIC_ADMIN_USER_ID || "user_3G8ZXADowWQkNZdX65U1djf8JYZ")

  const allParents = categories.filter((c) => !c.parent_id)
  const modaCat = allParents.find((c) => c.slug === "moda")
  const variosCat = allParents.find((c) => c.slug === "varios")
  const linkClass = (active: boolean) => `inline-block px-3 py-5 text-[13px] font-semibold transition-colors ${active ? "text-white" : "text-gray-400 hover:text-white"}`

  return (
    <header className="sticky top-0 z-50 bg-black">
      <nav className="flex items-center justify-between h-[60px] px-5 lg:px-8 max-w-[1800px] mx-auto relative">
        <Link href="/" className="shrink-0 flex items-baseline gap-0.5">
          <span className="text-sm font-bold tracking-[0.2em] text-white uppercase">Sport</span>
          <span className="text-sm font-bold tracking-[0.2em] text-ember uppercase">balin</span>
        </Link>
        <div className="hidden lg:flex items-center gap-0.5">
          <div className="relative" onMouseEnter={() => { moda.close(); varios.close(); sports.enter() }} onMouseLeave={sports.leave}>
            <Link href="/shop" className={linkClass(sports.open)}>Deportes</Link>
          </div>
          {modaCat && (
            <div className="relative" onMouseEnter={() => { sports.close(); varios.close(); moda.enter() }} onMouseLeave={moda.leave}>
              <Link href={`/${modaCat.slug}`} className={linkClass(moda.open)}>Moda</Link>
            </div>
          )}
          {variosCat && (
            <div className="relative" onMouseEnter={() => { sports.close(); moda.close(); varios.enter() }} onMouseLeave={varios.leave}>
              <Link href={`/${variosCat.slug}`} className={linkClass(varios.open)}>Varios</Link>
            </div>
          )}
          <span className="w-px h-5 bg-white/15 self-center" />
          <Link href="/about" onMouseEnter={() => { sports.close(); moda.close(); varios.close() }} className="inline-block px-3 py-5 text-[13px] font-semibold text-gray-400 hover:text-white transition-colors">Sobre nosotros</Link>
          <Link href="/terms" onMouseEnter={() => { sports.close(); moda.close(); varios.close() }} className="inline-block px-3 py-5 text-[13px] font-semibold text-gray-400 hover:text-white transition-colors">Condiciones de venta</Link>
          <AnimatePresence>{sports.open && <SportsMegaMenu categories={categories} onClose={sports.close} onEnter={sports.enter} onLeave={sports.leave} />}</AnimatePresence>
          <AnimatePresence>{moda.open && modaCat && <CategoryMegaMenu category={modaCat} onClose={moda.close} onEnter={moda.enter} onLeave={moda.leave} />}</AnimatePresence>
          <AnimatePresence>{varios.open && variosCat && <CategoryMegaMenu category={variosCat} onClose={varios.close} onEnter={varios.enter} onLeave={varios.leave} />}</AnimatePresence>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 bg-white/10 rounded-full h-9 px-4 w-[180px] hover:bg-white/15 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-500"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" placeholder="Buscar" className="bg-transparent text-[13px] text-white placeholder-gray-500 outline-none w-full" onKeyDown={(e) => { if (e.key === "Enter") { const v = (e.target as HTMLInputElement).value.trim(); if (v) window.location.href = `/shop?search=${encodeURIComponent(v)}` } }} />
          </div>
          <button onClick={() => setMobileSearchOpen(!mobileSearchOpen)} className="lg:hidden text-gray-400" aria-label="Buscar"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></button>
          <button onClick={() => useCartStore.getState().toggleCart()} className="relative text-gray-400 hover:text-white transition-colors" aria-label="Carrito"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/></svg>
            {mounted && itemCount > 0 && <span className="absolute -top-1 -right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-ember text-[10px] font-semibold text-black leading-none">{itemCount > 99 ? "99" : itemCount}</span>}
          </button>
          {isSignedIn ? (
            <UserMenu />
          ) : (
            <Link href="/sign-in" className="hidden lg:inline text-[13px] font-medium text-gray-400 hover:text-white transition-colors">Iniciar sesión</Link>
          )}
          {isAdmin && <Link href="/admin" className="hidden lg:inline text-[11px] font-semibold text-gray-500 hover:text-ember transition-colors">Admin</Link>}
          <button onClick={() => setMenuOpen(true)} className="lg:hidden text-gray-400" aria-label="Abrir menú"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg></button>
        </div>
      </nav>
      {mobileSearchOpen && (
        <div className="lg:hidden px-4 pb-3">
          <div className="flex items-center gap-2 bg-white/10 rounded-full h-10 px-4">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-500 shrink-0"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="Buscar productos..."
              className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = (e.target as HTMLInputElement).value.trim()
                  if (v) {
                    setMobileSearchOpen(false)
                    window.location.href = `/shop?search=${encodeURIComponent(v)}`
                  }
                }
                if (e.key === "Escape") setMobileSearchOpen(false)
              }}
            />
            <button onClick={() => setMobileSearchOpen(false)} className="text-gray-500 hover:text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      )}
      <AnimatePresence>
        {menuOpen && (<>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenuOpen(false)} className="fixed inset-0 bg-black/50 z-30 lg:hidden" />
          <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }} className="fixed inset-0 top-0 z-40 w-80 max-w-[85vw] bg-black overflow-y-auto">
            <div className="flex items-center justify-between h-[60px] px-5 border-b border-white/10">
              <span className="text-base font-bold tracking-[0.2em] text-white uppercase">Sport<span className="text-ember">balin</span></span>
              <button onClick={() => setMenuOpen(false)} className="text-gray-400"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div className="px-5 py-4">
              {allParents.map((p) => <MobileCategoryItem key={p.id} category={p} onClose={() => setMenuOpen(false)} />)}
              <div className="border-t border-white/10 pt-6 mt-2 space-y-4">
                <Link href="/wishlist" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 text-base font-semibold text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  Favoritos {favCount > 0 && <span className="text-ember text-sm">({favCount})</span>}
                </Link>
                {isSignedIn && (
                  <Link href="/orders" onClick={() => setMenuOpen(false)} className="block text-base font-semibold text-white">
                    Mis pedidos
                  </Link>
                )}
                <Link href="/about" onClick={() => setMenuOpen(false)} className="block text-base font-semibold text-white">Sobre nosotros</Link>
                <Link href="/terms" onClick={() => setMenuOpen(false)} className="block text-base font-semibold text-white">Condiciones de venta</Link>
              </div>
            </div>
          </motion.div>
        </>)}
      </AnimatePresence>
    </header>
  )
}
