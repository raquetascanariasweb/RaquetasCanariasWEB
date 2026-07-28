'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Plus, Search, Percent, Tag, Calendar, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { getDiscounts, createDiscount, updateDiscount, deleteDiscount, bulkDeleteDiscounts, bulkUpdateDiscounts } from '@/lib/admin/discounts'
import type { AdminDiscount } from '@/lib/admin/types'
import { toast } from 'sonner'
import { useAdminCurrency } from '../AdminLayoutClient'

const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed_amount', label: 'Fixed Amount' },
]

export default function AdminDiscountsPage() {
  const { formatPrice: fmt } = useAdminCurrency()
  const [data, setData] = useState<AdminDiscount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AdminDiscount | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed_amount',
    value: 0,
    description: '',
    min_purchase_cents: 0,
    max_uses: null as number | null,
    active: true,
    starts_at: '',
    expires_at: '',
  })
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  async function load() {
    try {
      setData(await getDiscounts())
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function resetForm() {
    setForm({
      code: '',
      type: 'percentage',
      value: 0,
      description: '',
      min_purchase_cents: 0,
      max_uses: null,
      active: true,
      starts_at: '',
      expires_at: '',
    })
    setEditing(null)
  }

  function openEdit(d: AdminDiscount) {
    setForm({
      code: d.code,
      type: d.type,
      value: d.value,
      description: d.description,
      min_purchase_cents: d.min_purchase_cents,
      max_uses: d.max_uses,
      active: d.active,
      starts_at: d.starts_at ? d.starts_at.slice(0, 16) : '',
      expires_at: d.expires_at ? d.expires_at.slice(0, 16) : '',
    })
    setEditing(d)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.code.trim()) return toast.error('Code required')
    if (!form.value || form.value <= 0) return toast.error('Value must be positive')
    setSaving(true)
    try {
      const payload = {
        code: form.code,
        type: form.type,
        value: form.value,
        description: form.description,
        min_purchase_cents: form.min_purchase_cents,
        max_uses: form.max_uses,
        active: form.active,
        starts_at: form.starts_at || null,
        expires_at: form.expires_at || null,
      }
      const res = editing
        ? await updateDiscount(editing.id, payload)
        : await createDiscount(payload)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(editing ? 'Discount updated' : 'Discount created')
        setShowForm(false)
        load()
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Error')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const res = await deleteDiscount(id)
    if (res.error) toast.error(res.error)
    else { toast.success('Discount deleted'); setDeleteId(null); load() }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return
    const res = await bulkDeleteDiscounts(Array.from(selected))
    if (res.error) toast.error(res.error)
    else { toast.success(`${selected.size} discounts deleted`); setSelected(new Set()); load() }
  }

  async function handleBulkToggle(active: boolean) {
    if (selected.size === 0) return
    const res = await bulkUpdateDiscounts(Array.from(selected), { active })
    if (res.error) toast.error(res.error)
    else { toast.success(`${selected.size} discounts updated`); setSelected(new Set()); load() }
  }

  function toggleSelect(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  const filtered = useMemo(
    () => data.filter((d) => d.code.toLowerCase().includes(search.toLowerCase())),
    [data, search]
  )

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-10 w-48 bg-muted rounded" />
      <div className="h-8 bg-muted rounded w-full" />
      <div className="h-72 bg-muted rounded-lg" />
    </div>
  }

  const activeCount = data.filter((d) => d.active).length
  const totalUses = data.reduce((sum, d) => sum + d.used_count, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif tracking-wider text-foreground">Discounts</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage promotional discounts</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true) }}>
          <Plus size={16} className="mr-2" /> Add Discount
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Discounts</CardTitle>
            <Percent size={14} className="text-muted-foreground/60" />
          </CardHeader>
          <CardContent><div className="text-xl font-semibold">{data.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active</CardTitle>
            <Tag size={14} className="text-admin-success" />
          </CardHeader>
          <CardContent><div className="text-xl font-semibold text-admin-success">{activeCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Uses</CardTitle>
            <Calendar size={14} className="text-muted-foreground/60" />
          </CardHeader>
          <CardContent><div className="text-xl font-semibold">{totalUses.toLocaleString('en-US')}</div></CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search codes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => handleBulkToggle(true)} className="h-8 text-xs">
              <ToggleRight size={14} className="mr-1" /> Activate
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkToggle(false)} className="h-8 text-xs">
              <ToggleLeft size={14} className="mr-1" /> Deactivate
            </Button>
            <Button size="sm" variant="destructive" onClick={handleBulkDelete} className="h-8 text-xs">
              Delete {selected.size}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="w-8 py-3 px-2"><input type="checkbox" className="rounded border-input" /></th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Code</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Value</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Min Purchase</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Uses</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted-foreground py-12">No discounts found</td></tr>
              )}
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-accent/5">
                  <td className="py-3 px-2">
                    <input
                      type="checkbox"
                      checked={selected.has(d.id)}
                      onChange={() => toggleSelect(d.id)}
                      className="rounded border-input"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-xs tracking-wider">{d.code}</span>
                      {d.description && <span className="text-xs text-muted-foreground hidden lg:inline">{d.description}</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {d.type === 'percentage' ? `${d.value}%` : fmt(d.value)}
                    <Badge variant="outline" className="ml-2 text-[10px]">
                      {d.type === 'percentage' ? '%' : '$'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {d.min_purchase_cents > 0 ? fmt(d.min_purchase_cents) : '—'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-xs">{d.used_count}{d.max_uses ? ` / ${d.max_uses}` : ''}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={d.active ? 'default' : 'secondary'} className="text-[10px]">
                      {d.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(d)} className="h-7 text-xs">Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(d.id)} className="h-7 text-xs text-destructive">Delete</Button>
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
            <DialogTitle>{editing ? 'Edit Discount' : 'New Discount'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update discount details.' : 'Create a new discount code.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="d_code">Code *</Label>
                <Input
                  id="d_code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER20"
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="d_type">Type</Label>
                <select
                  id="d_type"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as 'percentage' | 'fixed_amount' })}
                >
                  {DISCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="d_value">
                  Value {form.type === 'percentage' ? '(%)' : '(cents)'}
                </Label>
                <Input
                  id="d_value"
                  type="number"
                  min={1}
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="d_min">Min Purchase (cents)</Label>
                <Input
                  id="d_min"
                  type="number"
                  min={0}
                  value={form.min_purchase_cents}
                  onChange={(e) => setForm({ ...form, min_purchase_cents: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="d_max">Max Uses</Label>
                <Input
                  id="d_max"
                  type="number"
                  min={0}
                  value={form.max_uses ?? ''}
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <Label htmlFor="d_starts">Starts At</Label>
                <Input
                  id="d_starts"
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="d_expires">Expires At</Label>
                <Input
                  id="d_expires"
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="d_desc">Description (internal)</Label>
                <Input
                  id="d_desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="d_active"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="rounded border-input"
                />
                <Label htmlFor="d_active" className="mb-0">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Discount</DialogTitle>
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
