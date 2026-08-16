'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Plus, Search, Gift, DollarSign, CreditCard,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { getGiftCards, createGiftCard, updateGiftCard, deleteGiftCard, bulkDeleteGiftCards } from '@/lib/admin/gift-cards'
import type { AdminGiftCard } from '@/lib/admin/types'
import { toast } from 'sonner'
import { useAdminCurrency } from '../AdminLayoutClient'

export default function AdminGiftCardsPage() {
  const { formatPrice: fmt } = useAdminCurrency()
  const [data, setData] = useState<AdminGiftCard[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AdminGiftCard | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({
    code: '',
    initial_balance_cents: 0,
    recipient_email: '',
    sender_email: '',
    message: '',
    active: true,
    expires_at: '',
  })
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  async function load() {
    try {
      setData(await getGiftCards())
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount via async load()
  useEffect(() => { load() }, [])

  function resetForm() {
    setForm({
      code: '',
      initial_balance_cents: 0,
      recipient_email: '',
      sender_email: '',
      message: '',
      active: true,
      expires_at: '',
    })
    setEditing(null)
  }

  function openEdit(gc: AdminGiftCard) {
    setForm({
      code: gc.code,
      initial_balance_cents: gc.initial_balance_cents,
      recipient_email: gc.recipient_email,
      sender_email: gc.sender_email,
      message: gc.message,
      active: gc.active,
      expires_at: gc.expires_at ? gc.expires_at.slice(0, 16) : '',
    })
    setEditing(gc)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.code.trim()) return toast.error('El cÃ³digo es obligatorio')
    if (!form.initial_balance_cents || form.initial_balance_cents <= 0) return toast.error('El saldo debe ser positivo')
    setSaving(true)
    try {
      const payload = {
        code: form.code,
        initial_balance_cents: form.initial_balance_cents,
        recipient_email: form.recipient_email,
        sender_email: form.sender_email,
        message: form.message,
        active: form.active,
        expires_at: form.expires_at || null,
      }
      const res = editing
        ? await updateGiftCard(editing.id, { ...payload, remaining_balance_cents: form.initial_balance_cents })
        : await createGiftCard(payload)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(editing ? 'Tarjeta regalo actualizada' : 'Tarjeta regalo creada')
        setShowForm(false)
        load()
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Error')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const res = await deleteGiftCard(id)
    if (res.error) toast.error(res.error)
    else { toast.success('Tarjeta regalo eliminada'); setDeleteId(null); load() }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return
    const res = await bulkDeleteGiftCards(Array.from(selected))
    if (res.error) toast.error(res.error)
    else { toast.success(`${selected.size} tarjetas regalo eliminadas`); setSelected(new Set()); load() }
  }

  function toggleSelect(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  const filtered = useMemo(
    () => data.filter((gc) => gc.code.toLowerCase().includes(search.toLowerCase()) || gc.recipient_email.toLowerCase().includes(search.toLowerCase())),
    [data, search]
  )

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-10 w-48 bg-muted rounded" />
      <div className="h-8 bg-muted rounded w-full" />
      <div className="h-72 bg-muted rounded-lg" />
    </div>
  }

  const totalBalance = data.reduce((sum, gc) => sum + gc.remaining_balance_cents, 0)
  const activeCount = data.filter((gc) => gc.active).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display tracking-wider text-foreground">Tarjetas regalo</h1>
          <p className="text-sm text-muted-foreground mt-1">Emite y gestiona tarjetas regalo</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true) }}>
          <Plus size={16} className="mr-2" /> Emitir tarjeta regalo
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total emitidas</CardTitle>
            <Gift size={14} className="text-muted-foreground/60" />
          </CardHeader>
          <CardContent><div className="text-xl font-semibold">{data.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Valor pendiente</CardTitle>
            <DollarSign size={14} className="text-admin-success" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-admin-success">{fmt(totalBalance)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Activas</CardTitle>
            <CreditCard size={14} className="text-muted-foreground/60" />
          </CardHeader>
          <CardContent><div className="text-xl font-semibold">{activeCount}</div></CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por cÃ³digo o email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        {selected.size > 0 && (
          <Button size="sm" variant="destructive" onClick={handleBulkDelete} className="h-8 text-xs">
            Eliminar {selected.size}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="w-8 py-3 px-2"><input type="checkbox" className="rounded border-input" /></th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">CÃ³digo</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Inicial</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Restante</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Destinatario</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Estado</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted-foreground py-12">No se encontraron tarjetas regalo</td></tr>
              )}
              {filtered.map((gc) => (
                <tr key={gc.id} className="hover:bg-accent/5">
                  <td className="py-3 px-2">
                    <input
                      type="checkbox"
                      checked={selected.has(gc.id)}
                      onChange={() => toggleSelect(gc.id)}
                      className="rounded border-input"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-medium text-xs tracking-wider">{gc.code}</span>
                  </td>
                  <td className="py-3 px-4 text-right">{fmt(gc.initial_balance_cents)}</td>
                  <td className="py-3 px-4 text-right font-medium">{fmt(gc.remaining_balance_cents)}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-muted-foreground">{gc.recipient_email || 'â€”'}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={gc.active ? 'default' : 'secondary'} className="text-[10px]">
                      {gc.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(gc)} className="h-7 text-xs">Editar</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(gc.id)} className="h-7 text-xs text-destructive">Eliminar</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={(o) => !o && setShowForm(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar tarjeta regalo' : 'Emitir tarjeta regalo'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Actualiza los detalles de la tarjeta regalo.' : 'Crea una nueva tarjeta regalo para un cliente.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="gc_code">CÃ³digo *</Label>
                <Input
                  id="gc_code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  placeholder="GIFT-ABC-123"
                  className="font-mono"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="gc_balance">Saldo inicial (cÃ©ntimos) *</Label>
                <Input
                  id="gc_balance"
                  type="number"
                  min={100}
                  value={form.initial_balance_cents}
                  onChange={(e) => setForm({ ...form, initial_balance_cents: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="gc_recipient">Email del destinatario</Label>
                <Input
                  id="gc_recipient"
                  type="email"
                  value={form.recipient_email}
                  onChange={(e) => setForm({ ...form, recipient_email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="gc_sender">Email del remitente</Label>
                <Input
                  id="gc_sender"
                  type="email"
                  value={form.sender_email}
                  onChange={(e) => setForm({ ...form, sender_email: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="gc_expires">Expira el</Label>
                <Input
                  id="gc_expires"
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="gc_message">Mensaje</Label>
                <textarea
                  id="gc_message"
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="gc_active"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="rounded border-input"
                />
                <Label htmlFor="gc_active" className="mb-0">Activo</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Emitir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar tarjeta regalo</DialogTitle>
            <DialogDescription>Esta acciÃ³n no se puede deshacer.</DialogDescription>
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
