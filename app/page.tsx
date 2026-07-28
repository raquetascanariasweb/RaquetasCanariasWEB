"use client"

import { useState, useEffect, useMemo, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { getProducts, getCategories } from "@/services/supabase-store"
import HeroBanner from "@/components/HeroBanner"
import FiltersSidebar from "@/components/FiltersSidebar"
import ProductCard from "@/components/ProductCard"
import type { Product, Category } from "@/types/product"

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-white border border-linen/60 overflow-hidden animate-pulse">
          <div className="aspect-square bg-linen/80" />
          <div className="p-4 flex flex-col gap-3">
            <div className="h-4 bg-linen/80 rounded w-3/4" />
            <div className="h-5 bg-linen/80 rounded w-1/3" />
            <div className="h-10 bg-linen/80 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-linen/80 border border-[#DDD8CC] flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#A09C95]">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
      </div>
      <p className="text-[#8A8680] font-medium">No encontramos productos</p>
      <p className="text-sm text-[#A09C95] mt-1">Prueba con otros filtros o términos de búsqueda.</p>
    </div>
  )
}

function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const categorySlug = searchParams.get("categoria")
  const priceMin = searchParams.get("precio_min")
  const priceMax = searchParams.get("precio_max")
  const inStockOnly = searchParams.get("stock") === "1"
  const sort = searchParams.get("orden") || "nuevos"
  const searchQuery = searchParams.get("search") || ""

  useEffect(() => {
    async function load() {
      const [cats, prods] = await Promise.all([
        getCategories(),
        getProducts(),
      ])
      setCategories(cats)
      setProducts(prods)
      setLoading(false)
    }
    load()
  }, [])

  const activeCategoryId = useMemo(() => {
    if (!categorySlug) return null
    const cat = categories.find((c) => c.slug === categorySlug)
    return cat?.id ?? null
  }, [categorySlug, categories])

  const filtered = useMemo(() => {
    let result = [...products]

    if (activeCategoryId) {
      result = result.filter((p) => p.category_id === activeCategoryId)
    }

    if (priceMin) {
      const min = Number(priceMin) * 100
      if (!isNaN(min)) result = result.filter((p) => p.price_cents >= min)
    }

    if (priceMax) {
      const max = Number(priceMax) * 100
      if (!isNaN(max)) result = result.filter((p) => p.price_cents <= max)
    }

    if (inStockOnly) {
      result = result.filter((p) => p.in_stock)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      )
    }

    switch (sort) {
      case "precio_asc":
        result.sort((a, b) => a.price_cents - b.price_cents)
        break
      case "precio_desc":
        result.sort((a, b) => b.price_cents - a.price_cents)
        break
    }

    return result
  }, [products, activeCategoryId, priceMin, priceMax, inStockOnly, searchQuery, sort])

  const setFilter = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === "") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    const qs = params.toString()
    router.replace(qs ? `/?${qs}` : "/", { scroll: false })
  }, [searchParams, router])

  const clearFilters = useCallback(() => {
    router.push("/#productos")
  }, [router])

  return (
    <main>
      <HeroBanner />

      <section id="productos" className="bg-paper">
        <div className="container-main py-8 lg:py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            <FiltersSidebar
              categories={categories}
              activeCategorySlug={categorySlug}
              priceMin={priceMin}
              priceMax={priceMax}
              inStockOnly={inStockOnly}
              searchQuery={searchQuery}
              onFilterChange={setFilter}
              onClearFilters={clearFilters}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#DDD8CC]">
                <p className="text-sm text-[#8A8680]">
                  {loading ? "Cargando..." : (
                    <>{filtered.length} producto{filtered.length !== 1 ? "s" : ""}</>
                  )}
                </p>

                <select
                  value={sort}
                  onChange={(e) => setFilter("orden", e.target.value)}
                  className="text-sm bg-white border border-[#DDD8CC] rounded-lg px-3 py-1.5 text-ink focus:outline-none focus:ring-2 focus:ring-ember/30"
                >
                  <option value="nuevos">Más nuevos</option>
                  <option value="precio_asc">Precio: menor a mayor</option>
                  <option value="precio_desc">Precio: mayor a menor</option>
                </select>
              </div>

              {loading ? (
                <LoadingSkeleton />
              ) : filtered.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filtered.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#DDD8CC] py-10 text-center text-sm text-[#A09C95]">
        <div className="container-main">
          <p>&copy; {new Date().getFullYear()} Sportbalin. Todos los derechos reservados.</p>
        </div>
      </footer>
    </main>
  )
}

export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  )
}
