'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadProductImages } from '@/lib/supabase/storage'
import { revalidatePath } from 'next/cache'
import { sanitizeNotificationSettings } from './notifications'

async function checkAdmin() {
  const { userId } = await auth()
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID || process.env.ADMIN_USER_ID
  if (!userId || userId !== adminId) throw new Error('Unauthorized')
}

export async function getAllSettings(): Promise<Record<string, any>> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase.from('settings').select('*')
  const map: Record<string, any> = {}
  for (const row of data ?? []) {
    map[row.key] = row.value
  }
  return map
}

export async function getSetting(key: string): Promise<any> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase.from('settings').select('value').eq('key', key).single()
  return data?.value ?? null
}

export async function updateSetting(key: string, value: any) {
  await checkAdmin()
  const supabase = createAdminClient()
  const normalized = key === 'notifications' ? sanitizeNotificationSettings(value) : value
  const { error } = await supabase.from('settings').upsert({ key, value: normalized }, { onConflict: 'key' })
  if (error) return { error: error.message }
  revalidatePath('/admin/settings')
  return { success: true }
}

export async function uploadSettingImage(file: File): Promise<string> {
  await checkAdmin()
  const urls = await uploadProductImages([file])
  return urls[0]
}

export async function saveSetting(formData: FormData) {
  try {
    try { await checkAdmin() } catch { return { error: 'Unauthorized' } }
    const supabase = createAdminClient()
    const key = formData.get('key') as string
    const value = JSON.parse((formData.get('value') as string) ?? '{}')

    const imageFile = formData.get('logo_image') as File | null
    if (imageFile && imageFile.size > 0) {
      const urls = await uploadProductImages([imageFile])
      value.logo_url = urls[0]
    }

    const faviconFile = formData.get('favicon_image') as File | null
    if (faviconFile && faviconFile.size > 0) {
      const urls = await uploadProductImages([faviconFile])
      value.favicon_url = urls[0]
    }

    const ogFile = formData.get('og_image') as File | null
    if (ogFile && ogFile.size > 0) {
      const urls = await uploadProductImages([ogFile])
      value.og_image = urls[0]
    }

    const { error } = await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
    if (error) return { error: error.message }
    revalidatePath('/admin/settings')
    return { success: true, value }
  } catch (e: any) {
    return { error: e?.message || 'Server error' }
  }
}
