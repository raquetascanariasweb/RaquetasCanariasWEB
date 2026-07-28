'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { AdminGiftCard } from './types'

async function checkAdmin() {
  const { userId } = await auth()
  const adminId = process.env.ADMIN_USER_ID || 'user_3G8ZXADowWQkNZdX65U1djf8JYZ'
  if (!userId || (adminId && userId !== adminId)) throw new Error('Unauthorized')
}

export async function getGiftCards(): Promise<AdminGiftCard[]> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase.from('gift_cards').select('*').order('created_at', { ascending: false })
  return (data ?? []) as AdminGiftCard[]
}

export async function createGiftCard(data: {
  code: string
  initial_balance_cents: number
  recipient_email?: string
  sender_email?: string
  message?: string
  active?: boolean
  expires_at?: string | null
}) {
  await checkAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase.from('gift_cards').insert({
    code: data.code.toUpperCase().replace(/\s+/g, ''),
    initial_balance_cents: data.initial_balance_cents,
    remaining_balance_cents: data.initial_balance_cents,
    recipient_email: data.recipient_email ?? '',
    sender_email: data.sender_email ?? '',
    message: data.message ?? '',
    active: data.active ?? true,
    expires_at: data.expires_at || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/gift-cards')
  return { success: true }
}

export async function updateGiftCard(id: string, data: {
  code?: string
  initial_balance_cents?: number
  remaining_balance_cents?: number
  recipient_email?: string
  sender_email?: string
  message?: string
  active?: boolean
  expires_at?: string | null
}) {
  await checkAdmin()
  const supabase = createAdminClient()

  const updateData: Record<string, any> = {}
  if (data.code !== undefined) updateData.code = data.code.toUpperCase().replace(/\s+/g, '')
  if (data.initial_balance_cents !== undefined) updateData.initial_balance_cents = data.initial_balance_cents
  if (data.remaining_balance_cents !== undefined) updateData.remaining_balance_cents = data.remaining_balance_cents
  if (data.recipient_email !== undefined) updateData.recipient_email = data.recipient_email
  if (data.sender_email !== undefined) updateData.sender_email = data.sender_email
  if (data.message !== undefined) updateData.message = data.message
  if (data.active !== undefined) updateData.active = data.active
  if (data.expires_at !== undefined) updateData.expires_at = data.expires_at

  const { error } = await supabase.from('gift_cards').update(updateData).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/gift-cards')
  return { success: true }
}

export async function deleteGiftCard(id: string) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('gift_cards').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/gift-cards')
  return { success: true }
}

export async function bulkDeleteGiftCards(ids: string[]) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('gift_cards').delete().in('id', ids)
  if (error) return { error: error.message }
  revalidatePath('/admin/gift-cards')
  return { success: true }
}
