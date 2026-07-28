'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { AdminDiscount } from './types'

async function checkAdmin() {
  const { userId } = await auth()
  const adminId = process.env.ADMIN_USER_ID || 'user_3G8ZXADowWQkNZdX65U1djf8JYZ'
  if (!userId || (adminId && userId !== adminId)) throw new Error('Unauthorized')
}

export async function getDiscounts(): Promise<AdminDiscount[]> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase.from('discounts').select('*').order('created_at', { ascending: false })
  return (data ?? []) as AdminDiscount[]
}

export async function createDiscount(data: {
  code: string
  type: 'percentage' | 'fixed_amount'
  value: number
  description?: string
  min_purchase_cents?: number
  max_uses?: number | null
  active?: boolean
  starts_at?: string | null
  expires_at?: string | null
}) {
  await checkAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase.from('discounts').insert({
    code: data.code.toUpperCase(),
    type: data.type,
    value: data.value,
    description: data.description ?? '',
    min_purchase_cents: data.min_purchase_cents ?? 0,
    max_uses: data.max_uses ?? null,
    active: data.active ?? true,
    starts_at: data.starts_at || null,
    expires_at: data.expires_at || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/discounts')
  return { success: true }
}

export async function updateDiscount(id: string, data: {
  code?: string
  type?: 'percentage' | 'fixed_amount'
  value?: number
  description?: string
  min_purchase_cents?: number
  max_uses?: number | null
  active?: boolean
  starts_at?: string | null
  expires_at?: string | null
}) {
  await checkAdmin()
  const supabase = createAdminClient()

  const updateData: Record<string, any> = {}
  if (data.code !== undefined) updateData.code = data.code.toUpperCase()
  if (data.type !== undefined) updateData.type = data.type
  if (data.value !== undefined) updateData.value = data.value
  if (data.description !== undefined) updateData.description = data.description
  if (data.min_purchase_cents !== undefined) updateData.min_purchase_cents = data.min_purchase_cents
  if (data.max_uses !== undefined) updateData.max_uses = data.max_uses
  if (data.active !== undefined) updateData.active = data.active
  if (data.starts_at !== undefined) updateData.starts_at = data.starts_at
  if (data.expires_at !== undefined) updateData.expires_at = data.expires_at

  const { error } = await supabase.from('discounts').update(updateData).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/discounts')
  return { success: true }
}

export async function deleteDiscount(id: string) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('discounts').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/discounts')
  return { success: true }
}

export async function bulkDeleteDiscounts(ids: string[]) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('discounts').delete().in('id', ids)
  if (error) return { error: error.message }
  revalidatePath('/admin/discounts')
  return { success: true }
}

export async function bulkUpdateDiscounts(ids: string[], data: { active?: boolean }) {
  await checkAdmin()
  const supabase = createAdminClient()
  const updateData: Record<string, any> = {}
  if (data.active !== undefined) updateData.active = data.active
  const { error } = await supabase.from('discounts').update(updateData).in('id', ids)
  if (error) return { error: error.message }
  revalidatePath('/admin/discounts')
  return { success: true }
}
