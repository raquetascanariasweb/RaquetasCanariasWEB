'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { DraftOrder } from './types'

async function checkAdmin() {
  const { userId } = await auth()
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID || process.env.ADMIN_USER_ID
  if (!userId || userId !== adminId) throw new Error('Unauthorized')
}

export async function getDraftOrders(): Promise<DraftOrder[]> {
  await checkAdmin()
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'draft')
    .order('created_at', { ascending: false })

  return (data ?? []) as DraftOrder[]
}

export async function createDraftOrder(data: {
  user_id: string
  items: { product_id: string; product_name: string; quantity: number; price_cents: number; size: string; color: string }[]
  notes?: string
  shipping_address?: Record<string, string>
}) {
  await checkAdmin()
  const supabase = createAdminClient()

  const totalCents = data.items.reduce((sum, item) => sum + item.price_cents * item.quantity, 0)

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      user_id: data.user_id,
      status: 'draft',
      total_cents: totalCents,
      items: data.items,
      notes: data.notes ?? '',
      shipping_address: data.shipping_address ?? null,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/admin/draft-orders')
  return { order }
}

export async function updateDraftOrder(id: string, data: {
  items?: { product_id: string; product_name: string; quantity: number; price_cents: number; size: string; color: string }[]
  notes?: string
  shipping_address?: Record<string, string>
}) {
  await checkAdmin()
  const supabase = createAdminClient()

  const updateData: Record<string, any> = {}
  if (data.items) {
    updateData.items = data.items
    updateData.total_cents = data.items.reduce((sum, item) => sum + item.price_cents * item.quantity, 0)
  }
  if (data.notes !== undefined) updateData.notes = data.notes
  if (data.shipping_address !== undefined) updateData.shipping_address = data.shipping_address

  const { error } = await supabase.from('orders').update(updateData).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/draft-orders')
  return { success: true }
}

export async function convertDraftToOrder(id: string, stripeSessionId?: string) {
  await checkAdmin()
  const supabase = createAdminClient()

  const updateData: Record<string, any> = { status: 'pending' }
  if (stripeSessionId) updateData.stripe_session_id = stripeSessionId

  const { error } = await supabase.from('orders').update(updateData).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/draft-orders')
  revalidatePath('/admin/orders')
  return { success: true }
}

export async function deleteDraftOrder(id: string) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/draft-orders')
  return { success: true }
}
