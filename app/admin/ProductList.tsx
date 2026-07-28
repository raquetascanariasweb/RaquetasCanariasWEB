'use client'

import { useState, useEffect } from 'react'
import { Package, Search, ChevronDown } from 'lucide-react'
import Image from 'next/image'

interface Category {
  id: string
  name: string
  slug: string
}

interface Product {
  id: string
  name: string
  slug: string
  price_cents: number
  images: { url: string; color: string }[]
  category_name?: string
  in_stock: boolean
  created_at: string
}

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {})
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedCategory !== 'all') params.set('category_id', selectedCategory)
    if (search) params.set('search', search)

    setLoading(true)
    fetch(`/api/admin/products?${params}`)
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedCategory, search])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-luxury-ivory/30" strokeWidth={1.5} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-luxury-charcoal border border-luxury-charcoal text-luxury-ivory pl-10 pr-4 py-3 font-sans text-sm focus:border-luxury-gold outline-none transition-colors"
            placeholder="Search products..."
          />
        </div>
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="appearance-none bg-luxury-charcoal border border-luxury-charcoal text-luxury-ivory px-4 py-3 pr-10 font-sans text-sm focus:border-luxury-gold outline-none transition-colors min-w-[180px]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-luxury-ivory/30 pointer-events-none" strokeWidth={1.5} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-luxury-gold" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <Package size={32} className="mx-auto text-luxury-ivory/20 mb-3" strokeWidth={1.5} />
          <p className="text-luxury-ivory/30 text-sm font-sans">No products found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => {
            const firstImage = p.images?.[0]?.url
            return (
              <div
                key={p.id}
                className="flex items-center gap-4 px-4 py-3 border border-luxury-charcoal/50 hover:border-luxury-charcoal transition-colors"
              >
                <div className="w-12 h-16 bg-luxury-charcoal flex-shrink-0 relative overflow-hidden">
                  {firstImage && (
                    <Image src={firstImage} alt={p.name} fill className="object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-luxury-ivory font-sans text-sm truncate">{p.name}</p>
                  <p className="text-luxury-ivory/40 text-xs font-sans">{p.category_name ?? 'No category'}</p>
                </div>
                <span className="text-luxury-ivory font-sans text-sm">{(p.price_cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
