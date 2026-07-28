'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import {
  FileText, Plus, Trash2, Edit, Image as ImageIcon, ExternalLink,
  Layout, Menu, ShoppingBag, Globe, Quote, Video, Code, Type,
  Search, ArrowUpDown, Keyboard, FilterX,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  getHero, updateHero,
  getBlocks, createBlock, updateBlock, deleteBlock,
  getPages, createPage, updatePage, deletePage,
  getNavMenus, createNavMenu, updateNavMenu, deleteNavMenu,
  getFooter, updateFooter,
  getSeoDefaults, updateSeoDefault, seedSeoDefaults,
} from '@/lib/admin/content'
import type {
  HomepageHero, EditorialBlock, LandingPage, NavMenu, FooterSettings, SeoDefaults,
} from '@/lib/admin/types'
import { toast } from 'sonner'
import SimplePagination from '@/components/admin/SimplePagination'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import MediaPicker from '@/components/admin/MediaPicker'

type TabValue = 'hero' | 'blocks' | 'pages' | 'nav' | 'footer' | 'seo'

const BLOCK_ICONS: Record<string, any> = {
  richtext: Type, image: ImageIcon, video: Video, quote: Quote, divider: Layout, custom_html: Code,
}

const PAGE_SIZE = 10

type SortDir = 'asc' | 'desc'

function sortBy<T>(arr: T[], key: keyof T, dir: SortDir): T[] {
  return [...arr].sort((a, b) => {
    const av = String(a[key] ?? '')
    const bv = String(b[key] ?? '')
    return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
  })
}

