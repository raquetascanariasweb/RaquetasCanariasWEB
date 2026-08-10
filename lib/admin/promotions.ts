'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { PromotionalSection } from './types'

async function checkAdmin() {
  const { userId } = await auth()
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID || process.env.ADMIN_USER_ID || 'user_3G8ZXADowWQkNZdX65U1djf8JYZ'
  if (!userId || userId !== adminId) throw new Error('Unauthorized')
}

export async function getPromotionalSections(): Promise<PromotionalSection[]> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase.from('promotional_sections').select('*').order('sort_order', { ascending: true })
  return (data ?? []) as PromotionalSection[]
}

export async function createPromotionalSection(formData: FormData) {
  await checkAdmin()
  const supabase = createAdminClient()
  const title = formData.get('title') as string
  if (!title) return { error: 'Title required' }

  const { count } = await supabase.from('promotional_sections').select('*', { count: 'exact', head: true })

  const { error } = await supabase.from('promotional_sections').insert({
    title,
    description: (formData.get('description') as string) || null,
    layout: (formData.get('layout') as string) || 'grid',
    background_color: (formData.get('background_color') as string) || '#0a0a0a',
    text_color: (formData.get('text_color') as string) || '#f5f2eb',
    active: formData.get('active') !== 'false',
    product_ids: formData.get('product_ids') ? JSON.parse(formData.get('product_ids') as string) : [],
    sort_order: (count ?? 0) + 1,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/promotions')
  return { success: true }
}

export async function updatePromotionalSection(id: string, formData: FormData) {
  await checkAdmin()
  const supabase = createAdminClient()
  const title = formData.get('title') as string
  if (!title) return { error: 'Title required' }

  const { error } = await supabase.from('promotional_sections').update({
    title,
    description: (formData.get('description') as string) || null,
    layout: (formData.get('layout') as string) || 'grid',
    background_color: (formData.get('background_color') as string) || '#0a0a0a',
    text_color: (formData.get('text_color') as string) || '#f5f2eb',
    active: formData.get('active') !== 'false',
    product_ids: formData.get('product_ids') ? JSON.parse(formData.get('product_ids') as string) : [],
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/promotions')
  return { success: true }
}

export async function deletePromotionalSection(id: string) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('promotional_sections').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/promotions')
  return { success: true }
}

export async function reorderPromotionalSections(ids: string[]) {
  await checkAdmin()
  const supabase = createAdminClient()
  for (let i = 0; i < ids.length; i++) {
    await supabase.from('promotional_sections').update({ sort_order: i + 1 }).eq('id', ids[i])
  }
  revalidatePath('/admin/promotions')
  return { success: true }
}

export async function togglePromotionalSectionActive(id: string, active: boolean) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('promotional_sections').update({ active }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/promotions')
  return { success: true }
}
