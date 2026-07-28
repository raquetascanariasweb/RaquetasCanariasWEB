import { createAdminClient } from '@/lib/supabase/admin'
import type { Product, Category } from '@/types/product'

export async function getProducts(params?: {
  category?: string
  search?: string
}): Promise<Product[]> {
  const supabase = createAdminClient()
  let q = supabase
    .from('products')
    .select('*, categories(name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (params?.category) {
    q = q.eq('category_id', params.category)
  }

  if (params?.search) {
    q = q.ilike('name', `%${params.search}%`)
  }

  const { data } = await q
  return ((data ?? []) as any[]).map((p: any) => ({
    ...p,
    category_name: p.categories?.name ?? null,
    categories: undefined,
  }))
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()
  if (!data) return null
  const p = data as any
  return { ...p, category_name: p.categories?.name ?? null, categories: undefined }
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('featured_products')
    .select('sort_order, products!inner(*, categories(name))')
    .order('sort_order', { ascending: true })
  return ((data ?? []) as any[]).map((fp: any) => ({
    ...fp.products,
    category_name: fp.products?.categories?.name ?? null,
    categories: undefined,
  }))
}

export async function getCategories(): Promise<Category[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name')
  return data ?? []
}

export async function searchProducts(query: string): Promise<Product[]> {
  return getProducts({ search: query })
}
