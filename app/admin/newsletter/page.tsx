'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import {
  useReactTable, getCoreRowModel, getPaginationRowModel,
  getSortedRowModel, getFilteredRowModel, flexRender,
  type SortingState, type ColumnDef,
} from '@tanstack/react-table'
import {
  Search, Mail, Trash2, Download, ArrowUpDown, Keyboard, Plus,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { getSubscribers, deleteSubscriber, updateSubscriberStatus, bulkDeleteSubscribers, createSubscriber } from '@/lib/admin/newsletter'
import type { NewsletterSubscriber } from '@/lib/admin/types'
import { toast } from 'sonner'
import DataTableViewOptions from '@/components/admin/DataTableViewOptions'
import DataTablePagination from '@/components/admin/DataTablePagination'
import RowContextMenu from '@/components/admin/RowContextMenu'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

export default function NewsletterPage() {
  const [data, setData] = useState<NewsletterSubscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'subscribed_at', desc: true }])
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unsubscribed'>('all')
  const [rowSelection, setRowSelection] = useState({})
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [showAddSubscriber, setShowAddSubscriber] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [addingSubscriber, setAddingSubscriber] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  async function load() {
    try {
      const subs = await getSubscribers()
      setData(subs)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useKeyboardShortcuts({
    'k': () => searchRef.current?.focus(),
    'Escape': () => { setShowShortcuts(false); setBulkDeleteOpen(false) },
    '?': () => setShowShortcuts(true),
  })

  const selectedIds = useMemo(() => Object.keys(rowSelection), [rowSelection])
  const selectedCount = selectedIds.length

  async function handleDelete(id: string) {
    const res = await deleteSubscriber(id)
    if (res.error) { toast.error(res.error) }
    else {
      toast.success('Subscriber removed')
      setData((prev) => prev.filter((s) => s.id !== id))
    }
  }

  async function handleBulkDelete() {
    const res = await bulkDeleteSubscribers(selectedIds)
    if (res.error) { toast.error(res.error) }
    else {
      toast.success(`${selectedIds.length} subscribers removed`)
      setData((prev) => prev.filter((s) => !selectedIds.includes(s.id)))
      setRowSelection({})
    }
    setBulkDeleteOpen(false)
  }

  async function handleAddSubscriber(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.trim()) return toast.error('Email required')
    setAddingSubscriber(true)
    const res = await createSubscriber(newEmail)
    if (res.error) { toast.error(res.error) }
    else {
      toast.success('Subscriber added')
      setNewEmail('')
      setShowAddSubscriber(false)
      load()
    }
    setAddingSubscriber(false)
  }

  async function handleToggleStatus(sub: NewsletterSubscriber) {
    const newStatus = sub.status === 'active' ? 'unsubscribed' : 'active'
    const res = await updateSubscriberStatus(sub.id, newStatus)
    if (res.error) { toast.error(res.error) }
    else {
      toast.success(`Subscriber ${newStatus === 'active' ? 'reactivated' : 'unsubscribed'}`)
      setData((prev) => prev.map((s) => s.id === sub.id ? { ...s, status: newStatus, unsubscribed_at: newStatus === 'unsubscribed' ? new Date().toISOString() : null } : s))
    }
  }

  const filteredData = useMemo(() => {
    let result = [...data]
    if (statusFilter !== 'all') result = result.filter((s) => s.status === statusFilter)
    return result
  }, [data, statusFilter])

  const activeCount = data.filter((s) => s.status === 'active').length
  const totalCount = data.length

  function exportCsv() {
    const csv = [['Email', 'Name', 'Status', 'Subscribed At'].join(',')]
    for (const sub of data) {
      csv.push([sub.email, sub.name ?? '', sub.status, new Date(sub.subscribed_at).toISOString()].join(','))
    }
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns: ColumnDef<NewsletterSubscriber>[] = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <input type="checkbox" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} className="rounded border-input" />
      ),
      cell: ({ row }) => (
        <input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} className="rounded border-input" />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 text-xs font-medium">
          Email <ArrowUpDown size={12} />
        </button>
      ),
      cell: ({ getValue }) => <span className="font-medium text-sm">{String(getValue())}</span>,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 text-xs font-medium">
          Name <ArrowUpDown size={12} />
        </button>
      ),
      cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{String(getValue() ?? 'â€”')}</span>,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 text-xs font-medium">
          Status <ArrowUpDown size={12} />
        </button>
      ),
      cell: ({ getValue }) => {
        const status = String(getValue())
        return (
          <Badge variant="outline" className={status === 'active' ? 'bg-admin-success/10 text-admin-success border-admin-success/20' : 'bg-admin-slate/10 text-admin-slate border-admin-slate/20'}>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'subscribed_at',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 text-xs font-medium">
          Subscribed <ArrowUpDown size={12} />
        </button>
      ),
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(String(getValue())).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(row.original)} className="h-7 text-[10px]">
            {row.original.status === 'active' ? 'Unsub' : 'Reactivate'}
          </Button>
        </div>
      ),
    },
  ], [])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
    getRowId: (originalRow: NewsletterSubscriber) => originalRow.id,
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
        </div>
        <div className="h-96 bg-muted rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif tracking-wider text-foreground">Newsletter</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage email subscribers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1 h-8 text-xs" onClick={() => setShowShortcuts(true)}>
            <Keyboard size={14} /> Shortcuts
          </Button>
          <Button variant="default" size="sm" className="gap-1 h-8 text-xs" onClick={() => setShowAddSubscriber(true)}>
            <Plus size={14} /> Add Subscriber
          </Button>
          <Button variant="outline" onClick={exportCsv} className="gap-2"><Download size={14} /> Export CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Mail size={20} className="text-admin-success" />
          <div><p className="text-2xl font-semibold">{activeCount}</p><p className="text-xs text-muted-foreground">Active Subscribers</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Mail size={20} className="text-muted-foreground" />
          <div><p className="text-2xl font-semibold">{totalCount}</p><p className="text-xs text-muted-foreground">Total Subscribers</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Mail size={20} className="text-admin-warning" />
          <div><p className="text-2xl font-semibold">{totalCount - activeCount}</p><p className="text-xs text-muted-foreground">Unsubscribed</p></div>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input ref={searchRef} placeholder="Search by email or name..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="pl-9" />
        </div>
        <DataTableViewOptions table={table} />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'unsubscribed')}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-accent/30 rounded-lg border border-border">
          <span className="text-sm font-medium">{selectedCount} selected</span>
          <div className="flex-1" />
          <Button variant="destructive" size="sm" className="h-8 text-xs gap-1" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 size={12} /> Delete
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <RowContextMenu key={row.id} actions={[
                  { label: row.original.status === 'active' ? 'Unsubscribe' : 'Reactivate', icon: <Mail size={14} />, onClick: () => handleToggleStatus(row.original) },
                  { label: 'Delete', icon: <Trash2 size={14} />, onClick: () => handleDelete(row.original.id), destructive: true },
                ]}>
                  <TableRow data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                </RowContextMenu>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <TableRow><TableCell colSpan={columns.length} className="text-center text-muted-foreground py-12">No subscribers found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DataTablePagination table={table} />

      <Dialog open={showAddSubscriber} onOpenChange={(o) => !o && setShowAddSubscriber(false)}>
        <DialogContent>
          <form onSubmit={handleAddSubscriber}>
            <DialogHeader>
              <DialogTitle>Add Subscriber</DialogTitle>
              <DialogDescription>Manually add an email to the subscriber list.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                type="email"
                placeholder="email@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddSubscriber(false)}>Cancel</Button>
              <Button type="submit" disabled={addingSubscriber}>
                {addingSubscriber ? 'Adding...' : 'Add Subscriber'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove {selectedCount} Subscribers</DialogTitle><DialogDescription>Are you sure? This cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDelete}>Remove {selectedCount}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent>
          <DialogHeader><DialogTitle>Keyboard Shortcuts</DialogTitle><DialogDescription>Available shortcuts for the newsletter page.</DialogDescription></DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Focus search</span><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Ctrl+K</kbd></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Close dialogs</span><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Esc</kbd></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Show shortcuts</span><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">?</kbd></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

