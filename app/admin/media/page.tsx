'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Upload, Trash2, Copy, Image as ImageIcon, Film, File, Search, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import SimplePagination from '@/components/admin/SimplePagination'
import { getPublicUrl } from '@/lib/supabase/storage'
import { getMediaList, deleteMedia } from '@/lib/admin/media'
import { uploadDirect } from '@/lib/storage-client'
import type { MediaFile } from '@/lib/admin/media'

const PAGE_SIZE = 24
const BUCKET_URL = `https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '') || 'flshhgzyzhgrnorgkcsx.supabase.co'}/storage/v1/object/public/product-images`

function getFileType(name: string): 'image' | 'video' | 'other' {
  const ext = name.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'].includes(ext || '')) return 'image'
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext || '')) return 'video'
  return 'other'
}

export default function MediaPage() {
  const [media, setMedia] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTargets, setDeleteTargets] = useState<string[]>([])
  const [pageDragOver, setPageDragOver] = useState(false)
  const [dialogDragOver, setDialogDragOver] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const dialogFileInputRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    try {
      const list = await getMediaList()
      setMedia(list)
    } catch (e: any) {
      toast.error(e.message || 'Error al cargar los medios')
    }
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount via async load()
  useEffect(() => { load() }, [])

  const filtered = media.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function toggleSelect(name: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files)
    if (!fileArr.length) { toast.error('Selecciona archivos'); return }
    setUploading(true)

    try {
      let ok = 0
      for (const file of fileArr) {
        const res = await uploadDirect(file)
        if ('error' in res) {
          toast.error(res.error)
        } else {
          const optimistic: MediaFile = {
            name: res.url.split('/').pop() || file.name,
            id: res.url.split('/').pop() || file.name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString(),
            metadata: {},
          }
          setMedia((prev) => [optimistic, ...prev])
          ok++
        }
      }
      if (ok > 0) toast.success(`${ok} archivo(s) subidos`)
      setUploadOpen(false)
      setSelectedFiles([])
    } catch (e: any) {
      toast.error(e.message || 'Error al subir')
    }
    setUploading(false)
  }, [])

  function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    uploadFiles(selectedFiles)
  }

  function handleDialogFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (files?.length) {
      setSelectedFiles((prev) => [...prev, ...Array.from(files)])
    }
    e.target.value = ''
  }

  function removeSelectedFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleDelete() {
    const targets = deleteTargets.length > 0 ? deleteTargets : Array.from(selected)
    if (targets.length === 0) return
    try {
      const res = await deleteMedia(targets)
      if (res?.error) toast.error(res.error)
      else {
        toast.success(`${targets.length} archivo(s) eliminados`)
        setSelected(new Set())
      }
    } catch (e: any) {
      toast.error(e.message || 'Error al eliminar archivos')
    }
    setDeleteOpen(false)
    setDeleteTargets([])
    load()
  }

  function copyUrl(name: string) {
    const url = getPublicUrl(name)
    navigator.clipboard.writeText(url).then(() => toast.success('URL copiada')).catch(() => toast.error('Error al copiar'))
  }

  async function handleDropFiles(files: FileList) {
    if (!files.length) return
    setUploading(true)

    try {
      let ok = 0
      for (const file of Array.from(files)) {
        const res = await uploadDirect(file)
        if ('error' in res) {
          toast.error(res.error)
        } else {
          const optimistic: MediaFile = {
            name: res.url.split('/').pop() || file.name,
            id: res.url.split('/').pop() || file.name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString(),
            metadata: {},
          }
          setMedia((prev) => [optimistic, ...prev])
          ok++
        }
      }
      if (ok > 0) toast.success(`${ok} archivo(s) subidos`)
    } catch (e: any) {
      toast.error(e.message || 'Error al subir')
    }
    setUploading(false)
  }

  function onDialogDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDialogDragOver(false)
    if (e.dataTransfer.files.length) {
      handleDropFiles(e.dataTransfer.files)
      setUploadOpen(false)
    }
  }

  function onPageDrop(e: React.DragEvent) {
    e.preventDefault()
    setPageDragOver(false)
    if (e.dataTransfer.files.length) {
      handleDropFiles(e.dataTransfer.files)
    }
  }

  function getThumbnailUrl(name: string): string {
    return `${BUCKET_URL}/${name}`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative space-y-6"
      onDragOver={(e) => { e.preventDefault(); setPageDragOver(true) }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setPageDragOver(false) }}
      onDrop={onPageDrop}
    >
      {pageDragOver && (
        <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-sm border-2 border-dashed border-primary rounded-lg flex flex-col items-center justify-center pointer-events-none">
          <Upload size={48} className="text-primary mb-4 animate-bounce" />
          <p className="text-lg font-display text-foreground">Suelta archivos para subirlos</p>
          <p className="text-sm text-muted-foreground mt-1">Las imágenes y vídeos se subirán automáticamente</p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display tracking-wider text-foreground">Biblioteca de medios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {media.length} archivo(s) — Sube, gestiona y copia URLs de imágenes y vídeos
          </p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <Button variant="destructive" size="sm" onClick={() => { setDeleteTargets(Array.from(selected)); setDeleteOpen(true) }}>
              <Trash2 size={14} className="mr-2" /> Eliminar ({selected.size})
            </Button>
          )}
          <Button onClick={() => setUploadOpen(true)}>
            <Upload size={16} className="mr-2" /> Subir
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar archivos..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} className="pl-9" />
      </div>

      {paginated.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <ImageIcon size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">No hay archivos</p>
            <p className="text-sm mt-1">Sube imágenes y vídeos para usarlos en todo el sitio</p>
            <Button variant="outline" className="mt-6" onClick={() => setUploadOpen(true)}>
              <Upload size={16} className="mr-2" /> Sube tu primer archivo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {paginated.map((file) => {
            const type = getFileType(file.name)
            const isSelected = selected.has(file.name)
            return (
              <div
                key={file.name}
                className={`relative group rounded-lg border overflow-hidden cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
                onClick={() => toggleSelect(file.name)}
              >
                {type === 'image' ? (
                  <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getThumbnailUrl(file.name)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : type === 'video' ? (
                  <div className="aspect-square bg-muted flex flex-col items-center justify-center gap-2">
                    <Film size={32} className="text-muted-foreground/50" />
                    <span className="text-[10px] text-muted-foreground font-mono">VIDEO</span>
                  </div>
                ) : (
                  <div className="aspect-square bg-muted flex flex-col items-center justify-center gap-2">
                    <File size={32} className="text-muted-foreground/50" />
                    <span className="text-[10px] text-muted-foreground font-mono">{file.name.split('.').pop()?.toUpperCase()}</span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white truncate font-mono">{file.name}</p>
                  <p className="text-[9px] text-white/60">{(file.metadata?.size / 1024).toFixed(0)} KB</p>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); copyUrl(file.name) }}
                    className="h-7 w-7 rounded-md bg-black/60 hover:bg-black/80 flex items-center justify-center text-white"
                    title="Copiar URL"
                  >
                    <Copy size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTargets([file.name]); setDeleteOpen(true) }}
                    className="h-7 w-7 rounded-md bg-black/60 hover:bg-red-600/80 flex items-center justify-center text-white"
                    title="Eliminar"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                {isSelected && (
                  <div className="absolute top-2 left-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-[10px] text-background font-bold">✓</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <SimplePagination
        page={page}
        totalPages={Math.ceil(filtered.length / PAGE_SIZE)}
        totalItems={filtered.length}
        onPageChange={setPage}
      />

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={(v) => { setUploadOpen(v); if (!v) setSelectedFiles([]) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir medios</DialogTitle>
            <DialogDescription>Sube imágenes y vídeos para usarlos en todo el sitio web.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            {/* drop zone — only shown when no files selected */}
            {selectedFiles.length === 0 && (
              <label
                className={`flex flex-col items-center justify-center h-40 rounded-lg border border-dashed cursor-pointer transition-colors ${
                  dialogDragOver
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-accent/10'
                }`}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDialogDragOver(true) }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDialogDragOver(false) }}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDialogDragOver(true) }}
                onDrop={onDialogDrop}
              >
                <Upload size={24} className="text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Haz clic para seleccionar archivos o arrastra y suelta</span>
                <span className="text-[10px] text-muted-foreground/50 mt-1">JPG, PNG, WebP, GIF, MP4, WebM</span>
                <input ref={dialogFileInputRef} type="file" multiple accept=".jpg,.jpeg,.png,.gif,.webp,.avif,.svg,.mp4,.webm,.mov" className="hidden" onChange={handleDialogFileSelect} />
              </label>
            )}

            {/* file previews */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <p className="text-xs text-muted-foreground">{selectedFiles.length} archivo(s) seleccionados</p>
                {selectedFiles.map((file, i) => (
                  <div key={`${file.name}-${i}`} className="flex items-center gap-3 rounded-lg border border-border p-2 pr-3">
                    <div className="h-12 w-12 shrink-0 rounded-md bg-muted overflow-hidden flex items-center justify-center">
                      {file.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(file)} alt={file.name} className="h-full w-full object-cover" />
                      ) : (
                        <Film size={18} className="text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button type="button" onClick={() => removeSelectedFile(i)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => dialogFileInputRef.current?.click()}
                >
                  <Upload size={12} className="mr-1" /> Añadir más archivos
                </Button>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setUploadOpen(false); setSelectedFiles([]) }}>Cancelar</Button>
              <Button type="submit" disabled={uploading || selectedFiles.length === 0}>{uploading ? 'Subiendo...' : 'Subir'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar {deleteTargets.length > 1 ? `${deleteTargets.length} archivos` : 'archivo'}</DialogTitle>
            <DialogDescription>
              Esto eliminará permanentemente {deleteTargets.length > 1 ? 'estos archivos' : 'este archivo'} del almacenamiento. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {deleteTargets.length <= 5 && (
            <div className="max-h-32 overflow-y-auto space-y-1">
              {deleteTargets.map((name) => (
                <p key={name} className="text-xs font-mono text-muted-foreground">{name}</p>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

