'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getShippingSettings(): Promise<{ shippingRate: number; freeThreshold: number }> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('settings').select('value').eq('key', 'shipping').single()
  const value = (data?.value ?? {}) as any
  return {
    shippingRate: value.shipping_rate ?? 10,
    freeThreshold: value.free_shipping_threshold ?? 200,
  }
}

export async function getAboutContent(): Promise<Record<string, string>> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('settings').select('value').eq('key', 'about_page').single()
  return (data?.value ?? {}) as Record<string, string>
}

export async function updateAboutContent(images: Record<string, string>) {
  const { userId } = await auth()
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID || process.env.ADMIN_USER_ID || 'user_3G8ZXADowWQkNZdX65U1djf8JYZ'
  if (!userId || userId !== adminId) return { error: 'Unauthorized' }
  const supabase = createAdminClient()
  const { error } = await supabase.from('settings').upsert({ key: 'about_page', value: images }, { onConflict: 'key' })
  if (error) return { error: error.message }
  revalidatePath('/about')
  return { success: true }
}

export async function getNewsTicker(): Promise<{ enabled: boolean; text: string }> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('settings').select('value').eq('key', 'news_ticker').single()
  const value = (data?.value ?? {}) as any
  return {
    enabled: !!value.enabled,
    text: value.text ?? '',
  }
}
