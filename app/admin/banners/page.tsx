'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Image, Plus, Trash2, Edit, Eye, EyeOff,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  getBanners, createBanner, updateBanner, deleteBanner, reorderBanners, toggleBannerActive,
} from '@/lib/admin/banners'
import type { Banner } from '@/lib/admin/types'
import { toast } from 'sonner'
import MediaPicker from '@/components/admin/MediaPicker'

export default function BannersPage() {
  const [data, setData] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [editItem, setEditItem] = useState<Banner | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formSubtitle, setFormSubtitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formLinkUrl, setFormLinkUrl] = useState('')
  const [formLinkLabel, setFormLinkLabel] = useState('')
  const [formImage, setFormImage] = useState<File | null>(null)
  const [formImagePreview, setFormImagePreview] = useState('')
  const [formImageError, setFormImageError] = useState('')
  const [formTextX, setFormTextX] = useState(50)
  const [formTextY, setFormTextY] = useState(50)
  const [formVideoUrl, setFormVideoUrl] = useState('')
  const [formVideoStart, setFormVideoStart] = useState('')
  const [formVideoEnd, setFormVideoEnd] = useState('')
  const [formActive, setFormActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mediaPicker, setMediaPicker] = useState(false)
  const [mediaPickerMode, setMediaPickerMode] = useState<'image' | 'video'>('image')

  async function load() {
    try {
      const banners = await getBanners()
      setData(banners)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount via async load()
  useEffect(() => { load() }, [])

  function openEdit(b: Banner) {
    setEditItem(b)
    setFormTitle(b.title)
    setFormSubtitle(b.subtitle ?? '')
    setFormDescription(b.description ?? '')
    setFormLinkUrl(b.link_url ?? '')
    setFormLinkLabel(b.link_label ?? '')
    setFormImagePreview(b.image_url)
    setFormImage(null)
    setFormImageError('')
    setFormTextX(b.text_x ?? 50)
    setFormTextY(b.text_y ?? 50)
    setFormVideoUrl(b.video_url ?? '')
    setFormVideoStart(b.video_start ? String(b.video_start) : '')
    setFormVideoEnd(b.video_end ? String(b.video_end) : '')
    setFormActive(b.active)
  }

  function openAdd() {
    setEditItem(null)
    setFormTitle('')
    setFormSubtitle('')
    setFormDescription('')
    setFormLinkUrl('')
    setFormLinkLabel('')
    setFormImagePreview('')
    setFormImage(null)
    setFormImageError('')
    setFormTextX(50)
    setFormTextY(50)
    setFormVideoUrl('')
    setFormVideoStart('')
    setFormVideoEnd('')
    setFormActive(true)
    setShowAdd(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle.trim()) { toast.error('El tÃ­tulo es obligatorio'); return }
    setSaving(true)
    const fd = new FormData()
    fd.append('title', formTitle)
    fd.append('subtitle', formSubtitle)
    fd.append('description', formDescription)
    fd.append('link_url', formLinkUrl)
    fd.append('link_label', formLinkLabel)
    fd.append('active', String(formActive))
    fd.append('text_x', String(formTextX))
    fd.append('text_y', String(formTextY))
    fd.append('video_url', formVideoUrl)
    fd.append('video_start', formVideoStart)
    fd.append('video_end', formVideoEnd)
    if (formImage) fd.append('image', formImage)
    else if (formImagePreview) fd.append('image_url', formImagePreview)

    try {
      const res = editItem
        ? await updateBanner(editItem.id, fd)
        : await createBanner(fd)

      if (!res || res.error) { toast.error(res?.error || 'Algo saliÃ³ mal') }
      else {
        toast.success(editItem ? 'Banner actualizado' : 'Banner creado')
        setShowAdd(false)
        setEditItem(null)
        load()
      }
    } catch (e: any) {
      console.error('Banner save error:', e)
      toast.error(e?.message || 'Algo saliÃ³ mal')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const res = await deleteBanner(id)
    if (res.error) { toast.error(res.error) }
    else {
      toast.success('Banner eliminado')
      setData((prev) => prev.filter((b) => b.id !== id))
    }
    setDeleteId(null)
  }

  async function handleToggleActive(b: Banner) {
    const res = await toggleBannerActive(b.id, !b.active)
    if (res.error) { toast.error(res.error) }
    else {
      setData((prev) => prev.map((x) => x.id === b.id ? { ...x, active: !x.active } : x))
    }
  }

  function moveUp(index: number) {
    if (index === 0) return
    const newList = [...data]
    ;[newList[index - 1], newList[index]] = [newList[index], newList[index - 1]]
    setData(newList)
    reorderBanners(newList.map((b) => b.id))
  }

  function moveDown(index: number) {
    if (index === data.length - 1) return
    const newList = [...data]
    ;[newList[index], newList[index + 1]] = [newList[index + 1], newList[index]]
    setData(newList)
    reorderBanners(newList.map((b) => b.id))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />)}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display tracking-wider text-foreground">Banners</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestiona los banners hero y las imÃ¡genes promocionales de la portada</p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={16} className="mr-2" /> AÃ±adir banner
        </Button>
      </div>

      {data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Image size={28} className="text-muted-foreground/60" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">AÃºn no hay banners</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              AÃ±ade banners de la portada para promocionar colecciones, ofertas y contenido destacado.
            </p>
            <Button onClick={openAdd}><Plus size={16} className="mr-2" /> AÃ±adir banner</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.map((b, i) => (
            <Card key={b.id} className={`border-l-4 ${b.active ? 'border-l-admin-success/50' : 'border-l-admin-slate/30'}`}>
              <CardContent className="p-4 pt-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <button onClick={() => moveUp(i)} disabled={i === 0} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6"/></svg>
                    </button>
                    <span className="text-[10px] font-mono text-muted-foreground">{i + 1}</span>
                    <button onClick={() => moveDown(i)} disabled={i === data.length - 1} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                  </div>
                  <div className="w-40 h-24 rounded bg-muted overflow-hidden flex-shrink-0">
                    {b.image_url ? (
                      <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Image size={20} className="text-muted-foreground" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <h3 className="text-sm font-medium truncate">{b.title}</h3>
                      <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${b.active ? 'bg-admin-success/10 text-admin-success' : 'bg-admin-slate/10 text-admin-slate'}`}>
                        {b.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    {b.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{b.subtitle}</p>}
                    {b.description && <p className="text-xs text-muted-foreground/60 mt-0.5 line-clamp-1">{b.description}</p>}
                    {b.link_url && <p className="text-xs text-blue-400 mt-1 truncate">{b.link_label ?? b.link_url}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleToggleActive(b)} className="h-8 w-8 p-0">
                      {b.active ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { openEdit(b); setShowAdd(true) }} className="h-8 w-8 p-0">
                      <Edit size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(b.id)} className="h-8 w-8 p-0 text-destructive">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={(o) => !o && (setShowAdd(false), setEditItem(null))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Editar banner' : 'Nuevo banner'}</DialogTitle>
            <DialogDescription>Configura la imagen y el contenido del banner.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Imagen del banner</Label>
              <div className="mt-1 flex gap-3 items-start">
                {(formImagePreview || formImage) && (
                  <div className="w-32 h-20 rounded border border-border overflow-hidden flex-shrink-0">
                    <img src={formImage ? URL.createObjectURL(formImage) : formImagePreview} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="h-10 rounded border border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-accent/10 transition-colors">
                    <span className="text-xs text-muted-foreground">
                      {formImage ? 'Cambiar imagen' : formImagePreview ? 'Reemplazar imagen' : 'Subir imagen'}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { if (f.size > 8 * 1024 * 1024) { setFormImageError('Imagen demasiado grande (mÃ¡x. 8MB)'); return }; setFormImageError(''); setFormImage(f) } }} />
                  </label>
                  <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => setMediaPicker(true)}>
                    <Image size={11} className="mr-1.5" /> Explorar medios
                  </Button>
                </div>
              </div>
              {formImageError && <p className="text-xs text-admin-danger mt-1">{formImageError}</p>}
            </div>
            <div>
              <Label htmlFor="title">TÃ­tulo *</Label>
              <Input id="title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="subtitle">SubtÃ­tulo</Label>
              <Input id="subtitle" value={formSubtitle} onChange={(e) => setFormSubtitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="description">DescripciÃ³n</Label>
              <textarea
                id="description"
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="link_url">URL del enlace</Label>
                <Input id="link_url" value={formLinkUrl} onChange={(e) => setFormLinkUrl(e.target.value)} placeholder="/collections/new" />
              </div>
              <div>
                <Label htmlFor="link_label">Texto del enlace</Label>
                <Input id="link_label" value={formLinkLabel} onChange={(e) => setFormLinkLabel(e.target.value)} placeholder="Comprar ahora" />
              </div>
            </div>
            <div>
              <Label>PosiciÃ³n del texto</Label>
              <div className="mt-1 grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>X</span><span>{formTextX}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={formTextX} onChange={(e) => setFormTextX(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Y</span><span>{formTextY}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={formTextY} onChange={(e) => setFormTextY(Number(e.target.value))} className="w-full" />
                </div>
              </div>
              {(formImagePreview || formImage) && (
                <div className="mt-2 relative w-full h-20 rounded border border-border overflow-hidden">
                  <img src={formImage ? URL.createObjectURL(formImage) : formImagePreview} alt="" className="w-full h-full object-cover" />
                  <div className="absolute w-4 h-4 rounded-full bg-primary border-2 border-admin-bg shadow-md" style={{ left: `${formTextX}%`, top: `${formTextY}%`, transform: 'translate(-50%,-50%)' }} />
                </div>
              )}
            </div>
            <div>
              <Label>VÃ­deo de fondo (opcional)</Label>
              <p className="text-xs text-muted-foreground mb-2">Selecciona un vÃ­deo de la biblioteca de medios para usarlo como fondo del banner.</p>
              <div className="flex items-center gap-3">
                {formVideoUrl && (
                  <div className="w-32 h-20 rounded border border-border overflow-hidden flex-shrink-0 bg-black flex items-center justify-center">
                    <video src={formVideoUrl} className="w-full h-full object-cover" muted />
                  </div>
                )}
                <Button type="button" variant="outline" size="sm" onClick={() => { setMediaPickerMode('video'); setMediaPicker(true) }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/></svg>
                  {formVideoUrl ? 'Cambiar vÃ­deo' : 'Seleccionar vÃ­deo de medios'}
                </Button>
              </div>
            </div>
            {formVideoUrl && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Inicio (segundos)</Label>
                  <Input
                    type="number"
                    value={formVideoStart}
                    onChange={(e) => setFormVideoStart(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Fin (segundos)</Label>
                  <Input
                    type="number"
                    value={formVideoEnd}
                    onChange={(e) => setFormVideoEnd(e.target.value)}
                    placeholder="VÃ­deo completo"
                  />
                </div>
              </div>
            )}
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} className="rounded border-input" />
              <span className="text-sm">Activo</span>
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => (setShowAdd(false), setEditItem(null))}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : editItem ? 'Actualizar' : 'Crear'}</Button>
            </DialogFooter>
          </form>
          <MediaPicker
            open={mediaPicker}
            onClose={() => setMediaPicker(false)}
            onSelect={(url) => {
              if (mediaPickerMode === 'video') {
                setFormVideoUrl(url)
              } else {
                setFormImagePreview(url)
                setFormImage(null)
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar banner</DialogTitle>
            <DialogDescription>Â¿EstÃ¡s seguro? Esta acciÃ³n no se puede deshacer.</DialogDescription>
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
