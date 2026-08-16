import { createClient } from '@supabase/supabase-js'

const BUCKET = 'product-images'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let _client: ReturnType<typeof createClient> | null = null

function getClient() {
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _client
}

export async function uploadDirect(file: File): Promise<{ url: string; name: string } | { error: string }> {
  try {
    const supabase = getClient()
    const ext = file.name.split('.').pop() ?? 'bin'
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}.${ext}`

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
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Upload failed'
    return { error: msg }
  }
}
