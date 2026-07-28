import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('homepage_hero').select('*').limit(1).single()
  if (error && error.code !== 'PGRST116') {
    return Response.json({ error: error.message }, { status: 500 })
  }
  return Response.json(data ?? null)
}
