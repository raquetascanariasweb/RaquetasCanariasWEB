"use client"

import { useMemo, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import FiltersSidebar from "@/components/FiltersSidebar"
import ProductCard from "@/components/ProductCard"
import type { Product, Category } from "@/types/product"

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

interface Props {
  products: Product[]
  categories: Category[]
  activeCategorySlug: string | null
}

export default function ProductListClient({ products, categories, activeCategorySlug }: Props) {
  const searchParams = useSearchParams()!
  const router = useRouter()

  const priceMin = searchParams.get("precio_min")
  const priceMax = searchParams.get("precio_max")
  const inStockOnly = searchParams.get("stock") === "1"
  const sinCategoria = searchParams.get("sin_categoria") === "1"
  const sort = searchParams.get("orden") || "nuevos"
  const searchQuery = searchParams.get("search") || ""

  const activeCategoryIds = useMemo(() => {
    if (!activeCategorySlug) return null
    const cat = categories.find((c) => c.slug === activeCategorySlug)
    if (!cat) return null
    const ids = new Set<string>()
    ids.add(cat.id)
    const stack = [cat.id]
    while (stack.length > 0) {
      const currentId = stack.pop()!
      const children = categories.filter((c) => c.parent_id === currentId)
      for (const child of children) {
        ids.add(child.id)
        stack.push(child.id)
      }
    }
    return Array.from(ids)
  }, [activeCategorySlug, categories])

  const filtered = useMemo(() => {
    let result = [...products]

    if (activeCategoryIds) {
      result = result.filter((p) => {
        const ids = p.category_ids ?? (p.category_id ? [p.category_id] : [])
        return ids.some((id) => activeCategoryIds.includes(id))
      })
    }
    if (sinCategoria) {
      result = result.filter((p) => {
        const ids = p.category_ids ?? (p.category_id ? [p.category_id] : [])
        return ids.length === 0
      })
    }
    if (priceMin) {
      const min = Number(priceMin) * 100
      if (!isNaN(min)) result = result.filter((p) => p.price_cents >= min)
    }
    if (priceMax) {
      const max = Number(priceMax) * 100
      if (!isNaN(max)) result = result.filter((p) => p.price_cents <= max)
    }
    if (inStockOnly) result = result.filter((p) => p.in_stock)
    if (searchQuery) {
      const words = searchQuery.toLowerCase().split(/\s+/).filter(Boolean)
      result = result.filter((p) => {
        const haystack = `${p.name} ${p.description || ""}`.toLowerCase()
        return words.every((w) => haystack.includes(w))
      })
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
  }, [products, activeCategoryIds, priceMin, priceMax, inStockOnly, sinCategoria, searchQuery, sort])

  const setFilter = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === "") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    const qs = params.toString()
    const base = activeCategorySlug ? `/${activeCategorySlug}` : "/#productos"
    const target = activeCategorySlug ? `/${activeCategorySlug}?${qs}` : `/?${qs}#productos`
    const scroll = !activeCategorySlug
    router.replace(target, { scroll })
  }, [searchParams, router, activeCategorySlug])

  const clearFilters = useCallback(() => {
    if (activeCategorySlug) {
      router.push(`/${activeCategorySlug}`)
    } else {
      router.push("/#productos")
    }
  }, [router, activeCategorySlug])

  return (
    <div className="container-main py-8 lg:py-12">
      <div className="flex flex-col lg:flex-row gap-8">
        <FiltersSidebar
          categories={categories}
          activeCategorySlug={activeCategorySlug}
          priceMin={priceMin}
          priceMax={priceMax}
          inStockOnly={inStockOnly}
          searchQuery={searchQuery}
          sinCategoria={sinCategoria}
          onFilterChange={setFilter}
          onClearFilters={clearFilters}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#DDD8CC]">
            <p className="text-sm text-[#8A8680]">
              {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
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
          {filtered.length === 0 ? (
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
  )
}
