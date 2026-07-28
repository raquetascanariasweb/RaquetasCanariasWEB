'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const BUCKET = 'product-images'

async function checkAdmin() {
  const { userId } = await auth()
  const adminId = process.env.ADMIN_USER_ID || 'user_3G8ZXADowWQkNZdX65U1djf8JYZ'
  if (!userId || userId !== adminId) throw new Error('Unauthorized')
}

export interface MediaFile {
  name: string
  id: string
  updated_at: string
  created_at: string
  last_accessed_at: string
  metadata: Record<string, any>
}

export async function getMediaList(): Promise<MediaFile[]> {
  try {
    await checkAdmin()
  } catch {
    return []
  }
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage.from(BUCKET).list('', {
    limit: 200,
    sortBy: { column: 'created_at', order: 'desc' },
  })
  if (error) return []
  return (data ?? []) as MediaFile[]
}

export async function uploadMedia(formData: FormData) {
  try {
    try {
      await checkAdmin()
    } catch {
      return { error: 'Unauthorized' }
    }
    const supabase = createAdminClient()
    const file = formData.get('file') as File
    const mimeOverride = formData.get('mime') as string | null
    if (!file || !(file instanceof Blob)) return { error: 'No file selected' }

    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) return { error: `File exceeds 50MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)` }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}.${ext}`
    const contentType = mimeOverride || file.type || `image/${ext === 'png' ? 'png' : 'jpeg'}`

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, {
        contentType,
        cacheControl: '31536000',
        upsert: false,
      })

    if (error) return { error: error.message }

    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
    revalidatePath('/admin/media')
    return { url: publicUrl.publicUrl, name: file.name, storageName: fileName, success: true }
  } catch (e: any) {
    return { error: e.message || 'An unexpected error occurred during upload' }
  }
}

export async function deleteMedia(names: string[]) {
  try {
    await checkAdmin()
    const supabase = createAdminClient()
    const { error } = await supabase.storage.from(BUCKET).remove(names)
    if (error) return { error: error.message }
    revalidatePath('/admin/media')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'An unexpected error occurred during deletion' }
  }
}
