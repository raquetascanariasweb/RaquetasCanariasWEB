"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface FiltersSidebarProps {
  categories: { id: string; name: string; slug: string }[]
  activeCategorySlug: string | null
  priceMin: string | null
  priceMax: string | null
  inStockOnly: boolean
  searchQuery: string
  onFilterChange: (key: string, value: string | null) => void
  onClearFilters: () => void
}

export default function FiltersSidebar({
  categories,
  activeCategorySlug,
  priceMin,
  priceMax,
  inStockOnly,
  searchQuery,
  onFilterChange,
  onClearFilters,
}: FiltersSidebarProps) {
  const [localPriceMin, setLocalPriceMin] = useState(priceMin || "")
  const [localPriceMax, setLocalPriceMax] = useState(priceMax || "")

  useEffect(() => {
    setLocalPriceMin(priceMin || "")
    setLocalPriceMax(priceMax || "")
  }, [priceMin, priceMax])

  function applyPrice() {
    onFilterChange("precio_min", localPriceMin || null)
    onFilterChange("precio_max", localPriceMax || null)
  }

  const hasActiveFilters = activeCategorySlug || priceMin || priceMax || inStockOnly || searchQuery

  const filterContent = (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-semibold text-[#8A8680] uppercase tracking-wider mb-2">
          Buscar
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onFilterChange("search", e.target.value || null)}
          placeholder="Buscar productos..."
          className="w-full px-3 py-2 text-sm bg-white border border-[#DDD8CC] rounded-lg text-ink placeholder-[#A09C95] focus:outline-none focus:ring-2 focus:ring-ember/30"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#8A8680] uppercase tracking-wider mb-2">
          Categoría
        </label>
        <div className="space-y-0.5">
          <button
            onClick={() => onFilterChange("categoria", null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              !activeCategorySlug
                ? "bg-ember/10 text-ember font-medium"
                : "text-[#8A8680] hover:bg-linen/80 hover:text-ink"
            }`}
          >
            Todos los productos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onFilterChange("categoria", activeCategorySlug === cat.slug ? null : cat.slug)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeCategorySlug === cat.slug
                  ? "bg-ember/10 text-ember font-medium"
                  : "text-[#8A8680] hover:bg-linen/80 hover:text-ink"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#8A8680] uppercase tracking-wider mb-2">
          Precio (€)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localPriceMin}
            onChange={(e) => setLocalPriceMin(e.target.value)}
            onBlur={applyPrice}
            onKeyDown={(e) => { if (e.key === "Enter") applyPrice() }}
            placeholder="Min"
            min={0}
            className="w-full px-3 py-2 text-sm bg-white border border-[#DDD8CC] rounded-lg text-ink placeholder-[#A09C95] focus:outline-none focus:ring-2 focus:ring-ember/30"
          />
          <span className="text-[#A09C95] text-sm">—</span>
          <input
            type="number"
            value={localPriceMax}
            onChange={(e) => setLocalPriceMax(e.target.value)}
            onBlur={applyPrice}
            onKeyDown={(e) => { if (e.key === "Enter") applyPrice() }}
            placeholder="Max"
            min={0}
            className="w-full px-3 py-2 text-sm bg-white border border-[#DDD8CC] rounded-lg text-ink placeholder-[#A09C95] focus:outline-none focus:ring-2 focus:ring-ember/30"
          />
        </div>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer group">
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={(e) => onFilterChange("stock", e.target.checked ? "1" : null)}
          className="w-4 h-4 rounded border-[#DDD8CC] text-ember focus:ring-ember/30"
        />
        <span className="text-sm text-ink group-hover:text-ember transition-colors">Solo en stock</span>
      </label>

      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="w-full text-sm text-ember hover:text-ember/80 font-medium transition-colors pt-2 border-t border-linen/60"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )

  return (
    <>
      <aside className="hidden lg:block lg:w-56 shrink-0">
        <div className="sticky top-24">
          {filterContent}
        </div>
      </aside>

      <MobileFilters>
        {filterContent}
      </MobileFilters>
    </>
  )
}

function MobileFilters({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <div className="lg:hidden mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#DDD8CC] rounded-lg text-sm text-ink font-medium"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="12" y1="18" x2="20" y2="18" />
        </svg>
        {open ? "Cerrar filtros" : "Mostrar filtros"}
      </button>

      {open && (
        <div className="mt-3 p-4 bg-white border border-[#DDD8CC] rounded-xl">
          {children}
        </div>
      )}
    </div>
  )
}
