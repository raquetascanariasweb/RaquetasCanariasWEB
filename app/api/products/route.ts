import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const revalidate = 60

export async function GET() {
  const supabase = createAdminClient()

  const { data: products, error } = await supabase
    .from('products')
    .select('*, categories(name), product_variants(*)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const mapped = products.map((p) => ({
    ...p,
    category_name: p.categories?.name ?? null,
    categories: undefined,
  }))

  return NextResponse.json(mapped)
}
