'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const BUCKET = 'product-images'

async function checkAdmin() {
  const { userId } = await auth()
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID || process.env.ADMIN_USER_ID || 'user_3G8ZXADowWQkNZdX65U1djf8JYZ'
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
    await checkAdmin()
  } catch {
    return { error: 'Unauthorized' }
  }

  const supabase = createAdminClient()
  const files = formData.getAll('files') as File[]

  if (files.length === 0) return { error: 'No file selected' }

  const results: { url: string; name: string; storageName: string }[] = []
  const errors: string[] = []

  for (const file of files) {
    if (!file || file.size === 0) {
      errors.push('Empty file')
      continue
    }

    if (file.size > 200 * 1024 * 1024) {
      errors.push(`${file.name}: exceeds 200MB limit`)
      continue
    }

    try {
      const ext = file.name.split('.').pop() ?? 'bin'
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}.${ext}`

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, file, {
          contentType: file.type || 'application/octet-stream',
          cacheControl: '31536000',
          upsert: false,
        })

      if (error) {
        errors.push(`${file.name}: ${error.message}`)
      } else {
        const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
        results.push({ url: publicUrl.publicUrl, name: file.name, storageName: fileName })
      }
    } catch (e: any) {
      errors.push(`${file.name}: ${e.message || 'Upload failed'}`)
    }
  }

  revalidatePath('/admin/media')

  if (errors.length > 0 && results.length === 0) {
    return { error: errors.join('. ') }
  }

  return {
    success: true,
    results,
    errors: errors.length > 0 ? errors.join('. ') : undefined,
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
