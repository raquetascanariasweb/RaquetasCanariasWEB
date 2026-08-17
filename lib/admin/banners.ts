'use server'

import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadProductImages, uploadVideo } from '@/lib/supabase/storage'
import { revalidatePath } from 'next/cache'
import type { Banner } from './types'

async function checkAdmin() {
  await requireAdmin()
}

export async function getBanners(): Promise<Banner[]> {
  try { await checkAdmin() } catch { return [] }
  const supabase = createAdminClient()
  const { data } = await supabase.from('banners').select('*').order('sort_order', { ascending: true })
  if (!data) return []
  const banners = data as any[]
  if (banners.length > 0 && banners[0].text_x === undefined) {
    banners.forEach((b: any) => { b.text_x = 50; b.text_y = 50 })
  }
  return banners as Banner[]
}

export async function createBanner(formData: FormData) {
  try {
    try { await checkAdmin() } catch { return { error: 'Unauthorized' } }
    const supabase = createAdminClient()
    const title = formData.get('title') as string
    if (!title) return { error: 'Title required' }

    let imageUrl = (formData.get('image_url') as string) || ''
    const imageFiles = formData.getAll('image') as File[]
    if (imageFiles.length > 0 && imageFiles[0].size > 0) {
      try {
        const urls = await uploadProductImages([imageFiles[0]])
        imageUrl = urls[0]
      } catch (e: any) {
        return { error: `Image upload failed: ${e.message}` }
      }
    }

    let videoUrl = (formData.get('video_url') as string) || null
    const videoFiles = formData.getAll('video') as File[]
    if (videoFiles.length > 0 && videoFiles[0].size > 0) {
      try {
        videoUrl = await uploadVideo(videoFiles[0])
      } catch (e: any) {
        return { error: `Video upload failed: ${e.message}` }
      }
    }

    const { count } = await supabase.from('banners').select('*', { count: 'exact', head: true })

    const text_x = parseInt(formData.get('text_x') as string) || 50
    const text_y = parseInt(formData.get('text_y') as string) || 50
    const videoStart = formData.get('video_start') ? parseInt(formData.get('video_start') as string) || 0 : null
    const videoEnd = formData.get('video_end') ? parseInt(formData.get('video_end') as string) || null : null

    const { error } = await supabase.from('banners').insert({
      title,
      subtitle: (formData.get('subtitle') as string) || null,
      description: (formData.get('description') as string) || null,
      image_url: imageUrl,
      link_url: (formData.get('link_url') as string) || null,
      link_label: (formData.get('link_label') as string) || null,
      active: formData.get('active') !== 'false',
      sort_order: (count ?? 0) + 1,
      text_x,
      text_y,
      video_url: videoUrl,
      video_start: videoStart,
      video_end: videoEnd,
    })

    if (error) return { error: error.message }
    revalidatePath('/admin/banners')
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || 'Server error' }
  }
}

export async function updateBanner(id: string, formData: FormData) {
  try {
    try { await checkAdmin() } catch { return { error: 'Unauthorized' } }
    const supabase = createAdminClient()
    const title = formData.get('title') as string
    if (!title) return { error: 'Title required' }

    let imageUrl = (formData.get('image_url') as string) || ''
    const imageFiles = formData.getAll('image') as File[]
    if (imageFiles.length > 0 && imageFiles[0].size > 0) {
      try {
        const urls = await uploadProductImages([imageFiles[0]])
        imageUrl = urls[0]
      } catch (e: any) {
        return { error: `Image upload failed: ${e.message}` }
      }
    }

    let videoUrl = (formData.get('video_url') as string) || null
    const videoFiles = formData.getAll('video') as File[]
    if (videoFiles.length > 0 && videoFiles[0].size > 0) {
      try {
        videoUrl = await uploadVideo(videoFiles[0])
      } catch (e: any) {
        return { error: `Video upload failed: ${e.message}` }
      }
    }

    const text_x = parseInt(formData.get('text_x') as string) || 50
    const text_y = parseInt(formData.get('text_y') as string) || 50
    const videoStart = formData.get('video_start') ? parseInt(formData.get('video_start') as string) || 0 : null
    const videoEnd = formData.get('video_end') ? parseInt(formData.get('video_end') as string) || null : null

    const update: Record<string, any> = {
      title,
      subtitle: (formData.get('subtitle') as string) || null,
      description: (formData.get('description') as string) || null,
      link_url: (formData.get('link_url') as string) || null,
      link_label: (formData.get('link_label') as string) || null,
      active: formData.get('active') !== 'false',
      text_x,
      text_y,
      video_start: videoStart,
      video_end: videoEnd,
    }
    if (imageUrl) update.image_url = imageUrl
    if (videoUrl !== undefined) update.video_url = videoUrl

    const { error } = await supabase.from('banners').update(update).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/banners')
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || 'Server error' }
  }
}

export async function deleteBanner(id: string) {
  try {
    try { await checkAdmin() } catch { return { error: 'Unauthorized' } }
    const supabase = createAdminClient()
    const { error } = await supabase.from('banners').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/banners')
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || 'Server error' }
  }
}

export async function reorderBanners(ids: string[]) {
  try {
    try { await checkAdmin() } catch { return { error: 'Unauthorized' } }
    const supabase = createAdminClient()
    for (let i = 0; i < ids.length; i++) {
      await supabase.from('banners').update({ sort_order: i + 1 }).eq('id', ids[i])
    }
    revalidatePath('/admin/banners')
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || 'Server error' }
  }
}

export async function toggleBannerActive(id: string, active: boolean) {
  try {
    try { await checkAdmin() } catch { return { error: 'Unauthorized' } }
    const supabase = createAdminClient()
    const { error } = await supabase.from('banners').update({ active }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/banners')
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || 'Server error' }
  }
}
