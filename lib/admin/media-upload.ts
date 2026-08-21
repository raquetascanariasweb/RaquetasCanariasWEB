'use server'

import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'media'

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export async function uploadMediaFile(file: File): Promise<{ url: string; name: string } | { error: string }> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Unauthorized' }
  }

  const supabase = createAdminClient()
  const ext = file.name.split('.').pop() ?? 'bin'
  const fileName = `${generateId()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, {
      contentType: file.type || 'application/octet-stream',
      cacheControl: '31536000',
      upsert: false,
    })

  if (error) return { error: error.message }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
  return { url: data.publicUrl, name: file.name }
}

export async function deleteMediaFile(name: string): Promise<{ success: true } | { error: string }> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Unauthorized' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase.storage.from(BUCKET).remove([name])
  if (error) return { error: error.message }
  return { success: true }
}
