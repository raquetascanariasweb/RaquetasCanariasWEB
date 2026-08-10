'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadProductImages } from '@/lib/supabase/storage'
import { revalidatePath } from 'next/cache'
import type { AdminCategory } from './types'

async function checkAdmin() {
  const { userId } = await auth()
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID || process.env.ADMIN_USER_ID || 'user_3G8ZXADowWQkNZdX65U1djf8JYZ'
  if (!userId || (adminId && userId !== adminId)) throw new Error('Unauthorized')
}

function generateSlug(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function ensureUniqueSlug(supabase: any, baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug
  let counter = 1
  while (true) {
    let q = supabase.from('categories').select('id').eq('slug', slug)
    if (excludeId) q = q.neq('id', excludeId)
    const { data } = await q
    if (!data || data.length === 0) return slug
    slug = `${baseSlug}-${counter}`
    counter++
  }
}

export async function getCategories(): Promise<AdminCategory[]> {
  await checkAdmin()
  const supabase = createAdminClient()

  const { data: cats } = await supabase.from('categories').select('*').order('name')

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

  const byId = new Map<string, AdminCategory>()
  for (const c of all) byId.set(c.id, c)

  const roots: AdminCategory[] = []
  for (const c of all) {
    if (c.parent_id && byId.has(c.parent_id)) {
      byId.get(c.parent_id)!.children!.push(c)
    } else if (!c.parent_id) {
      roots.push(c)
    } else {
      roots.push(c)
    }
  }

  return roots
}

export async function createCategory(data: { name: string; parent_id?: string; description?: string; image?: string; is_collection?: boolean }) {
  await checkAdmin()
  const supabase = createAdminClient()

  const baseSlug = generateSlug(data.name)
  const slug = await ensureUniqueSlug(supabase, baseSlug)

  const { error } = await supabase.from('categories').insert({
    name: data.name.trim(),
    slug,
    parent_id: data.parent_id ?? null,
    description: data.description ?? '',
    image: data.image ?? '',
    is_collection: data.is_collection ?? false,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/categories')
  return { success: true }
}

export async function updateCategory(id: string, data: { name: string; parent_id?: string | null; description?: string; image?: string; is_collection?: boolean }) {
  await checkAdmin()
  const supabase = createAdminClient()

  const baseSlug = generateSlug(data.name)
  const slug = await ensureUniqueSlug(supabase, baseSlug, id)

  const { error } = await supabase.from('categories').update({
    name: data.name.trim(),
    slug,
    parent_id: data.parent_id ?? null,
    description: data.description ?? '',
    image: data.image ?? '',
    is_collection: data.is_collection ?? false,
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/categories')
  return { success: true }
}

export async function deleteCategory(id: string) {
  await checkAdmin()
  const supabase = createAdminClient()

  await supabase.from('products').update({ category_id: null }).eq('category_id', id)

  async function deleteRecursive(categoryId: string) {
    const { data: children } = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', categoryId)
    for (const child of children ?? []) {
      await deleteRecursive(child.id)
    }
    await supabase.from('products').update({ category_id: null }).eq('category_id', categoryId)
    const { error } = await supabase.from('categories').delete().eq('id', categoryId)
    if (error) throw new Error(error.message)
  }

  try {
    await deleteRecursive(id)
  } catch (e: any) {
    return { error: e.message }
  }
  revalidatePath('/admin/categories')
  return { success: true }
}

export async function uploadCategoryImage(file: File): Promise<string> {
  await checkAdmin()
  const urls = await uploadProductImages([file])
  return urls[0]
}
