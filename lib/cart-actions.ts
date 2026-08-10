'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function getUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}

interface CartVariant {
  product_id: string
  size: string
  color: string
}

export interface CartItemInput extends CartVariant {
  name: string
  price_cents: number
  image: string
  quantity: number
}

export async function getServerCart(): Promise<any[]> {
  const userId = await getUserId()
  if (!userId) return []
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function addServerCartItem(item: CartItemInput) {
  const userId = await getUserId()
  if (!userId) return { error: 'Not authenticated' }
  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', userId)
    .eq('product_id', item.product_id)
    .eq('size', item.size)
    .eq('color', item.color)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + item.quantity, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('cart_items')
      .insert({ ...item, user_id: userId })
    if (error) return { error: error.message }
  }

  revalidatePath('/cart')
  return { success: true }
}

export async function removeServerCartItem(variant: CartVariant) {
  const userId = await getUserId()
  if (!userId) return { error: 'Not authenticated' }
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', variant.product_id)
    .eq('size', variant.size)
    .eq('color', variant.color)
  if (error) return { error: error.message }
  revalidatePath('/cart')
  return { success: true }
}

export async function updateServerCartItemQuantity(variant: CartVariant, quantity: number) {
  const userId = await getUserId()
  if (!userId) return { error: 'Not authenticated' }
  const supabase = createAdminClient()

  if (quantity < 1) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', variant.product_id)
      .eq('size', variant.size)
      .eq('color', variant.color)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('product_id', variant.product_id)
      .eq('size', variant.size)
      .eq('color', variant.color)
    if (error) return { error: error.message }
  }

  revalidatePath('/cart')
  return { success: true }
}

export async function clearServerCart() {
  const userId = await getUserId()
  if (!userId) return { error: 'Not authenticated' }
  const supabase = createAdminClient()
  const { error } = await supabase.from('cart_items').delete().eq('user_id', userId)
  if (error) return { error: error.message }
  revalidatePath('/cart')
  return { success: true }
}
