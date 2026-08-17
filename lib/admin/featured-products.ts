'use server'

import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
  await requireAdmin()
}

export async function toggleFeaturedByProductId(productId: string) {
  await checkAdmin()
  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('featured_products')
    .select('id')
    .eq('product_id', productId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('featured_products')
      .delete()
      .eq('id', existing.id)
    if (error) return { error: error.message }
    revalidatePath('/')
    return { success: true, featured: false }
  }

  const { count } = await supabase
    .from('featured_products')
    .select('*', { count: 'exact', head: true })

  const { error } = await supabase.from('featured_products').insert({
    product_id: productId,
    sort_order: (count ?? 0) + 1,
  })

  if (error) return { error: error.message }
  revalidatePath('/')
  return { success: true, featured: true }
}

export async function getFeaturedProductIds(): Promise<string[]> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('featured_products')
    .select('product_id')
  return (data ?? []).map((fp: { product_id: string }) => fp.product_id)
}
