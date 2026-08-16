"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react"
import type { Product, Category } from "@/types/product"

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",")
}

interface ProductCardProps {
  product: Product
  index: number
}

function ProductCard({ product, index }: ProductCardProps) {
  const [hover, setHover] = useState(false)
  const primary = product.images[0]
  const secondary = product.images[1]
  const hasDiscount =
    product.compare_at_price_cents != null &&
    product.compare_at_price_cents > product.price_cents

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: "easeOut" }}
    >
      <Link href={`/product/${product.slug}`} className="block group">
        <div
          className="relative aspect-[4/5] bg-[#f6f6f6] overflow-hidden"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          {primary ? (
            <>
              <Image
                src={primary.url}
                alt={product.name}
                fill
                className={`object-cover transition-opacity duration-400 ${
                  hover && secondary ? "opacity-0" : "opacity-100"
                }`}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              {secondary && (
                <Image
                  src={secondary.url}
                  alt={product.name}
                  fill
                  className={`object-cover transition-opacity duration-400 ${
                    hover ? "opacity-100" : "opacity-0"
                  }`}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black text-white/50 text-xs">
              Sin imagen
            </div>
          )}

          {hasDiscount && (
            <span className="absolute top-3 left-3 px-2 py-0.5 bg-ember text-black text-[11px] font-semibold tracking-wide">
              -{Math.round((1 - product.price_cents / product.compare_at_price_cents!) * 100)}%
            </span>
          )}
        </div>

        <div className="mt-3">
          {product.materials && (
            <p className="text-[#9e3500] text-[13px] font-medium mb-1">
              {product.materials.length > 30
                ? product.materials.slice(0, 30) + "…"
                : product.materials}
            </p>
          )}
          <h3 className="text-[15px] font-medium text-gray-900 leading-snug">
            {product.name}
          </h3>
          <p className="text-[15px] text-gray-500 leading-snug">
            {product.category_name || "Equipamiento deportivo"}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {hasDiscount ? (
              <>
                <span className="text-[15px] font-medium text-gray-900">
                  {formatPrice(product.price_cents)}€
                </span>
                <span className="text-[15px] text-gray-400 line-through">
                  {formatPrice(product.compare_at_price_cents!)}€
                </span>
              </>
            ) : (
              <span className="text-[15px] font-medium text-gray-900">
                {formatPrice(product.price_cents)}€
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function FilterAccordion({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-t border-gray-200 py-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-base font-semibold text-black"
      >
        {title}
        {open ? <ChevronUp size={16} strokeWidth={2} /> : <ChevronDown size={16} strokeWidth={2} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface Props {
  products: Product[]
  categories: Category[]
  activeCategorySlug: string | null
  total: number
  page: number
  totalPages: number
}

function PaginationControls({ page, totalPages }: { page: number; totalPages: number }) {
  const searchParams = useSearchParams()!
  const router = useRouter()
  if (totalPages <= 1) return null

  function goTo(p: number) {
    if (p < 1 || p > totalPages) return
    const params = new URLSearchParams(searchParams.toString())
    if (p === 1) params.delete("page")
    else params.set("page", String(p))
    const qs = params.toString()
    router.push(qs ? `?${qs}` : window.location.pathname)
    window.scrollTo({ top: 0 })
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2
  )
  const items: (number | "…")[] = []
  let prev = 0
  for (const p of pages) {
    if (p - prev > 1) items.push("…")
    items.push(p)
    prev = p
  }

  return (
    <nav className="flex items-center justify-center gap-2 mt-12">
      <button
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        ← Anterior
      </button>
      {items.map((item, i) =>
        item === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-gray-400">…</span>
        ) : (
          <button
            key={item}
            onClick={() => goTo(item)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              item === page
                ? "bg-black text-white border-black font-medium"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {item}
          </button>
        )
      )}
      <button
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        Siguiente →
      </button>
    </nav>
  )
}

export default function ProductCatalog({ products, categories, activeCategorySlug, total, page, totalPages }: Props) {
  const searchParams = useSearchParams()!
  const router = useRouter()

  const sort = searchParams?.get("orden") || "nuevos"
  const searchQuery = searchParams?.get("search") || ""
  const sinCategoria = searchParams?.get("sin_categoria") === "1"

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [priceMin, setPriceMin] = useState(searchParams?.get("precio_min") || "")
  const [priceMax, setPriceMax] = useState(searchParams?.get("precio_max") || "")
  const [inStockOnly, setInStockOnly] = useState(searchParams?.get("stock") === "1")

  const rootCategories = categories.filter((c) => !c.parent_id)
  const activeCategory = activeCategorySlug
    ? categories.find((c) => c.slug === activeCategorySlug)?.name || "Productos"
    : "Todos los productos"

  function applyPriceFilter() {
    const params = new URLSearchParams(searchParams.toString())
    if (priceMin) params.set("precio_min", priceMin)
    else params.delete("precio_min")
    if (priceMax) params.set("precio_max", priceMax)
    else params.delete("precio_max")
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false })
  }

  const activeParent = activeCategorySlug
    ? categories.find((c) => c.slug === activeCategorySlug)
    : null
  const isSubcategory = activeParent?.parent_id != null
  const activeParentId = isSubcategory ? activeParent!.parent_id! : activeParent?.id
  const activeSubcategories = activeParentId
    ? categories.filter((c) => c.parent_id === activeParentId)
    : []
  const activeGrandchildren = activeCategorySlug
    ? categories.filter((c) => c.parent_id === categories.find((cat) => cat.slug === activeCategorySlug)?.id)
    : []

  const sidebarContent = (
    <div className="space-y-0">
      <div className="mb-10">
        <h3 className="text-base font-semibold text-black mb-4">Categorías</h3>
        <ul className="space-y-3">
          <li>
            <Link
              href="/shop"
              className={`text-base transition-colors ${
                !activeCategorySlug && !sinCategoria ? "text-black font-medium" : "text-gray-500 hover:text-black"
              }`}
            >
              Todos los productos
            </Link>
          </li>
          {activeCategorySlug ? (
            <>
              {/* Show parent if in a subcategory, with back link */}
              {activeParent && isSubcategory && (
                <li>
                  <Link
                    href={`/${categories.find((c) => c.id === activeParent.parent_id)?.slug}`}
                    className="text-base text-gray-500 hover:text-black transition-colors"
                  >
                    ← {categories.find((c) => c.id === activeParent.parent_id)?.name}
                  </Link>
                </li>
              )}
              {/* Active category */}
              <li>
                <span className="text-base text-black font-medium">
                  {activeParent?.name || activeCategory}
                </span>
              </li>
              {/* Subcategories */}
              {activeSubcategories.length > 0 && (
                <ul className="mt-2 ml-3 space-y-2 border-l-2 border-[#E5E0D8] pl-3">
                  {activeSubcategories.map((sub) => (
                    <li key={sub.id}>
                      <Link
                        href={`/${sub.slug}`}
                        className={`text-sm transition-colors ${
                          activeCategorySlug === sub.slug ? "text-black font-medium" : "text-gray-500 hover:text-black"
                        }`}
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {/* Grandchildren when on a subcategory */}
              {activeGrandchildren.length > 0 && (
                <ul className="mt-2 ml-6 space-y-2 border-l-2 border-[#E5E0D8] pl-3">
                  {activeGrandchildren.map((sub) => (
                    <li key={sub.id}>
                      <Link
                        href={`/${sub.slug}`}
                        className={`text-sm transition-colors ${
                          activeCategorySlug === sub.slug ? "text-black font-medium" : "text-gray-500 hover:text-black"
                        }`}
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            rootCategories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/${cat.slug}`}
                  className={`text-base transition-colors ${
                    activeCategorySlug === cat.slug ? "text-black font-medium" : "text-gray-500 hover:text-black"
                  }`}
                >
                  {cat.name}
                </Link>
              </li>
            ))
          )}
          <li>
            <Link
              href="/shop?sin_categoria=1"
              className={`text-base transition-colors ${
                sinCategoria ? "text-black font-medium" : "text-gray-500 hover:text-black"
              }`}
            >
              Sin categoría
            </Link>
          </li>
        </ul>
      </div>

      {/* Filters */}
      <FilterAccordion title="Precio" defaultOpen>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            onBlur={applyPriceFilter}
            onKeyDown={(e) => e.key === "Enter" && applyPriceFilter()}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
          />
          <span className="text-gray-400">—</span>
          <input
            type="number"
            placeholder="Max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            onBlur={applyPriceFilter}
            onKeyDown={(e) => e.key === "Enter" && applyPriceFilter()}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
          />
        </div>
      </FilterAccordion>

      <FilterAccordion title="Disponibilidad">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => {
              setInStockOnly(e.target.checked)
              const params = new URLSearchParams(searchParams.toString())
              if (e.target.checked) params.set("stock", "1")
              else params.delete("stock")
              router.replace(params.toString() ? `?${params.toString()}` : window.location.pathname, {
                scroll: false,
              })
            }}
            className="w-4 h-4 rounded border-gray-300 text-black"
          />
          <span className="text-sm text-gray-700">Solo en stock</span>
        </label>
      </FilterAccordion>
    </div>
  )

  return (
    <div className="px-6 md:px-12 max-w-[1800px] mx-auto py-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-medium text-black">
          {activeCategory}
          {total > 0 && (
            <span className="text-gray-400 font-normal ml-1">({total})</span>
          )}
        </h1>
        <div className="flex items-center gap-6">
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="flex items-center gap-2 text-base text-black hover:text-gray-600 transition-colors lg:hidden"
          >
            <SlidersHorizontal size={18} strokeWidth={1.5} />
            Filtros
          </button>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams.toString())
                if (e.target.value === "nuevos") params.delete("orden")
                else params.set("orden", e.target.value)
                router.replace(params.toString() ? `?${params.toString()}` : window.location.pathname, {
                  scroll: false,
                })
              }}
              className="appearance-none bg-transparent text-base text-black pr-6 cursor-pointer outline-none"
            >
              <option value="nuevos">Más nuevos</option>
              <option value="precio_asc">Precio: menor a mayor</option>
              <option value="precio_desc">Precio: mayor a menor</option>
            </select>
            <ChevronDown size={16} strokeWidth={1.5} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-black" />
          </div>
        </div>
      </div>

      {/* Mobile filters panel */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden mb-8 border-b border-gray-200 pb-6"
          >
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex gap-12">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-[260px] shrink-0">
          <div className="sticky top-[118px] max-h-[calc(100vh-140px)] overflow-y-auto pr-4 scrollbar-thin">
            {sidebarContent}
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-lg font-medium text-gray-900">No se encontraron productos</p>
              <p className="text-sm text-gray-500 mt-1">
                Prueba con otros filtros o términos de búsqueda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10">
              {products.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
          <PaginationControls page={page} totalPages={totalPages} />
        </div>
      </div>
    </div>
  )
}
