'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Upload, Plus, Palette } from 'lucide-react'
import Image from 'next/image'

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '24', '26', '28', '30', '32', '34', '36', '38', '40', '42', '44', 'One Size']

interface Category {
  id: string
  name: string
  slug: string
}

interface ColorEntry {
  slug: string
  name: string
  hex: string
  files: File[]
  previews: string[]
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function ProductForm() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [materials, setMaterials] = useState('')
  const [priceDollars, setPriceDollars] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [colors, setColors] = useState<ColorEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {})
  }, [])

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    )
  }

  const addColor = () => {
    setColors((prev) => [
      ...prev,
      { slug: '', name: '', hex: '#000000', files: [], previews: [] },
    ])
  }

  const updateColor = (index: number, field: keyof ColorEntry, value: string) => {
    setColors((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      if (field === 'name') {
        next[index].slug = slugify(value)
      }
      return next
    })
  }

  const handleColorFiles = (index: number, list: FileList | null) => {
    if (!list) return
    const newFiles = Array.from(list)
    setColors((prev) => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        files: [...next[index].files, ...newFiles],
        previews: [...next[index].previews, ...newFiles.map((f) => URL.createObjectURL(f))],
      }
      return next
    })
  }

  const removeColorFile = (colorIndex: number, fileIndex: number) => {
    setColors((prev) => {
      const next = [...prev]
      URL.revokeObjectURL(next[colorIndex].previews[fileIndex])
      next[colorIndex].files = next[colorIndex].files.filter((_, i) => i !== fileIndex)
      next[colorIndex].previews = next[colorIndex].previews.filter((_, i) => i !== fileIndex)
      return next
    })
  }

  const removeColor = (index: number) => {
    setColors((prev) => {
      prev[index].previews.forEach((p) => URL.revokeObjectURL(p))
      return prev.filter((_, i) => i !== index)
    })
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setMaterials('')
    setPriceDollars('')
    setCategoryId('')
    setSelectedSizes([])
    colors.forEach((c) => c.previews.forEach((p) => URL.revokeObjectURL(p)))
    setColors([])
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const priceCents = Math.round(parseFloat(priceDollars) * 100)
    if (!name || !priceCents) {
      setError('Name and price are required')
      setLoading(false)
      return
    }

    if (colors.length === 0) {
      setError('At least one color is required')
      setLoading(false)
      return
    }

    const colorsPayload = colors.map((c) => ({
      name: c.name,
      hex: c.hex,
      slug: c.slug,
    }))

    const body = new FormData()
    body.append('name', name)
    body.append('description', description)
    body.append('materials', materials)
    body.append('price_cents', priceCents.toString())
    if (categoryId) body.append('category_id', categoryId)
    body.append('sizes', JSON.stringify(selectedSizes))
    body.append('colors', JSON.stringify(colorsPayload))

    colors.forEach((c) => {
      c.files.forEach((f) => {
        body.append('images', f)
        body.append('image_colors', c.slug)
      })
    })

    try {
      const res = await fetch('/api/admin/products', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create product')
      setSuccess(true)
      resetForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 text-sm font-sans rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-900/30 border border-green-500/50 text-green-300 px-4 py-3 text-sm font-sans rounded">
          Product created successfully!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-xs font-sans uppercase tracking-widest text-luxury-ivory/60">Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-luxury-charcoal border border-luxury-charcoal text-luxury-ivory px-4 py-3 font-sans text-sm focus:border-luxury-gold outline-none transition-colors"
            placeholder="Product name"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-sans uppercase tracking-widest text-luxury-ivory/60">Price (USD) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={priceDollars}
            onChange={(e) => setPriceDollars(e.target.value)}
            className="w-full bg-luxury-charcoal border border-luxury-charcoal text-luxury-ivory px-4 py-3 font-sans text-sm focus:border-luxury-gold outline-none transition-colors"
            placeholder="1890.00"
            required
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="block text-xs font-sans uppercase tracking-widest text-luxury-ivory/60">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-luxury-charcoal border border-luxury-charcoal text-luxury-ivory px-4 py-3 font-sans text-sm focus:border-luxury-gold outline-none transition-colors resize-none"
            placeholder="Product description..."
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="block text-xs font-sans uppercase tracking-widest text-luxury-ivory/60">Materials</label>
          <input
            value={materials}
            onChange={(e) => setMaterials(e.target.value)}
            className="w-full bg-luxury-charcoal border border-luxury-charcoal text-luxury-ivory px-4 py-3 font-sans text-sm focus:border-luxury-gold outline-none transition-colors"
            placeholder="100% Virgin Wool, Silk lining"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-sans uppercase tracking-widest text-luxury-ivory/60">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full bg-luxury-charcoal border border-luxury-charcoal text-luxury-ivory px-4 py-3 font-sans text-sm focus:border-luxury-gold outline-none transition-colors"
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-sans uppercase tracking-widest text-luxury-ivory/60">Sizes</label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => toggleSize(size)}
              className={`px-4 py-2 text-xs font-sans uppercase tracking-wider border transition-all duration-300 ${
                selectedSizes.includes(size)
                  ? 'border-luxury-gold bg-luxury-gold text-luxury-black'
                  : 'border-luxury-charcoal text-luxury-ivory/70 hover:border-luxury-ivory/50'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6 border-t border-luxury-charcoal/50 pt-6">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-sans uppercase tracking-widest text-luxury-ivory/60 flex items-center gap-2">
            <Palette size={14} strokeWidth={1.5} />
            Colors & Images
          </label>
          <button
            type="button"
            onClick={addColor}
            className="flex items-center gap-2 text-xs font-sans uppercase tracking-wider text-luxury-gold hover:text-luxury-ivory transition-colors"
          >
            <Plus size={14} strokeWidth={1.5} />
            Add Color
          </button>
        </div>

        {colors.length === 0 && (
          <p className="text-luxury-ivory/30 text-sm font-sans text-center py-8 border-2 border-dashed border-luxury-charcoal">
            Add at least one color with images to continue
          </p>
        )}

        {colors.map((color, colorIndex) => (
          <ColorBlock
            key={colorIndex}
            color={color}
            colorIndex={colorIndex}
            onUpdate={updateColor}
            onFiles={handleColorFiles}
            onRemoveFile={removeColorFile}
            onRemoveColor={removeColor}
          />
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-gold w-full disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          'Creating...'
        ) : (
          <>
            <Plus size={16} strokeWidth={1.5} />
            Create Product
          </>
        )}
      </button>
    </form>
  )
}

function ColorBlock({
  color,
  colorIndex,
  onUpdate,
  onFiles,
  onRemoveFile,
  onRemoveColor,
}: {
  color: ColorEntry
  colorIndex: number
  onUpdate: (i: number, f: keyof ColorEntry, v: string) => void
  onFiles: (i: number, l: FileList | null) => void
  onRemoveFile: (ci: number, fi: number) => void
  onRemoveColor: (i: number) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="border border-luxury-charcoal/50 p-4 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          <div className="space-y-1">
            <label className="text-[10px] font-sans uppercase tracking-wider text-luxury-ivory/40">Color Name</label>
            <input
              value={color.name}
              onChange={(e) => onUpdate(colorIndex, 'name', e.target.value)}
              className="w-full bg-luxury-black border border-luxury-charcoal text-luxury-ivory px-3 py-2 font-sans text-sm focus:border-luxury-gold outline-none transition-colors"
              placeholder="Black"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-sans uppercase tracking-wider text-luxury-ivory/40">Hex</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={color.hex}
                onChange={(e) => onUpdate(colorIndex, 'hex', e.target.value)}
                className="w-10 h-9 bg-luxury-black border border-luxury-charcoal cursor-pointer"
              />
              <input
                value={color.hex}
                onChange={(e) => onUpdate(colorIndex, 'hex', e.target.value)}
                className="flex-1 bg-luxury-black border border-luxury-charcoal text-luxury-ivory px-3 py-2 font-sans text-sm focus:border-luxury-gold outline-none transition-colors"
                placeholder="#000000"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-sans uppercase tracking-wider text-luxury-ivory/40">Slug (auto)</label>
            <input
              value={color.slug}
              onChange={(e) => onUpdate(colorIndex, 'slug', e.target.value)}
              className="w-full bg-luxury-black border border-luxury-charcoal text-luxury-ivory/50 px-3 py-2 font-sans text-sm"
              readOnly
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemoveColor(colorIndex)}
          className="p-1 text-luxury-ivory/30 hover:text-red-400 transition-colors flex-shrink-0 mt-5"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => onFiles(colorIndex, e.target.files)}
          className="hidden"
        />
        <div className="flex flex-wrap gap-3">
          {color.previews.map((src, fi) => (
            <div key={fi} className="relative w-20 h-28 bg-luxury-charcoal group">
              <Image src={src} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => onRemoveFile(colorIndex, fi)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} strokeWidth={1.5} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-20 h-28 border-2 border-dashed border-luxury-charcoal flex flex-col items-center justify-center gap-2 text-luxury-ivory/40 hover:text-luxury-gold hover:border-luxury-gold transition-colors"
          >
            <Upload size={16} strokeWidth={1.5} />
            <span className="text-[10px] font-sans uppercase tracking-wider">Upload</span>
          </button>
        </div>
      </div>
    </div>
  )
}
