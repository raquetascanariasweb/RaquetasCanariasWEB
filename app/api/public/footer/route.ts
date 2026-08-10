import { createAdminClient } from '@/lib/supabase/admin'

export const revalidate = 60

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('footer_settings').select('*').limit(1).single()
  if (error && error.code !== 'PGRST116') {
    return Response.json({ error: error.message }, { status: 500 })
  }
  return Response.json(data ?? null)
}
