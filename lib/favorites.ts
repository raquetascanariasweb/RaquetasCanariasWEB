'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface FavoriteProduct {
  product_id: string
  name: string
  slug: string
  price_cents: number
  image: string
  in_stock: boolean
}

export async function getFavorites(): Promise<FavoriteProduct[]> {
  const { userId } = await auth()
  if (!userId) return []
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('user_favorites')
    .select('product_id, created_at, products!inner(name, slug, price_cents, images, in_stock)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[getFavorites] Supabase error:', error)
    return []
  }
  return (data ?? []).map((row: any) => ({
    product_id: row.product_id,
    name: row.products.name,
    slug: row.products.slug,
    price_cents: row.products.price_cents,
    image: (row.products.images as any[])?.[0]?.url ?? '',
    in_stock: row.products.in_stock,
  }))
}

export async function addFavorite(productId: string) {
  const { userId } = await auth()
  if (!userId) {
    console.error('[addFavorite] Unauthenticated — auth() returned null userId')
    return { error: 'Not authenticated' }
  }
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('user_favorites')
    .insert({ user_id: userId, product_id: productId })
  if (error) {
    if (error.code === '23505') return { success: true }
    console.error('[addFavorite] Supabase error:', error)
    return { error: error.message }
  }
  revalidatePath('/')
  revalidatePath('/shop')
  return { success: true }
}

export async function removeFavorite(productId: string) {
  const { userId } = await auth()
  if (!userId) {
    console.error('[removeFavorite] Unauthenticated — auth() returned null userId')
    return { error: 'Not authenticated' }
  }
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)
  if (error) {
    console.error('[removeFavorite] Supabase error:', error)
    return { error: error.message }
  }
  revalidatePath('/')
  revalidatePath('/shop')
  return { success: true }
}
