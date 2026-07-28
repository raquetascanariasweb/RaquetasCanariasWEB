import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('banners')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })
  return Response.json(data ?? [])
}
