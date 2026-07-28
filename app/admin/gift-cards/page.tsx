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
    if (!form.code.trim()) return toast.error('Code required')
    if (!form.initial_balance_cents || form.initial_balance_cents <= 0) return toast.error('Balance must be positive')
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
        toast.success(editing ? 'Gift card updated' : 'Gift card created')
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
    else { toast.success('Gift card deleted'); setDeleteId(null); load() }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return
    const res = await bulkDeleteGiftCards(Array.from(selected))
    if (res.error) toast.error(res.error)
    else { toast.success(`${selected.size} gift cards deleted`); setSelected(new Set()); load() }
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
          <h1 className="text-2xl font-serif tracking-wider text-foreground">Gift Cards</h1>
          <p className="text-sm text-muted-foreground mt-1">Issue and manage gift card products</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true) }}>
          <Plus size={16} className="mr-2" /> Issue Gift Card
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Issued</CardTitle>
            <Gift size={14} className="text-muted-foreground/60" />
          </CardHeader>
          <CardContent><div className="text-xl font-semibold">{data.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Outstanding Value</CardTitle>
            <DollarSign size={14} className="text-admin-success" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-admin-success">{fmt(totalBalance)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active</CardTitle>
            <CreditCard size={14} className="text-muted-foreground/60" />
          </CardHeader>
          <CardContent><div className="text-xl font-semibold">{activeCount}</div></CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by code or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        {selected.size > 0 && (
          <Button size="sm" variant="destructive" onClick={handleBulkDelete} className="h-8 text-xs">
            Delete {selected.size}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="w-8 py-3 px-2"><input type="checkbox" className="rounded border-input" /></th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Code</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Initial</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Remaining</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Recipient</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted-foreground py-12">No gift cards found</td></tr>
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
                    <span className="text-xs text-muted-foreground">{gc.recipient_email || '—'}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={gc.active ? 'default' : 'secondary'} className="text-[10px]">
                      {gc.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(gc)} className="h-7 text-xs">Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(gc.id)} className="h-7 text-xs text-destructive">Delete</Button>
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
            <DialogTitle>{editing ? 'Edit Gift Card' : 'Issue Gift Card'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update gift card details.' : 'Create a new gift card for a customer.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="gc_code">Code *</Label>
                <Input
                  id="gc_code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  placeholder="GIFT-ABC-123"
                  className="font-mono"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="gc_balance">Initial Balance (cents) *</Label>
                <Input
                  id="gc_balance"
                  type="number"
                  min={100}
                  value={form.initial_balance_cents}
                  onChange={(e) => setForm({ ...form, initial_balance_cents: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="gc_recipient">Recipient Email</Label>
                <Input
                  id="gc_recipient"
                  type="email"
                  value={form.recipient_email}
                  onChange={(e) => setForm({ ...form, recipient_email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="gc_sender">Sender Email</Label>
                <Input
                  id="gc_sender"
                  type="email"
                  value={form.sender_email}
                  onChange={(e) => setForm({ ...form, sender_email: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="gc_expires">Expires At</Label>
                <Input
                  id="gc_expires"
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="gc_message">Message</Label>
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
                <Label htmlFor="gc_active" className="mb-0">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update' : 'Issue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Gift Card</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
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
