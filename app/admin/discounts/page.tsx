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
  { value: 'percentage', label: 'Porcentaje' },
  { value: 'fixed_amount', label: 'Importe fijo' },
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

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount via async load()
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
    if (!form.code.trim()) return toast.error('El cÃ³digo es obligatorio')
    if (!form.value || form.value <= 0) return toast.error('El valor debe ser positivo')
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
        toast.success(editing ? 'Descuento actualizado' : 'Descuento creado')
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
    else { toast.success('Descuento eliminado'); setDeleteId(null); load() }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return
    const res = await bulkDeleteDiscounts(Array.from(selected))
    if (res.error) toast.error(res.error)
    else { toast.success(`${selected.size} descuentos eliminados`); setSelected(new Set()); load() }
  }

  async function handleBulkToggle(active: boolean) {
    if (selected.size === 0) return
    const res = await bulkUpdateDiscounts(Array.from(selected), { active })
    if (res.error) toast.error(res.error)
    else { toast.success(`${selected.size} descuentos actualizados`); setSelected(new Set()); load() }
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
          <h1 className="text-2xl font-display tracking-wider text-foreground">Descuentos</h1>
          <p className="text-sm text-muted-foreground mt-1">Crea y gestiona descuentos promocionales</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true) }}>
          <Plus size={16} className="mr-2" /> AÃ±adir descuento
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total de descuentos</CardTitle>
            <Percent size={14} className="text-muted-foreground/60" />
          </CardHeader>
          <CardContent><div className="text-xl font-semibold">{data.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Activos</CardTitle>
            <Tag size={14} className="text-admin-success" />
          </CardHeader>
          <CardContent><div className="text-xl font-semibold text-admin-success">{activeCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Usos totales</CardTitle>
            <Calendar size={14} className="text-muted-foreground/60" />
          </CardHeader>
          <CardContent><div className="text-xl font-semibold">{totalUses.toLocaleString('en-US')}</div></CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar cÃ³digos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => handleBulkToggle(true)} className="h-8 text-xs">
              <ToggleRight size={14} className="mr-1" /> Activar
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkToggle(false)} className="h-8 text-xs">
              <ToggleLeft size={14} className="mr-1" /> Desactivar
            </Button>
            <Button size="sm" variant="destructive" onClick={handleBulkDelete} className="h-8 text-xs">
              Eliminar {selected.size}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="w-8 py-3 px-2"><input type="checkbox" className="rounded border-input" /></th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">CÃ³digo</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Valor</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Compra mÃ­nima</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Usos</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Estado</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted-foreground py-12">No se encontraron descuentos</td></tr>
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
                    {d.min_purchase_cents > 0 ? fmt(d.min_purchase_cents) : 'â€”'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-xs">{d.used_count}{d.max_uses ? ` / ${d.max_uses}` : ''}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={d.active ? 'default' : 'secondary'} className="text-[10px]">
                      {d.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(d)} className="h-7 text-xs">Editar</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(d.id)} className="h-7 text-xs text-destructive">Eliminar</Button>
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
            <DialogTitle>{editing ? 'Editar descuento' : 'Nuevo descuento'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Actualiza los detalles del descuento.' : 'Crea un nuevo cÃ³digo de descuento.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="d_code">CÃ³digo *</Label>
                <Input
                  id="d_code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER20"
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="d_type">Tipo</Label>
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
                  Valor {form.type === 'percentage' ? '(%)' : '(cÃ©ntimos)'}
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
                <Label htmlFor="d_min">Compra mÃ­nima (cÃ©ntimos)</Label>
                <Input
                  id="d_min"
                  type="number"
                  min={0}
                  value={form.min_purchase_cents}
                  onChange={(e) => setForm({ ...form, min_purchase_cents: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="d_max">Usos mÃ¡ximos</Label>
                <Input
                  id="d_max"
                  type="number"
                  min={0}
                  value={form.max_uses ?? ''}
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Ilimitado"
                />
              </div>
              <div>
                <Label htmlFor="d_starts">Comienza el</Label>
                <Input
                  id="d_starts"
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="d_expires">Expira el</Label>
                <Input
                  id="d_expires"
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="d_desc">DescripciÃ³n (interna)</Label>
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
                <Label htmlFor="d_active" className="mb-0">Activo</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar descuento</DialogTitle>
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
