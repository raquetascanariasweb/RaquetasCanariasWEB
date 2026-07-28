'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadProductImages } from '@/lib/supabase/storage'
import { revalidatePath } from 'next/cache'
import type { HomepageHero, EditorialBlock, LandingPage, NavMenu, FooterSettings, SeoDefaults } from './types'

async function checkAdmin() {
  const { userId } = await auth()
  const adminId = process.env.ADMIN_USER_ID || 'user_3G8ZXADowWQkNZdX65U1djf8JYZ'
  if (!userId || userId !== adminId) throw new Error('Unauthorized')
}

export async function getHero(): Promise<HomepageHero | null> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase.from('homepage_hero').select('*').limit(1).single()
  return data as HomepageHero | null
}

export async function updateHero(formData: FormData) {
  await checkAdmin()
  const supabase = createAdminClient()
  let bgImage = formData.get('background_image') as string
  const files = formData.getAll('image') as File[]
  if (files.length > 0 && files[0].size > 0) {
    try {
      const urls = await uploadProductImages([files[0]])
      bgImage = urls[0]
    } catch (e: any) { return { error: `Upload failed: ${e.message}` } }
  }

  const update: Record<string, any> = {
    headline: formData.get('headline') as string,
    subheadline: (formData.get('subheadline') as string) || null,
    cta_text: (formData.get('cta_text') as string) || null,
    cta_link: (formData.get('cta_link') as string) || null,
    secondary_cta_text: (formData.get('secondary_cta_text') as string) || null,
    secondary_cta_link: (formData.get('secondary_cta_link') as string) || null,
    overlay_opacity: parseFloat(formData.get('overlay_opacity') as string) || 0.3,
    active: formData.get('active') !== 'false',
  }
  if (bgImage) update.background_image = bgImage

  const existing = await getHero()
  const { error } = existing
    ? await supabase.from('homepage_hero').update(update).eq('id', existing.id)
    : await supabase.from('homepage_hero').insert(update)

  if (error) return { error: error.message }
  revalidatePath('/admin/content')
  return { success: true }
}

export async function getBlocks(): Promise<EditorialBlock[]> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase.from('editorial_blocks').select('*').order('created_at', { ascending: false })
  return (data ?? []) as EditorialBlock[]
}

export async function createBlock(formData: FormData) {
  await checkAdmin()
  const supabase = createAdminClient()
  const title = formData.get('title') as string
  if (!title) return { error: 'Title required' }

  const content: Record<string, any> = {}
  const type = formData.get('type') as string

  switch (type) {
    case 'richtext':
      content.body = (formData.get('body') as string) || ''
      break
    case 'image': {
      content.alt = (formData.get('alt') as string) || ''
      content.caption = (formData.get('caption') as string) || ''
      const files = formData.getAll('image') as File[]
      if (files.length > 0 && files[0].size > 0) {
        const urls = await uploadProductImages([files[0]])
        content.src = urls[0]
      }
      break
    }
    case 'video':
      content.url = (formData.get('video_url') as string) || ''
      content.caption = (formData.get('video_caption') as string) || ''
      break
    case 'quote':
      content.text = (formData.get('quote_text') as string) || ''
      content.author = (formData.get('quote_author') as string) || ''
      break
    case 'custom_html':
      content.html = (formData.get('html') as string) || ''
      break
  }

  const { error } = await supabase.from('editorial_blocks').insert({ title, type, content, active: formData.get('active') !== 'false' })
  if (error) return { error: error.message }
  revalidatePath('/admin/content')
  return { success: true }
}

export async function updateBlock(id: string, formData: FormData) {
  await checkAdmin()
  const supabase = createAdminClient()
  const title = formData.get('title') as string
  if (!title) return { error: 'Title required' }

  const content: Record<string, any> = {}
  const type = formData.get('type') as string

  switch (type) {
    case 'richtext':
      content.body = (formData.get('body') as string) || ''
      break
    case 'image': {
      content.alt = (formData.get('alt') as string) || ''
      content.caption = (formData.get('caption') as string) || ''
      const existingSrc = formData.get('existing_src') as string
      if (existingSrc) content.src = existingSrc
      const files = formData.getAll('image') as File[]
      if (files.length > 0 && files[0].size > 0) {
        const urls = await uploadProductImages([files[0]])
        content.src = urls[0]
      }
      break
    }
    case 'video':
      content.url = (formData.get('video_url') as string) || ''
      content.caption = (formData.get('video_caption') as string) || ''
      break
    case 'quote':
      content.text = (formData.get('quote_text') as string) || ''
      content.author = (formData.get('quote_author') as string) || ''
      break
    case 'custom_html':
      content.html = (formData.get('html') as string) || ''
      break
  }

  const { error } = await supabase.from('editorial_blocks').update({ title, type, content, active: formData.get('active') !== 'false' }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/content')
  return { success: true }
}

export async function deleteBlock(id: string) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('editorial_blocks').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/content')
  return { success: true }
}

export async function updateBannerContent(id: string, data: Record<string, any>) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('banners').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/')
  return { success: true }
}

export async function updateEditorialBlockContent(id: string, data: { content: any }) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('editorial_blocks').update({ content: data.content }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/')
  return { success: true }
}

