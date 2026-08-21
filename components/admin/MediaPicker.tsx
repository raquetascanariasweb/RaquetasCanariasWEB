'use client'

import { useEffect, useState, useRef } from 'react'
import { Upload, Image as ImageIcon, Film, File, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { getMediaList } from '@/lib/admin/media'
import { uploadMediaFile } from '@/lib/admin/media-upload'
import type { MediaFile } from '@/lib/admin/media'

const BUCKET_URL = `https://${(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://flshhgzyzhgrnorgkcsx.supabase.co').replace('https://', '')}/storage/v1/object/public/media`

function getFileType(name: string): 'image' | 'video' | 'other' {
  const ext = name.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'].includes(ext || '')) return 'image'
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext || '')) return 'video'
  return 'other'
}

interface MediaPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (url: string) => void
}

export default function MediaPicker({ open, onClose, onSelect }: MediaPickerProps) {
  const [media, setMedia] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    try {
      const list = await getMediaList()
      setMedia(list)
    } catch { /* ignore */ }
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount via async load()
  useEffect(() => { if (open) load() }, [open])

  const filtered = media.filter((f) => {
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false
    if (tab === 'images' && getFileType(f.name) !== 'image') return false
    if (tab === 'videos' && getFileType(f.name) !== 'video') return false
    return true
  })

  async function handleUpload() {
    const files = fileInputRef.current?.files
    if (!files?.length) return

    let ok = 0
    for (const file of Array.from(files)) {
      const res = await uploadMediaFile(file)
      if ('error' in res) toast.error(res.error)
      else ok++
    }
    if (ok > 0) toast.success(`${ok} subido(s)`)
    if (fileInputRef.current) fileInputRef.current.value = ''
    load()
  }

  function handleSelect(name: string) {
    const url = `${BUCKET_URL}/${name}`
    onSelect(url)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Biblioteca de medios</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={14} className="mr-1.5" /> Subir
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-3">
            <TabsTrigger value="all">Todo</TabsTrigger>
            <TabsTrigger value="images">Imágenes</TabsTrigger>
            <TabsTrigger value="videos">Vídeos</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="m-0">
            {loading ? (
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <ImageIcon size={40} className="opacity-30 mb-3" />
                <p className="text-sm">No se encontraron archivos</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {filtered.map((file) => {
                  const type = getFileType(file.name)
                  const url = `${BUCKET_URL}/${file.name}`
                  return (
                    <button
                      key={file.name}
                      type="button"
                      onClick={() => handleSelect(file.name)}
                      className="group relative aspect-square rounded-lg border border-border overflow-hidden hover:border-primary hover:ring-1 hover:ring-primary transition-all text-left"
                    >
                      {type === 'image' ? (
                        <img src={url} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : type === 'video' ? (
                        <div className="w-full h-full bg-muted flex flex-col items-center justify-center">
                          <Film size={24} className="text-muted-foreground/50" />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-muted flex flex-col items-center justify-center">
                          <File size={24} className="text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-1.5 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-white truncate">{file.name}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
