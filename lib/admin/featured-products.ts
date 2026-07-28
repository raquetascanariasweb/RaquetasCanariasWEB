'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { FeaturedProductEntry } from './types'

async function checkAdmin() {
  const { userId } = await auth()
  const adminId = process.env.ADMIN_USER_ID || 'user_3G8ZXADowWQkNZdX65U1djf8JYZ'
  if (!userId || userId !== adminId) throw new Error('Unauthorized')
}

export async function getFeaturedProducts(): Promise<FeaturedProductEntry[]> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('featured_products')
    .select('*, products(*)')
    .order('sort_order', { ascending: true })

  return ((data ?? []) as any[]).map((fp: any) => ({
    id: fp.id,
    product_id: fp.product_id,
    sort_order: fp.sort_order,
    created_at: fp.created_at,
    product: fp.products ? {
      ...fp.products,
      status: fp.products.status ?? 'active',
      variants: [],
      category_name: null,
    } : undefined,
  }))
}

export async function addFeaturedProduct(productId: string) {
  await checkAdmin()
  const supabase = createAdminClient()

  const { count } = await supabase
    .from('featured_products')
    .select('*', { count: 'exact', head: true })

  const { error } = await supabase.from('featured_products').insert({
    product_id: productId,
    sort_order: (count ?? 0) + 1,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/featured-products')
  return { success: true }
}

export async function removeFeaturedProduct(id: string) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('featured_products').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/featured-products')
  return { success: true }
}

export async function reorderFeaturedProducts(ids: string[]) {
  await checkAdmin()
  const supabase = createAdminClient()
  const updates = ids.map((id, i) => ({ id, sort_order: i + 1 }))
  for (const u of updates) {
    await supabase.from('featured_products').update({ sort_order: u.sort_order }).eq('id', u.id)
  }
  revalidatePath('/admin/featured-products')
  return { success: true }
}