export async function getPages(): Promise<LandingPage[]> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase.from('landing_pages').select('*').order('created_at', { ascending: false })
  return (data ?? []) as LandingPage[]
}

export async function getPage(id: string): Promise<LandingPage | null> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase.from('landing_pages').select('*').eq('id', id).single()
  return data as LandingPage | null
}

export async function createPage(formData: FormData) {
  await checkAdmin()
  const supabase = createAdminClient()
  const title = formData.get('title') as string
  if (!title) return { error: 'Title required' }
  const slug = (formData.get('slug') as string) || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const { error } = await supabase.from('landing_pages').insert({
    title, slug,
    description: (formData.get('description') as string) || null,
    seo_title: (formData.get('seo_title') as string) || null,
    seo_description: (formData.get('seo_description') as string) || null,
    blocks: formData.get('blocks') ? JSON.parse(formData.get('blocks') as string) : [],
    active: formData.get('active') !== 'false',
  })
  if (error) return { error: error.message }
  revalidatePath('/admin/content')
  return { success: true }
}

export async function updatePage(id: string, formData: FormData) {
  await checkAdmin()
  const supabase = createAdminClient()
  const title = formData.get('title') as string
  if (!title) return { error: 'Title required' }
  const slug = (formData.get('slug') as string) || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const { error } = await supabase.from('landing_pages').update({
    title, slug,
    description: (formData.get('description') as string) || null,
    seo_title: (formData.get('seo_title') as string) || null,
    seo_description: (formData.get('seo_description') as string) || null,
    blocks: formData.get('blocks') ? JSON.parse(formData.get('blocks') as string) : [],
    active: formData.get('active') !== 'false',
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/content')
  return { success: true }
}

export async function deletePage(id: string) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('landing_pages').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/content')
  return { success: true }
}

export async function getNavMenus(): Promise<NavMenu[]> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase.from('navigation_menus').select('*').order('created_at')
  return (data ?? []) as NavMenu[]
}

export async function createNavMenu(formData: FormData) {
  await checkAdmin()
  const supabase = createAdminClient()
  const name = formData.get('name') as string
  if (!name) return { error: 'Name required' }
  const items = formData.get('items') ? JSON.parse(formData.get('items') as string) : []
  const { error } = await supabase.from('navigation_menus').insert({ name, items })
  if (error) return { error: error.message }
  revalidatePath('/admin/content')
  return { success: true }
}

export async function updateNavMenu(id: string, formData: FormData) {
  await checkAdmin()
  const supabase = createAdminClient()
  const name = formData.get('name') as string
  if (!name) return { error: 'Name required' }
  const items = formData.get('items') ? JSON.parse(formData.get('items') as string) : []
  const { error } = await supabase.from('navigation_menus').update({ name, items }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/content')
  return { success: true }
}

export async function deleteNavMenu(id: string) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('navigation_menus').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/content')
  return { success: true }
}

export async function getFooter(): Promise<FooterSettings | null> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase.from('footer_settings').select('*').limit(1).single()
  return data as FooterSettings | null
}

export async function updateFooter(formData: FormData) {
  await checkAdmin()
  const supabase = createAdminClient()
  const update: Record<string, any> = {
    copyright_text: (formData.get('copyright_text') as string) || null,
    newsletter_text: (formData.get('newsletter_text') as string) || null,
    columns: formData.get('columns') ? JSON.parse(formData.get('columns') as string) : [],
    social_links: formData.get('social_links') ? JSON.parse(formData.get('social_links') as string) : [],
  }
  const existing = await getFooter()
  const { error } = existing
    ? await supabase.from('footer_settings').update(update).eq('id', existing.id)
    : await supabase.from('footer_settings').insert(update)
  if (error) return { error: error.message }
  revalidatePath('/admin/content')
  return { success: true }
}

export async function getHomepageSectionData(key: string): Promise<any> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('settings').select('value').eq('key', key).single()
  return data?.value ?? null
}

export async function updateHomepageSectionData(key: string, value: any) {
  try { await checkAdmin() } catch { return { error: 'Unauthorized' } }
  const supabase = createAdminClient()
  const { error } = await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
  if (error) return { error: error.message }
  revalidatePath('/')
  return { success: true }
}

export async function getSeoDefaults(): Promise<SeoDefaults[]> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase.from('seo_defaults').select('*').order('page_type')
  return (data ?? []) as SeoDefaults[]
}

export async function updateSeoDefault(id: string, formData: FormData) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('seo_defaults').update({
    title: (formData.get('title') as string) || null,
    description: (formData.get('description') as string) || null,
    og_image: (formData.get('og_image') as string) || null,
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/content')
  return { success: true }
}

export async function seedSeoDefaults() {
  await checkAdmin()
  const supabase = createAdminClient()
  const types = ['homepage', 'collection', 'product', 'about', 'contact', 'editorial', 'faq']
  for (const t of types) {
    const { data: existing } = await supabase.from('seo_defaults').select('id').eq('page_type', t).single()
    if (!existing) {
      await supabase.from('seo_defaults').insert({ page_type: t })
    }
  }
  revalidatePath('/admin/content')
  return { success: true }
}
