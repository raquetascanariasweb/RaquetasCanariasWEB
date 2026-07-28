'use client'

import { useEffect, useState } from 'react'
import {
  Plus, Edit, Trash2, FolderOpen, ImageIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { getCollections, createCollection, updateCollection, deleteCollection, uploadCollectionImage } from '@/lib/admin/collections'
import type { AdminCategory } from '@/lib/admin/types'
import { toast } from 'sonner'

export default function AdminCollectionsPage() {
  const [data, setData] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<AdminCategory | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', image: '' })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      setData(await getCollections())
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setForm({ name: '', description: '', image: '' })
    setImageFile(null)
    setImagePreview('')
    setEditing(null)
    setShowAdd(true)
  }

  function openEdit(cat: AdminCategory) {
    setForm({
      name: cat.name,
      description: cat.description ?? '',
      image: cat.image ?? '',
    })
    setImagePreview(cat.image ?? '')
    setImageFile(null)
    setEditing(cat)
    setShowAdd(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return toast.error('Name required')
    setSaving(true)
    try {
      let image = imagePreview
      if (imageFile) {
        image = await uploadCollectionImage(imageFile)
      }

      const payload = { name: form.name, description: form.description, image }

      const res = editing
        ? await updateCollection(editing.id, payload)
        : await createCollection(payload)

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(editing ? 'Collection updated' : 'Collection created')
        setShowAdd(false)
        load()
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Error')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const res = await deleteCollection(id)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Collection deleted')
      setDeleteId(null)
      load()
    }
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
        <div>
          <h1 className="text-2xl font-serif tracking-wider text-foreground">Collections</h1>
          <p className="text-sm text-muted-foreground mt-1">Organize products into curated collections</p>
        </div>
        <Button onClick={() => openAdd()}><Plus size={16} className="mr-2" /> Add Collection</Button>
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-border">
          {data.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              No collections yet — create your first collection
            </div>
          )}
          {data.map((cat) => (
            <div key={cat.id}>
              <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-accent/5 transition-colors">
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
                    </div>
                    <p className="text-xs text-muted-foreground">/{cat.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs">{cat.product_count} products</Badge>
                  <button onClick={() => openEdit(cat)} className="text-muted-foreground hover:text-foreground p-1">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => setDeleteId(cat.id)} className="text-muted-foreground hover:text-destructive p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {cat.children?.map((child) => (
                <div key={child.id} className="flex items-center justify-between py-3 px-4 ml-8 border-l-2 border-border pl-4 hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                      {child.image ? (
                        <img src={child.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FolderOpen size={16} className="text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-sm">{child.name}</span>
                      <p className="text-xs text-muted-foreground">/{child.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">{child.product_count} products</Badge>
                    <button onClick={() => openEdit(child)} className="text-muted-foreground hover:text-foreground p-1">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => setDeleteId(child.id)} className="text-muted-foreground hover:text-destructive p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={(o) => !o && setShowAdd(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Collection' : 'New Collection'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update collection details.' : 'Create a new product collection.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="col_name">Name *</Label>
              <Input
                id="col_name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="col_description">Description</Label>
              <textarea
                id="col_description"
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div>
              <Label>Collection Image</Label>
              <div className="mt-1 flex items-center gap-3">
                {imagePreview && (
                  <div className="w-16 h-16 rounded border border-border overflow-hidden">
                    <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <label className="flex-1 h-10 rounded border border-dashed border-input flex items-center justify-center cursor-pointer hover:bg-accent/10 text-xs text-muted-foreground">
                  {imageFile ? imageFile.name : 'Upload Image'}
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Collection</DialogTitle>
            <DialogDescription>
              Products in this collection will be uncategorized. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
