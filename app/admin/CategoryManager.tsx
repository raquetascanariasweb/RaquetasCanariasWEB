'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Package } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  product_count: number
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories')
      if (res.ok) setCategories(await res.json())
    } catch {}
  }

  useEffect(() => { fetchCategories() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create category')
      setName('')
      setSuccess(true)
      await fetchCategories()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (cat: Category) => {
    const msg = cat.product_count > 0
      ? `Delete "${cat.name}"? ${cat.product_count} product(s) will lose this category.`
      : `Delete "${cat.name}"?`
    if (!confirm(msg)) return

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to delete category')
      await fetchCategories()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 text-sm font-sans rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-900/30 border border-green-500/50 text-green-300 px-4 py-3 text-sm font-sans rounded">
          Category created!
        </div>
      )}

      <form onSubmit={handleAdd} className="flex gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 bg-luxury-charcoal border border-luxury-charcoal text-luxury-ivory px-4 py-3 font-sans text-sm focus:border-luxury-gold outline-none transition-colors"
          placeholder="New category name"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-gold px-6 flex items-center gap-2 disabled:opacity-50"
        >
          <Plus size={16} strokeWidth={1.5} />
          Add
        </button>
      </form>

      <div className="space-y-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between px-4 py-3 border border-luxury-charcoal/50 hover:border-luxury-charcoal transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="text-luxury-ivory font-sans text-sm">{cat.name}</span>
              <span className="flex items-center gap-1 text-luxury-ivory/30 text-xs font-sans">
                <Package size={12} strokeWidth={1.5} />
                {cat.product_count}
              </span>
            </div>
            <button
              onClick={() => handleDelete(cat)}
              className="p-1 text-luxury-ivory/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-luxury-ivory/30 text-sm font-sans text-center py-8">
            No categories yet
          </p>
        )}
      </div>
    </div>
  )
}