export default function ContentPage() {
  const [tab, setTab] = useState<TabValue>('hero')
  const [loading, setLoading] = useState(true)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // ── Hero State ──
  const [hero, setHero] = useState<HomepageHero | null>(null)
  const [heroForm, setHeroForm] = useState({ headline: '', subheadline: '', cta_text: '', cta_link: '', secondary_cta_text: '', secondary_cta_link: '', overlay_opacity: 0.3, active: true })
  const [heroBgImage, setHeroBgImage] = useState<File | null>(null)
  const [heroBgPreview, setHeroBgPreview] = useState('')
  const [heroMediaPicker, setHeroMediaPicker] = useState(false)

  // ── Blocks State ──
  const [blocks, setBlocks] = useState<EditorialBlock[]>([])
  const [blockDialog, setBlockDialog] = useState(false)
  const [editBlock, setEditBlock] = useState<EditorialBlock | null>(null)
  const [blockForm, setBlockForm] = useState({ title: '', type: 'richtext' as string, active: true, body: '', alt: '', caption: '', video_url: '', video_caption: '', quote_text: '', quote_author: '', html: '' })
  const [blockImage, setBlockImage] = useState<File | null>(null)
  const [blockImgPreview, setBlockImgPreview] = useState('')
  const [blockMediaPicker, setBlockMediaPicker] = useState(false)
  const [deleteBlockId, setDeleteBlockId] = useState<string | null>(null)
  const [blocksSearch, setBlocksSearch] = useState('')
  const [blocksSortKey, setBlocksSortKey] = useState<keyof EditorialBlock>('created_at')
  const [blocksSortDir, setBlocksSortDir] = useState<SortDir>('desc')
  const [blocksPage, setBlocksPage] = useState(0)

  // ── Pages State ──
  const [pages, setPages] = useState<LandingPage[]>([])
  const [pageDialog, setPageDialog] = useState(false)
  const [editPage, setEditPage] = useState<LandingPage | null>(null)
  const [pageForm, setPageForm] = useState({ title: '', slug: '', description: '', seo_title: '', seo_description: '', active: true })
  const [pageBlocks, setPageBlocks] = useState<string>('[]')
  const [deletePageId, setDeletePageId] = useState<string | null>(null)
  const [pagesSearch, setPagesSearch] = useState('')
  const [pagesSortKey, setPagesSortKey] = useState<keyof LandingPage>('created_at')
  const [pagesSortDir, setPagesSortDir] = useState<SortDir>('desc')
  const [pagesPage, setPagesPage] = useState(0)

  // ── Nav State ──
  const [navs, setNavs] = useState<NavMenu[]>([])
  const [navDialog, setNavDialog] = useState(false)
  const [editNav, setEditNav] = useState<NavMenu | null>(null)
  const [navForm, setNavForm] = useState({ name: '' })
  const [navItems, setNavItems] = useState<string>('[]')
  const [deleteNavId, setDeleteNavId] = useState<string | null>(null)
  const [navsPage, setNavsPage] = useState(0)

  // ── Footer State ──
  const [footer, setFooter] = useState<FooterSettings | null>(null)
  const [footerForm, setFooterForm] = useState({ copyright_text: '', newsletter_text: '' })
  const [footerColumns, setFooterColumns] = useState<string>('[]')
  const [footerSocials, setFooterSocials] = useState<string>('[]')

  // ── SEO State ──
  const [seo, setSeo] = useState<SeoDefaults[]>([])
  const [editingSeo, setEditingSeo] = useState<string | null>(null)
  const [seoForm, setSeoForm] = useState({ title: '', description: '', og_image: '' })

  async function load() {
    setLoading(true)
    try {
      const [h, b, p, n, f, s] = await Promise.all([
        getHero(), getBlocks(), getPages(), getNavMenus(), getFooter(), getSeoDefaults(),
      ])
      setHero(h); setBlocks(b); setPages(p); setNavs(n); setFooter(f); setSeo(s)
      if (h) setHeroForm({ headline: h.headline, subheadline: h.subheadline ?? '', cta_text: h.cta_text ?? '', cta_link: h.cta_link ?? '', secondary_cta_text: h.secondary_cta_text ?? '', secondary_cta_link: h.secondary_cta_link ?? '', overlay_opacity: h.overlay_opacity, active: h.active })
      if (h) setHeroBgPreview(h.background_image ?? '')
      if (f) setFooterForm({ copyright_text: f.copyright_text ?? '', newsletter_text: f.newsletter_text ?? '' })
      if (f) { setFooterColumns(JSON.stringify(f.columns, null, 2)); setFooterSocials(JSON.stringify(f.social_links, null, 2)) }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useKeyboardShortcuts({
    'k': () => searchRef.current?.focus(),
    'Escape': () => { setShowShortcuts(false) },
    '?': () => setShowShortcuts(true),
  })

  // ── Hero Handlers ──
  async function saveHero(e: React.FormEvent) {
    e.preventDefault()
    try {
      const fd = new FormData()
      fd.append('headline', heroForm.headline)
      fd.append('subheadline', heroForm.subheadline)
      fd.append('cta_text', heroForm.cta_text)
      fd.append('cta_link', heroForm.cta_link)
      fd.append('secondary_cta_text', heroForm.secondary_cta_text)
      fd.append('secondary_cta_link', heroForm.secondary_cta_link)
      fd.append('overlay_opacity', String(heroForm.overlay_opacity))
      fd.append('active', String(heroForm.active))
      if (heroBgImage) fd.append('image', heroBgImage)
      else if (heroBgPreview) fd.append('background_image', heroBgPreview)
      const res = await updateHero(fd)
      if (res.error) toast.error(res.error)
      else { toast.success('Hero updated'); load() }
    } catch (e: any) { toast.error(e.message || 'Failed to save hero') }
  }

  // ── Block Handlers ──
  function openBlockDialog(block?: EditorialBlock) {
    if (block) {
      setEditBlock(block)
      setBlockForm({
        title: block.title, type: block.type, active: block.active,
        body: block.content?.body ?? '', alt: block.content?.alt ?? '', caption: block.content?.caption ?? '',
        video_url: block.content?.url ?? '', video_caption: block.content?.caption ?? '',
        quote_text: block.content?.text ?? '', quote_author: block.content?.author ?? '',
        html: block.content?.html ?? '',
      })
      setBlockImgPreview(block.content?.src ?? '')
    } else {
      setEditBlock(null)
      setBlockForm({ title: '', type: 'richtext', active: true, body: '', alt: '', caption: '', video_url: '', video_caption: '', quote_text: '', quote_author: '', html: '' })
      setBlockImgPreview('')
    }
    setBlockImage(null)
    setBlockDialog(true)
  }

  async function saveBlock(e: React.FormEvent) {
    e.preventDefault()
    if (!blockForm.title.trim()) { toast.error('Title required'); return }
    const fd = new FormData()
    fd.append('title', blockForm.title)
    fd.append('type', blockForm.type)
    fd.append('active', String(blockForm.active))
    fd.append('body', blockForm.body)
    fd.append('alt', blockForm.alt)
    fd.append('caption', blockForm.caption)
    fd.append('video_url', blockForm.video_url)
    fd.append('video_caption', blockForm.video_caption)
    fd.append('quote_text', blockForm.quote_text)
    fd.append('quote_author', blockForm.quote_author)
    fd.append('html', blockForm.html)
    if (blockImage) fd.append('image', blockImage)
    if (blockImgPreview && !blockImage) fd.append('existing_src', blockImgPreview)
    const res = editBlock ? await updateBlock(editBlock.id, fd) : await createBlock(fd)
    if (res.error) toast.error(res.error)
    else { toast.success(editBlock ? 'Block updated' : 'Block created'); setBlockDialog(false); load() }
  }

  async function handleDeleteBlock(id: string) {
    const res = await deleteBlock(id)
    if (res.error) toast.error(res.error)
    else { toast.success('Block deleted'); setBlocks((prev) => prev.filter((b) => b.id !== id)) }
    setDeleteBlockId(null)
  }

  const filteredBlocks = useMemo(() => {
    let result = [...blocks]
    if (blocksSearch) result = result.filter((b) => b.title.toLowerCase().includes(blocksSearch.toLowerCase()) || b.type.toLowerCase().includes(blocksSearch.toLowerCase()))
    result = sortBy(result, blocksSortKey, blocksSortDir)
    return result
  }, [blocks, blocksSearch, blocksSortKey, blocksSortDir])

  const paginatedBlocks = useMemo(() => filteredBlocks.slice(blocksPage * PAGE_SIZE, (blocksPage + 1) * PAGE_SIZE), [filteredBlocks, blocksPage])

  function toggleBlocksSort(key: keyof EditorialBlock) {
    if (blocksSortKey === key) setBlocksSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setBlocksSortKey(key); setBlocksSortDir('asc') }
    setBlocksPage(0)
  }

  // ── Page Handlers ──
  function openPageDialog(page?: LandingPage) {
    if (page) {
      setEditPage(page)
      setPageForm({ title: page.title, slug: page.slug, description: page.description ?? '', seo_title: page.seo_title ?? '', seo_description: page.seo_description ?? '', active: page.active })
      setPageBlocks(JSON.stringify(page.blocks ?? [], null, 2))
    } else {
      setEditPage(null)
      setPageForm({ title: '', slug: '', description: '', seo_title: '', seo_description: '', active: true })
      setPageBlocks('[]')
    }
    setPageDialog(true)
  }

  async function savePage(e: React.FormEvent) {
    e.preventDefault()
    if (!pageForm.title.trim()) { toast.error('Title required'); return }
    const fd = new FormData()
    for (const [k, v] of Object.entries(pageForm)) fd.append(k, String(v))
    let parsedBlocks: any[]
    try { parsedBlocks = JSON.parse(pageBlocks); fd.append('blocks', JSON.stringify(parsedBlocks)) }
    catch { toast.error('Invalid blocks JSON'); return }
    const res = editPage ? await updatePage(editPage.id, fd) : await createPage(fd)
    if (res.error) toast.error(res.error)
    else { toast.success(editPage ? 'Page updated' : 'Page created'); setPageDialog(false); load() }
  }

  async function handleDeletePage(id: string) {
    const res = await deletePage(id)
    if (res.error) toast.error(res.error)
    else { toast.success('Page deleted'); setPages((prev) => prev.filter((p) => p.id !== id)) }
    setDeletePageId(null)
  }

  const filteredPages = useMemo(() => {
    let result = [...pages]
    if (pagesSearch) result = result.filter((p) => p.title.toLowerCase().includes(pagesSearch.toLowerCase()) || p.slug.toLowerCase().includes(pagesSearch.toLowerCase()))
    result = sortBy(result, pagesSortKey, pagesSortDir)
    return result
  }, [pages, pagesSearch, pagesSortKey, pagesSortDir])

  const paginatedPages = useMemo(() => filteredPages.slice(pagesPage * PAGE_SIZE, (pagesPage + 1) * PAGE_SIZE), [filteredPages, pagesPage])

  function togglePagesSort(key: keyof LandingPage) {
    if (pagesSortKey === key) setPagesSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setPagesSortKey(key); setPagesSortDir('asc') }
    setPagesPage(0)
  }

  // ── Nav Handlers ──
  function openNavDialog(nav?: NavMenu) {
    if (nav) {
      setEditNav(nav); setNavForm({ name: nav.name })
      setNavItems(JSON.stringify(nav.items ?? [], null, 2))
    } else {
      setEditNav(null); setNavForm({ name: '' }); setNavItems('[]')
    }
    setNavDialog(true)
  }

  async function saveNav(e: React.FormEvent) {
    e.preventDefault()
    if (!navForm.name.trim()) { toast.error('Name required'); return }
    const fd = new FormData(); fd.append('name', navForm.name)
    try { const parsed = JSON.parse(navItems); fd.append('items', JSON.stringify(parsed)) }
    catch { toast.error('Invalid items JSON'); return }
    const res = editNav ? await updateNavMenu(editNav.id, fd) : await createNavMenu(fd)
    if (res.error) toast.error(res.error)
    else { toast.success(editNav ? 'Menu updated' : 'Menu created'); setNavDialog(false); load() }
  }

  async function handleDeleteNav(id: string) {
    const res = await deleteNavMenu(id)
    if (res.error) toast.error(res.error)
    else { toast.success('Menu deleted'); setNavs((prev) => prev.filter((n) => n.id !== id)) }
    setDeleteNavId(null)
  }

  const paginatedNavs = useMemo(() => {
    const sorted = [...navs].sort((a, b) => a.name.localeCompare(b.name))
    return sorted.slice(navsPage * PAGE_SIZE, (navsPage + 1) * PAGE_SIZE)
  }, [navs, navsPage])

  // ── Footer Handler ──
  async function saveFooter(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.append('copyright_text', footerForm.copyright_text)
    fd.append('newsletter_text', footerForm.newsletter_text)
    try { JSON.parse(footerColumns); fd.append('columns', footerColumns) }
    catch { toast.error('Invalid columns JSON'); return }
    try { JSON.parse(footerSocials); fd.append('social_links', footerSocials) }
    catch { toast.error('Invalid social links JSON'); return }
    const res = await updateFooter(fd)
    if (res.error) toast.error(res.error)
    else { toast.success('Footer updated'); load() }
  }

  // ── SEO Handlers ──
  async function handleSaveSeo(id: string) {
    const fd = new FormData(); fd.append('title', seoForm.title); fd.append('description', seoForm.description); fd.append('og_image', seoForm.og_image)
    const res = await updateSeoDefault(id, fd)
    if (res.error) toast.error(res.error)
    else { toast.success('SEO defaults updated'); setEditingSeo(null); load() }
  }

  async function handleSeedSeo() {
    await seedSeoDefaults(); toast.success('SEO defaults created'); load()
  }

  function SortHeader({ label, active, dir }: { label: string; active: boolean; dir: SortDir }) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium">
        {label}
        {active && <ArrowUpDown size={11} className={dir === 'desc' ? 'rotate-180' : ''} />}
      </span>
    )
  }

  if (loading) {
    return <div className="space-y-4"><div className="h-8 w-32 bg-muted rounded animate-pulse" /><div className="h-10 bg-muted rounded animate-pulse" /><div className="h-96 bg-muted rounded-lg animate-pulse" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif tracking-wider text-foreground">Content</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage site content, pages, and navigation</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1 h-8 text-xs" onClick={() => setShowShortcuts(true)}>
          <Keyboard size={14} /> Shortcuts
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList className="w-full grid grid-cols-6">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="blocks">Blocks</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="nav">Navigation</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* ─── HERO ─── */}
        <TabsContent value="hero" className="space-y-4 pt-4">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={saveHero} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Background Image</Label>
                    <div className="mt-1 flex gap-3 items-start">
                      {(heroBgPreview || heroBgImage) && (
                        <div className="w-48 h-28 rounded border border-border overflow-hidden flex-shrink-0">
                          <img src={heroBgImage ? URL.createObjectURL(heroBgImage) : heroBgPreview} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col gap-2">
                        <label className="h-14 rounded border border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-accent/10 transition-colors">
                          <span className="text-xs text-muted-foreground">{heroBgImage || heroBgPreview ? 'Change' : 'Upload'} image</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setHeroBgImage(f) }} />
                        </label>
                        <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => setHeroMediaPicker(true)}>
                          <ImageIcon size={12} className="mr-1.5" /> Browse Media
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div><Label htmlFor="headline">Headline *</Label><Input id="headline" value={heroForm.headline} onChange={(e) => setHeroForm({ ...heroForm, headline: e.target.value })} /></div>
                  <div><Label htmlFor="subheadline">Subheadline</Label><Input id="subheadline" value={heroForm.subheadline} onChange={(e) => setHeroForm({ ...heroForm, subheadline: e.target.value })} /></div>
                  <div><Label htmlFor="cta_text">CTA Text</Label><Input id="cta_text" value={heroForm.cta_text} onChange={(e) => setHeroForm({ ...heroForm, cta_text: e.target.value })} placeholder="Shop Now" /></div>
                  <div><Label htmlFor="cta_link">CTA Link</Label><Input id="cta_link" value={heroForm.cta_link} onChange={(e) => setHeroForm({ ...heroForm, cta_link: e.target.value })} placeholder="/collections/new" /></div>
                  <div><Label htmlFor="secondary_cta_text">Secondary CTA Text</Label><Input id="secondary_cta_text" value={heroForm.secondary_cta_text} onChange={(e) => setHeroForm({ ...heroForm, secondary_cta_text: e.target.value })} /></div>
                  <div><Label htmlFor="secondary_cta_link">Secondary CTA Link</Label><Input id="secondary_cta_link" value={heroForm.secondary_cta_link} onChange={(e) => setHeroForm({ ...heroForm, secondary_cta_link: e.target.value })} /></div>
                  <div><Label htmlFor="overlay">Overlay Opacity</Label><Input id="overlay" type="number" min="0" max="1" step="0.1" value={heroForm.overlay_opacity} onChange={(e) => setHeroForm({ ...heroForm, overlay_opacity: parseFloat(e.target.value) || 0 })} /></div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 pb-1"><input type="checkbox" checked={heroForm.active} onChange={(e) => setHeroForm({ ...heroForm, active: e.target.checked })} className="rounded border-input" /><span className="text-sm">Active</span></label>
                  </div>
                </div>
                <div className="flex justify-end"><Button type="submit">Save Hero</Button></div>
              </form>
            </CardContent>
          </Card>
          <MediaPicker
            open={heroMediaPicker}
            onClose={() => setHeroMediaPicker(false)}
            onSelect={(url) => { setHeroBgPreview(url); setHeroBgImage(null) }}
          />
        </TabsContent>

        {/* ─── BLOCKS ─── */}
        <TabsContent value="blocks" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input ref={searchRef} placeholder="Search blocks..." value={blocksSearch} onChange={(e) => { setBlocksSearch(e.target.value); setBlocksPage(0) }} className="pl-9" />
            </div>
            <Button onClick={() => openBlockDialog()}><Plus size={16} className="mr-2" /> Add Block</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><button onClick={() => toggleBlocksSort('title')} className="flex items-center gap-1"><SortHeader label="Title" active={blocksSortKey === 'title'} dir={blocksSortDir} /></button></TableHead>
                    <TableHead><button onClick={() => toggleBlocksSort('type')} className="flex items-center gap-1"><SortHeader label="Type" active={blocksSortKey === 'type'} dir={blocksSortDir} /></button></TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead><button onClick={() => toggleBlocksSort('created_at')} className="flex items-center gap-1"><SortHeader label="Created" active={blocksSortKey === 'created_at'} dir={blocksSortDir} /></button></TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBlocks.map((b) => {
                    const BlockIcon = BLOCK_ICONS[b.type] ?? FileText
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium text-sm flex items-center gap-2">
                          <BlockIcon size={14} className="text-muted-foreground" />{b.title}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground capitalize">{b.type}</TableCell>
                        <TableCell><Badge variant="outline" className={b.active ? 'bg-admin-success/10 text-admin-success' : 'bg-admin-slate/10 text-admin-slate'}>{b.active ? 'Active' : 'Inactive'}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</TableCell>
                        <TableCell><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => openBlockDialog(b)} className="h-7 w-7 p-0"><Edit size={12} /></Button><Button variant="ghost" size="sm" onClick={() => setDeleteBlockId(b.id)} className="h-7 w-7 p-0 text-destructive"><Trash2 size={12} /></Button></div></TableCell>
                      </TableRow>
                    )
                  })}
                  {paginatedBlocks.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">No blocks found</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <SimplePagination page={blocksPage} totalPages={Math.ceil(filteredBlocks.length / PAGE_SIZE)} totalItems={filteredBlocks.length} onPageChange={setBlocksPage} />

          <Dialog open={blockDialog} onOpenChange={(o) => !o && setBlockDialog(false)}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editBlock ? 'Edit Block' : 'New Block'}</DialogTitle><DialogDescription>Create a reusable content block.</DialogDescription></DialogHeader>
              <form onSubmit={saveBlock} className="space-y-3">
                <div><Label>Title *</Label><Input value={blockForm.title} onChange={(e) => setBlockForm({ ...blockForm, title: e.target.value })} /></div>
                <div><Label>Type</Label>
                  <Select value={blockForm.type} onValueChange={(v) => setBlockForm({ ...blockForm, type: v, body: '', alt: '', caption: '', video_url: '', video_caption: '', quote_text: '', quote_author: '', html: '' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="richtext">Rich Text</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="quote">Quote</SelectItem>
                      <SelectItem value="divider">Divider</SelectItem>
                      <SelectItem value="custom_html">Custom HTML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {blockForm.type === 'richtext' && <div><Label>Body (HTML)</Label><textarea rows={6} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" value={blockForm.body} onChange={(e) => setBlockForm({ ...blockForm, body: e.target.value })} placeholder="<p>Rich text content...</p>" /></div>}
                {blockForm.type === 'image' && <>
                  <div><Label>Image</Label><div className="flex gap-2 mt-1 items-start">{(blockImgPreview || blockImage) && <div className="w-20 h-20 rounded border overflow-hidden flex-shrink-0"><img src={blockImage ? URL.createObjectURL(blockImage) : blockImgPreview} alt="" className="w-full h-full object-cover" /></div>}<div className="flex flex-col gap-1.5 flex-1"><label className="h-10 rounded border border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-accent/10 transition-colors"><span className="text-xs text-muted-foreground">{blockImage || blockImgPreview ? 'Change' : 'Upload'}</span><input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setBlockImage(f) }} /></label><Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => setBlockMediaPicker(true)}><ImageIcon size={11} className="mr-1.5" /> Browse Media</Button></div></div></div>
                  <div><Label>Alt Text</Label><Input value={blockForm.alt} onChange={(e) => setBlockForm({ ...blockForm, alt: e.target.value })} /></div>
                  <div><Label>Caption</Label><Input value={blockForm.caption} onChange={(e) => setBlockForm({ ...blockForm, caption: e.target.value })} /></div>
                </>}
                {blockForm.type === 'video' && <><div><Label>Video URL</Label><Input value={blockForm.video_url} onChange={(e) => setBlockForm({ ...blockForm, video_url: e.target.value })} placeholder="https://youtube.com/..." /></div><div><Label>Caption</Label><Input value={blockForm.video_caption} onChange={(e) => setBlockForm({ ...blockForm, video_caption: e.target.value })} /></div></>}
                {blockForm.type === 'quote' && <><div><Label>Quote Text</Label><textarea rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={blockForm.quote_text} onChange={(e) => setBlockForm({ ...blockForm, quote_text: e.target.value })} /></div><div><Label>Author</Label><Input value={blockForm.quote_author} onChange={(e) => setBlockForm({ ...blockForm, quote_author: e.target.value })} /></div></>}
                {blockForm.type === 'custom_html' && <div><Label>HTML</Label><textarea rows={6} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" value={blockForm.html} onChange={(e) => setBlockForm({ ...blockForm, html: e.target.value })} /></div>}
                <label className="flex items-center gap-2"><input type="checkbox" checked={blockForm.active} onChange={(e) => setBlockForm({ ...blockForm, active: e.target.checked })} className="rounded border-input" /><span className="text-sm">Active</span></label>
                <DialogFooter><Button type="button" variant="outline" onClick={() => setBlockDialog(false)}>Cancel</Button><Button type="submit">Save</Button></DialogFooter>
              </form>
              <MediaPicker
                open={blockMediaPicker}
                onClose={() => setBlockMediaPicker(false)}
                onSelect={(url) => { setBlockImgPreview(url); setBlockImage(null) }}
              />
            </DialogContent>
          </Dialog>
          <Dialog open={!!deleteBlockId} onOpenChange={(o) => !o && setDeleteBlockId(null)}>
            <DialogContent><DialogHeader><DialogTitle>Delete Block</DialogTitle><DialogDescription>Are you sure? This cannot be undone.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteBlockId(null)}>Cancel</Button><Button variant="destructive" onClick={() => deleteBlockId && handleDeleteBlock(deleteBlockId)}>Delete</Button></DialogFooter></DialogContent>
          </Dialog>
        </TabsContent>

        {/* ─── PAGES ─── */}
        <TabsContent value="pages" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search pages..." value={pagesSearch} onChange={(e) => { setPagesSearch(e.target.value); setPagesPage(0) }} className="pl-9" />
            </div>
            <Button onClick={() => openPageDialog()}><Plus size={16} className="mr-2" /> Add Page</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><button onClick={() => togglePagesSort('title')} className="flex items-center gap-1"><SortHeader label="Title" active={pagesSortKey === 'title'} dir={pagesSortDir} /></button></TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Blocks</TableHead>
                    <TableHead><button onClick={() => togglePagesSort('created_at')} className="flex items-center gap-1"><SortHeader label="Created" active={pagesSortKey === 'created_at'} dir={pagesSortDir} /></button></TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPages.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-sm">{p.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">/{p.slug}</TableCell>
                      <TableCell><Badge variant="outline" className={p.active ? 'bg-admin-success/10 text-admin-success' : 'bg-admin-slate/10 text-admin-slate'}>{p.active ? 'Active' : 'Draft'}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{(p.blocks ?? []).length} block(s)</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                      <TableCell><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => openPageDialog(p)} className="h-7 w-7 p-0"><Edit size={12} /></Button><Button variant="ghost" size="sm" onClick={() => setDeletePageId(p.id)} className="h-7 w-7 p-0 text-destructive"><Trash2 size={12} /></Button></div></TableCell>
                    </TableRow>
                  ))}
                  {paginatedPages.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">No pages found</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <SimplePagination page={pagesPage} totalPages={Math.ceil(filteredPages.length / PAGE_SIZE)} totalItems={filteredPages.length} onPageChange={setPagesPage} />

          <Dialog open={pageDialog} onOpenChange={(o) => !o && setPageDialog(false)}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editPage ? 'Edit Page' : 'New Page'}</DialogTitle><DialogDescription>Create a landing page with composed blocks.</DialogDescription></DialogHeader>
              <form onSubmit={savePage} className="space-y-3">
                <div><Label>Title *</Label><Input value={pageForm.title} onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })} /></div>
                <div><Label>Slug</Label><Input value={pageForm.slug} onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })} placeholder="my-custom-page" /></div>
                <div><Label>Description</Label><textarea rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={pageForm.description} onChange={(e) => setPageForm({ ...pageForm, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3"><div><Label>SEO Title</Label><Input value={pageForm.seo_title} onChange={(e) => setPageForm({ ...pageForm, seo_title: e.target.value })} /></div><div><Label>SEO Description</Label><Input value={pageForm.seo_description} onChange={(e) => setPageForm({ ...pageForm, seo_description: e.target.value })} /></div></div>
                <div><Label>Blocks (JSON array of {`{ editorial_block_id, sort_order }`})</Label><textarea rows={5} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" value={pageBlocks} onChange={(e) => setPageBlocks(e.target.value)} /></div>
                <label className="flex items-center gap-2"><input type="checkbox" checked={pageForm.active} onChange={(e) => setPageForm({ ...pageForm, active: e.target.checked })} className="rounded border-input" /><span className="text-sm">Active</span></label>
                <DialogFooter><Button type="button" variant="outline" onClick={() => setPageDialog(false)}>Cancel</Button><Button type="submit">Save</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={!!deletePageId} onOpenChange={(o) => !o && setDeletePageId(null)}>
            <DialogContent><DialogHeader><DialogTitle>Delete Page</DialogTitle><DialogDescription>Are you sure? This cannot be undone.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeletePageId(null)}>Cancel</Button><Button variant="destructive" onClick={() => deletePageId && handleDeletePage(deletePageId)}>Delete</Button></DialogFooter></DialogContent>
          </Dialog>
        </TabsContent>

        {/* ─── NAV ─── */}
        <TabsContent value="nav" className="space-y-4 pt-4">
          <div className="flex justify-end"><Button onClick={() => openNavDialog()}><Plus size={16} className="mr-2" /> Add Menu</Button></div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Name</TableHead><TableHead>Items</TableHead><TableHead>Created</TableHead><TableHead className="w-20" /></TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedNavs.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="font-medium text-sm capitalize">{n.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{(n.items ?? []).length} item(s)</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</TableCell>
                      <TableCell><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => openNavDialog(n)} className="h-7 w-7 p-0"><Edit size={12} /></Button><Button variant="ghost" size="sm" onClick={() => setDeleteNavId(n.id)} className="h-7 w-7 p-0 text-destructive"><Trash2 size={12} /></Button></div></TableCell>
                    </TableRow>
                  ))}
                  {paginatedNavs.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-12">No menus found</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <SimplePagination page={navsPage} totalPages={Math.ceil(navs.length / PAGE_SIZE)} totalItems={navs.length} onPageChange={setNavsPage} />

          <Dialog open={navDialog} onOpenChange={(o) => !o && setNavDialog(false)}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editNav ? 'Edit Menu' : 'New Menu'}</DialogTitle><DialogDescription>Configure navigation menu items as JSON.</DialogDescription></DialogHeader>
              <form onSubmit={saveNav} className="space-y-3">
                <div><Label>Name *</Label><Input value={navForm.name} onChange={(e) => setNavForm({ ...navForm, name: e.target.value })} placeholder="main" /></div>
                <div><Label>Items (JSON)</Label>
                  <p className="text-[10px] text-muted-foreground mb-1">Array of {`{ id, label, url, type: "link|collection|page|custom", children?, open_in_new? }`}</p>
                  <textarea rows={10} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" value={navItems} onChange={(e) => setNavItems(e.target.value)} />
                </div>
                <DialogFooter><Button type="button" variant="outline" onClick={() => setNavDialog(false)}>Cancel</Button><Button type="submit">Save</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={!!deleteNavId} onOpenChange={(o) => !o && setDeleteNavId(null)}>
            <DialogContent><DialogHeader><DialogTitle>Delete Menu</DialogTitle><DialogDescription>Are you sure? This cannot be undone.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteNavId(null)}>Cancel</Button><Button variant="destructive" onClick={() => deleteNavId && handleDeleteNav(deleteNavId)}>Delete</Button></DialogFooter></DialogContent>
          </Dialog>
        </TabsContent>

        {/* ─── FOOTER ─── */}
        <TabsContent value="footer" className="space-y-4 pt-4">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={saveFooter} className="space-y-4">
                <div><Label>Copyright Text</Label><Input value={footerForm.copyright_text} onChange={(e) => setFooterForm({ ...footerForm, copyright_text: e.target.value })} placeholder="© 2026 Favsupply. All rights reserved." /></div>
                <div><Label>Newsletter CTA Text</Label><Input value={footerForm.newsletter_text} onChange={(e) => setFooterForm({ ...footerForm, newsletter_text: e.target.value })} placeholder="Join our newsletter" /></div>
                <div><Label>Columns (JSON)</Label>
                  <p className="text-[10px] text-muted-foreground mb-1">Array of {`{ title, links: [{ label, url }] }`}</p>
                  <textarea rows={6} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" value={footerColumns} onChange={(e) => setFooterColumns(e.target.value)} />
                </div>
                <div><Label>Social Links (JSON)</Label>
                  <p className="text-[10px] text-muted-foreground mb-1">Array of {`{ platform, url }`}</p>
                  <textarea rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" value={footerSocials} onChange={(e) => setFooterSocials(e.target.value)} />
                </div>
                <div className="flex justify-end"><Button type="submit">Save Footer</Button></div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── SEO ─── */}
        <TabsContent value="seo" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleSeedSeo} className="text-xs gap-1"><Plus size={12} /> Seed Defaults</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Page Type</TableHead><TableHead>Title</TableHead><TableHead>Description</TableHead><TableHead className="w-20" /></TableRow>
                </TableHeader>
                <TableBody>
                  {seo.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-sm capitalize">{s.page_type}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {editingSeo === s.id ? <Input value={seoForm.title} onChange={(e) => setSeoForm({ ...seoForm, title: e.target.value })} className="h-7 text-xs" /> : <span>{s.title ?? '—'}</span>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {editingSeo === s.id ? <Input value={seoForm.description} onChange={(e) => setSeoForm({ ...seoForm, description: e.target.value })} className="h-7 text-xs" /> : <span>{s.description ?? '—'}</span>}
                      </TableCell>
                      <TableCell>
                        {editingSeo === s.id ? (
                          <div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => handleSaveSeo(s.id)} className="h-7 text-[10px]">Save</Button><Button variant="ghost" size="sm" onClick={() => setEditingSeo(null)} className="h-7 text-[10px]">Cancel</Button></div>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => { setEditingSeo(s.id); setSeoForm({ title: s.title ?? '', description: s.description ?? '', og_image: s.og_image ?? '' }) }} className="h-7 w-7 p-0"><Edit size={12} /></Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {seo.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-12">No SEO defaults. Click "Seed Defaults" to create them.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent>
          <DialogHeader><DialogTitle>Keyboard Shortcuts</DialogTitle><DialogDescription>Available shortcuts for the content page.</DialogDescription></DialogHeader>
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
