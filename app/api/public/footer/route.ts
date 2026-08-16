import { createAdminClient } from '@/lib/supabase/admin'

export const revalidate = 60

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('footer_settings').select('*').limit(1).single()
  if (error && error.code !== 'PGRST116') {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const { data: storeSettings } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'store')
    .single()
  const store = (storeSettings?.value ?? {}) as Record<string, string>

  return Response.json({
    ...(data ?? null),
    contact: {
      email: store.email || '',
      phone: store.phone || '',
      address: [store.address_line1, store.address_line2, store.city, store.state, store.zip, store.country].filter(Boolean).join(', '),
    },
  })
}
