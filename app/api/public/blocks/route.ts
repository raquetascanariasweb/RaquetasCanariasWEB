import { createAdminClient } from '@/lib/supabase/admin'

export const revalidate = 60

export async function GET() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('editorial_blocks')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true })
  return Response.json(data ?? [])
}
