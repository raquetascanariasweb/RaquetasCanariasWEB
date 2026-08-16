'use client'

import { useEffect, useState } from 'react'
import {
  Plus, Edit, Trash2, FolderOpen,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { getCategories, createCategory, updateCategory, deleteCategory, uploadCategoryImage } from '@/lib/admin/categories'
import type { AdminCategory } from '@/lib/admin/types'
import { toast } from 'sonner'

export default function AdminCategoriesPage() {
  const [data, setData] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<AdminCategory | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', parent_id: '', description: '', is_collection: false })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      setData(await getCategories())
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount via async load()
  useEffect(() => { load() }, [])

  function openAdd(parentId = '') {
    setForm({ name: '', parent_id: parentId, description: '', is_collection: false })
    setImageFile(null)
    setImagePreview('')
    setEditing(null)
    setShowAdd(true)
  }

  function openEdit(cat: AdminCategory) {
    setForm({
      name: cat.name,
      parent_id: cat.parent_id ?? '',
      description: cat.description ?? '',
      is_collection: cat.is_collection ?? false,
    })
    setImagePreview(cat.image ?? '')
    setImageFile(null)
    setEditing(cat)
    setShowAdd(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return toast.error('El nombre es obligatorio')
    setSaving(true)
    try {
      let image = imagePreview
      if (imageFile) {
        image = await uploadCategoryImage(imageFile)
      }

      const payload = {
        name: form.name,
        parent_id: form.parent_id || undefined,
        description: form.description,
        image,
        is_collection: form.is_collection,
      }

      const res = editing
        ? await updateCategory(editing.id, payload)
        : await createCategory(payload)

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(editing ? 'Categoría actualizada' : 'Categoría creada')
        setShowAdd(false)
        load()
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Error')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const res = await deleteCategory(id)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Categoría eliminada')
      setDeleteId(null)
      load()
    }
  }

  function renderCategory(cat: AdminCategory, depth = 0) {
    const indent = depth * 24
    return (
      <div key={cat.id}>
        <div
          className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-accent/5 transition-colors"
          style={{ marginLeft: `${indent}px`, paddingLeft: depth > 0 ? '16px' : undefined, borderLeft: depth > 0 ? '2px solid hsl(var(--border))' : undefined }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
              {cat.image ? (
                <img src={cat.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <FolderOpen size={16} className="text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{cat.name}</span>
                {cat.is_collection && (
                  <Badge variant="outline" className="text-[10px]">Colección</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">/{cat.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs">{cat.product_count} productos</Badge>
            <button onClick={() => openAdd(cat.id)} className="text-muted-foreground hover:text-foreground p-1" title="Añadir subcategoría">
              <Plus size={14} />
            </button>
            <button onClick={() => openEdit(cat)} className="text-muted-foreground hover:text-foreground p-1">
              <Edit size={14} />
            </button>
            <button onClick={() => setDeleteId(cat.id)} className="text-muted-foreground hover:text-destructive p-1">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        {cat.children?.map((child) => renderCategory(child, depth + 1))}
      </div>
    )
  }

  function flattenCategories(cats: AdminCategory[], depth = 0): { id: string; name: string; depth: number }[] {
    const result: { id: string; name: string; depth: number }[] = []
    for (const cat of cats) {
      result.push({ id: cat.id, name: cat.name, depth })
      if (cat.children?.length) {
        result.push(...flattenCategories(cat.children, depth + 1))
      }
    }
    return result
  }

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-10 w-48 bg-muted rounded" />
      <div className="h-72 bg-muted rounded-lg" />
    </div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display tracking-wider text-foreground">Categorías</h1>
        <Button onClick={() => openAdd()}><Plus size={16} className="mr-2" /> Nueva categoría</Button>
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-border">
          {data.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              Aún no hay categorías
            </div>
          )}
          {data.map((cat) => renderCategory(cat))}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={(o) => !o && setShowAdd(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Actualiza los detalles de la categoría.' : 'Crea una nueva categoría o subcategoría.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="cat_name">Nombre *</Label>
              <Input
                id="cat_name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Categoría principal (opcional)</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.parent_id}
                onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
              >
                <option value="">Ninguna (nivel superior)</option>
                {flattenCategories(data).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {'— '.repeat(cat.depth)}{cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="cat_description">Descripción</Label>
              <textarea
                id="cat_description"
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div>
              <Label>Imagen de la categoría</Label>
              <div className="mt-1 flex items-center gap-3">
                {imagePreview && (
                  <div className="w-16 h-16 rounded border border-border overflow-hidden">
                    <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <label className="flex-1 h-10 rounded border border-dashed border-input flex items-center justify-center cursor-pointer hover:bg-accent/10 text-xs text-muted-foreground">
                  {imageFile ? imageFile.name : 'Subir imagen'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setImageFile(file)
                        setImagePreview(URL.createObjectURL(file))
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_collection"
                checked={form.is_collection}
                onChange={(e) => setForm({ ...form, is_collection: e.target.checked })}
                className="rounded border-input"
              />
              <Label htmlFor="is_collection" className="mb-0">Marcar como colección</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar categoría</DialogTitle>
            <DialogDescription>
              Los productos de esta categoría quedarán sin categorizar. Las subcategorías se eliminarán.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
