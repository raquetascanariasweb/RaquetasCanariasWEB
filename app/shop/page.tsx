"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { getCategories, getProducts } from "@/services/supabase-store"
import ProductCard from "@/components/ProductCard"
import type { Product, Category } from "@/types/product"

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

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

  const filtered = useMemo(() => {
    let result = products
    if (activeCategory !== null) {
      result = result.filter((p) => p.category_id === activeCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      )
    }
    return result
  }, [products, activeCategory, searchQuery])

  return (
    <main className="flex-1 pt-16 sm:pt-18">
      <div className="container-main py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-1 mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-[#f0f0f5]">Catálogo</h1>
          <p className="text-sm text-[#a0a0b0]">
            {filtered.length} producto{filtered.length !== 1 ? "s" : ""} disponible{filtered.length !== 1 ? "s" : ""}
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:w-56 shrink-0"
          >
            <div className="flex flex-col gap-1 sticky top-24">
              <button
                onClick={() => { setActiveCategory(null); setSearchQuery("") }}
                className={`text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  activeCategory === null && !searchQuery
                    ? "bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20"
                    : "text-[#a0a0b0] hover:text-[#f0f0f5] hover:bg-white/5 border border-transparent"
                }`}
              >
                Todos los productos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                  className={`text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center justify-between ${
                    activeCategory === cat.id
                      ? "bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20"
                      : "text-[#a0a0b0] hover:text-[#f0f0f5] hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </motion.aside>

          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-[#12121a] border border-[#1e1e2e] overflow-hidden animate-pulse"
                  >
                    <div className="aspect-square bg-[#1a1a28]" />
                    <div className="p-4 flex flex-col gap-3">
                      <div className="h-4 bg-[#1a1a28] rounded w-3/4" />
                      <div className="h-5 bg-[#1a1a28] rounded w-1/3" />
                      <div className="h-9 bg-[#1a1a28] rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#12121a] border border-[#1e1e2e] flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#6b6b80]">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <p className="text-[#a0a0b0] font-medium">No encontramos productos</p>
                <p className="text-sm text-[#6b6b80] mt-1">Prueba con otros filtros o términos de búsqueda.</p>
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {filtered.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
