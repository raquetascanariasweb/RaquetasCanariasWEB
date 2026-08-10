import { createAdminClient } from './admin'

const BUCKET = 'product-images'

export function getPublicUrl(name: string): string {
  const { data } = createAdminClient().storage.from(BUCKET).getPublicUrl(name)
  return data.publicUrl
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export async function uploadProductImages(files: File[]): Promise<string[]> {
  const supabase = createAdminClient()
  const urls: string[] = []

  for (const file of files) {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const fileName = `${generateId()}.${ext}`

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, {
        contentType: file.type,
        cacheControl: '3600',
      })

    if (error) {
      throw new Error(`Failed to upload ${file.name}: ${error.message}`)
    }

    const { data: publicUrl } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(fileName)

    urls.push(publicUrl.publicUrl)
  }

  return urls
}

export async function uploadVideo(file: File): Promise<string> {
  const supabase = createAdminClient()
  const ext = file.name.split('.').pop() ?? 'mp4'
  const fileName = `video-${generateId()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, {
      contentType: file.type,
      cacheControl: '3600',
    })

  if (error) {
    throw new Error(`Failed to upload video: ${error.message}`)
  }

  const { data: publicUrl } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(fileName)

  return publicUrl.publicUrl
}

export async function getExistingCategories() {
  const supabase = createAdminClient()
  const { data } = await supabase.from('categories').select('*').order('name')
  return data ?? []
}
