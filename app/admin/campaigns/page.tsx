'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Edit, Trash2, MoreHorizontal, ArrowUpDown, Copy, Send, Eye, FileText, Keyboard, ExternalLink, Megaphone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign, sendCampaign, duplicateCampaign } from '@/lib/admin/campaigns'
import type { EmailCampaign, CampaignStatus } from '@/lib/admin/types'
import { toast } from 'sonner'
import DataTablePagination from '@/components/admin/DataTablePagination'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

const STATUS_CONFIG: Record<CampaignStatus, { label: string; className: string }> = {
  draft: { label: 'Borrador', className: 'bg-admin-slate/10 text-admin-slate border-admin-slate/20' },
  sending: { label: 'Enviando', className: 'bg-admin-info/10 text-admin-info border-admin-info/20' },
  sent: { label: 'Enviado', className: 'bg-admin-success/10 text-admin-success border-admin-success/20' },
  failed: { label: 'Fallida', className: 'bg-admin-danger/10 text-admin-danger border-admin-danger/20' },
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [sendConfirmId, setSendConfirmId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const [mode, setMode] = useState<'list' | 'compose'>('list')
  const [editId, setEditId] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [plainText, setPlainText] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('write')

  async function load() {
    try { setCampaigns(await getCampaigns()) }
    catch (e) { console.error(e) }
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount via async load()
  useEffect(() => { load() }, [])

  useKeyboardShortcuts({
    'n': () => { setEditId(null); setSubject(''); setHtmlContent(''); setPlainText(''); setMode('compose'); setActiveTab('write') },
    'Escape': () => { if (mode === 'compose') { setMode('list'); setEditId(null) } setDeleteId(null); setSendConfirmId(null) },
    '?': () => toast('Atajos: N = nuevo, Esc = atrÃ¡s/cerrar'),
  })

  function startEdit(c: EmailCampaign) {
    setEditId(c.id); setSubject(c.subject); setHtmlContent(c.html_content); setPlainText(c.plain_text || ''); setMode('compose'); setActiveTab('write')
  }

  function startNew() {
    setEditId(null); setSubject(''); setHtmlContent(''); setPlainText(''); setMode('compose'); setActiveTab('write')
  }

  async function handleSave() {
    if (!subject.trim()) { toast.error('El asunto es obligatorio'); return }
    if (!htmlContent.trim()) { toast.error('El contenido HTML es obligatorio'); return }
    setSaving(true)
    const data = { subject, html_content: htmlContent, plain_text: plainText }
    if (editId) {
      const res = await updateCampaign(editId, data)
      if (res.error) toast.error(res.error)
      else { toast.success('CampaÃ±a guardada'); setMode('list'); setEditId(null) }
    } else {
      const res = await createCampaign(data)
      if (res.error) toast.error(res.error)
      else { toast.success('CampaÃ±a creada'); setMode('list' as any) }
    }
    setSaving(false); load()
  }

  async function handleDelete() {
    if (!deleteId) return
    const res = await deleteCampaign(deleteId)
    if (res.error) toast.error(res.error)
    else { toast.success('CampaÃ±a eliminada'); load() }
    setDeleteId(null)
  }

  async function handleSend() {
    if (!sendConfirmId) return
    setSending(true)
    const res = await sendCampaign(sendConfirmId)
    if (res.error) toast.error(res.error)
    else toast.success('Â¡CampaÃ±a enviada!')
    setSending(false); setSendConfirmId(null); load()
  }

  async function handleDuplicate(id: string) {
    const res = await duplicateCampaign(id)
    if (res.error) toast.error(res.error)
    else { toast.success('CampaÃ±a duplicada'); load() }
  }

  const filtered = search
    ? campaigns.filter((c) => c.subject.toLowerCase().includes(search.toLowerCase()))
    : campaigns

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between"><div className="h-8 w-32 bg-muted rounded animate-pulse" /><div className="h-9 w-32 bg-muted rounded animate-pulse" /></div>
        <div className="h-10 w-full max-w-sm bg-muted rounded animate-pulse" /><div className="h-96 bg-muted rounded-lg animate-pulse" />
      </div>
    )
  }

  if (mode === 'compose') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display tracking-wider text-foreground">{editId ? 'Editar campaÃ±a' : 'Nueva campaÃ±a'}</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => { setMode('list'); setEditId(null) }}>
              Volver
            </Button>
            <Button size="sm" className="gap-1" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : editId ? 'Guardar cambios' : 'Crear campaÃ±a'}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 pt-6 space-y-4">
            <div className="space-y-2">
              <Label>Asunto</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="La lÃ­nea de asunto de tu email..." />
            </div>
            <div className="space-y-2">
              <Label>VersiÃ³n texto plano</Label>
              <Textarea value={plainText} onChange={(e) => setPlainText(e.target.value)} placeholder="VersiÃ³n de texto plano (opcional)" rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Contenido HTML</Label>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                  <TabsTrigger value="write" className="gap-1"><FileText size={14} /> Escribir</TabsTrigger>
                  <TabsTrigger value="preview" className="gap-1"><Eye size={14} /> Vista previa</TabsTrigger>
                </TabsList>
                <TabsContent value="write">
                  <Textarea
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    placeholder="<html><body><h1>Tu contenido de email aquÃ­...</h1></body></html>"
                    className="min-h-[400px] font-mono text-sm"
                  />
                </TabsContent>
                <TabsContent value="preview">
                  <div className="border rounded-lg bg-white min-h-[400px]">
                    {htmlContent ? (
                      <iframe
                        srcDoc={htmlContent}
                        className="w-full min-h-[400px] rounded-lg"
                        title="Vista previa del email"
                        sandbox=""
                      />
                    ) : (
                      <div className="flex items-center justify-center h-[400px] text-muted-foreground text-sm">
                        No hay contenido para previsualizar
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display tracking-wider text-foreground">CampaÃ±as</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1 h-8 text-xs" onClick={() => toast('Atajos: N = nuevo, Esc = atrÃ¡s')}>
            <Keyboard size={14} /> Atajos
          </Button>
          <Button size="sm" className="gap-1 h-8 text-xs" onClick={startNew}>
            <Plus size={14} /> Nueva campaÃ±a
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar campaÃ±as..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: 'auto' }} className="text-xs font-medium">Asunto</TableHead>
                <TableHead style={{ width: 100 }} className="text-xs font-medium">Estado</TableHead>
                <TableHead style={{ width: 80 }} className="text-xs font-medium text-right">Enviados</TableHead>
                <TableHead style={{ width: 80 }} className="text-xs font-medium text-right">Fallidos</TableHead>
                <TableHead style={{ width: 130 }} className="text-xs font-medium">Creada</TableHead>
                <TableHead style={{ width: 60 }} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => startEdit(c)}>
                  <TableCell className="font-medium text-sm truncate">{c.subject || 'Sin tÃ­tulo'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${STATUS_CONFIG[c.status].className} text-[10px]`}>
                      {STATUS_CONFIG[c.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs">{c.sent_count}</TableCell>
                  <TableCell className="text-right text-xs text-admin-danger">{c.failed_count > 0 ? c.failed_count : '-'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                  <TableCell>
                    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal size={14} /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => startEdit(c)}><Edit size={14} className="mr-2" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(c.id)}><Copy size={14} className="mr-2" /> Duplicar</DropdownMenuItem>
                          {c.status === 'draft' && (
                            <DropdownMenuItem onClick={() => setSendConfirmId(c.id)}>
                              <Send size={14} className="mr-2" /> Enviar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(c.id)}>
                            <Trash2 size={14} className="mr-2" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Megaphone size={32} className="text-muted-foreground/40" />
                      <span>AÃºn no hay campaÃ±as</span>
                      <Button variant="outline" size="sm" onClick={startNew}>Crea tu primera campaÃ±a</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Eliminar campaÃ±a</DialogTitle><DialogDescription>Â¿EstÃ¡s seguro? Esta acciÃ³n no se puede deshacer.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!sendConfirmId} onOpenChange={(o) => !o && setSendConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar campaÃ±a</DialogTitle>
            <DialogDescription>
              Esto enviarÃ¡ la campaÃ±a a todos los suscriptores activos. Esta acciÃ³n no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendConfirmId(null)}>Cancelar</Button>
            <Button onClick={handleSend} disabled={sending} className="gap-1">
              <Send size={14} /> {sending ? 'Enviando...' : 'Enviar ahora'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
