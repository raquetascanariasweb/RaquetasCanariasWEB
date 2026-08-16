'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
  const { userId } = await auth()
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID || process.env.ADMIN_USER_ID
  if (!userId || userId !== adminId) throw new Error('Unauthorized')
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
