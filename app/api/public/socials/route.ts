import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'social')
    .single()

  const value = (data?.value ?? {}) as Record<string, string>

  return Response.json({
    facebook: value.facebook || '',
    instagram: value.instagram || '',
    twitter: value.twitter || '',
    pinterest: value.pinterest || '',
    tiktok: value.tiktok || '',
    youtube: value.youtube || '',
    linkedin: value.linkedin || '',
  })
}
