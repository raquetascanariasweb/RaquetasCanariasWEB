'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadProductImages } from '@/lib/supabase/storage'
import { revalidatePath } from 'next/cache'
import type { AdminCategory } from './types'

async function checkAdmin() {
  const { userId } = await auth()
  const adminId = process.env.ADMIN_USER_ID || 'user_3G8ZXADowWQkNZdX65U1djf8JYZ'
  if (!userId || (adminId && userId !== adminId)) throw new Error('Unauthorized')
}

export async function getCollections(): Promise<AdminCategory[]> {
  await checkAdmin()
  const supabase = createAdminClient()

  const { data: cats } = await supabase
    .from('categories')
    .select('*')
    .eq('is_collection', true)
    .order('name')

  const { data: counts } = await supabase.from('products').select('category_id')
  const countMap = new Map<string, number>()
  for (const row of counts ?? []) {
    if (row.category_id) countMap.set(row.category_id, (countMap.get(row.category_id) ?? 0) + 1)
  }

  const all = (cats ?? []).map((c) => ({
    ...c,
    product_count: countMap.get(c.id) ?? 0,
    children: [] as AdminCategory[],
  }))

  const roots = all.filter((c) => !c.parent_id)
  const children = all.filter((c) => c.parent_id)

  for (const child of children) {
    const parent = roots.find((r) => r.id === child.parent_id)
    if (parent) parent.children!.push(child)
  }

  return roots
}

export async function createCollection(data: { name: string; description?: string; image?: string; parent_id?: string }) {
  await checkAdmin()
  const supabase = createAdminClient()

  const slug = data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const { error } = await supabase.from('categories').insert({
    name: data.name.trim(),
    slug,
    description: data.description ?? '',
    image: data.image ?? '',
    parent_id: data.parent_id ?? null,
    is_collection: true,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/collections')
  return { success: true }
}

export async function updateCollection(id: string, data: { name: string; description?: string; image?: string; parent_id?: string | null }) {
  await checkAdmin()
  const supabase = createAdminClient()

  const slug = data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const { error } = await supabase.from('categories').update({
    name: data.name.trim(),
    slug,
    description: data.description ?? '',
    image: data.image ?? '',
    parent_id: data.parent_id ?? null,
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/collections')
  return { success: true }
}

export async function deleteCollection(id: string) {
  await checkAdmin()
  const supabase = createAdminClient()
  await supabase.from('products').update({ category_id: null }).eq('category_id', id)
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/collections')
  return { success: true }
}

export async function uploadCollectionImage(file: File): Promise<string> {
  await checkAdmin()
  const urls = await uploadProductImages([file])
  return urls[0]
}
