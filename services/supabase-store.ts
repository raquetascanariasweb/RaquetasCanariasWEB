import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { createPublicClient } from '@/lib/supabase/public'
import type { Product, Category } from '@/types/product'
import { escapeLike } from '@/lib/utils'

function isBrowser() {
  return typeof window !== 'undefined'
}

function getSupabaseClient() {
  return isBrowser() ? createPublicClient() : createAdminClient()
}

function mapProduct(p: any): Product {
  return {
    ...p,
    category_name: p.categories?.name ?? null,
    categories: undefined,
    variants: p.product_variants ?? p.variants ?? undefined,
  }
}

export interface ProductsPageParams {
  categoryIds?: string[]
  uncategorized?: boolean
  search?: string
  priceMinCents?: number
  priceMaxCents?: number
  inStockOnly?: boolean
  sort?: 'newest' | 'price_asc' | 'price_desc'
  page?: number
  pageSize?: number
}

export interface ProductsPageResult {
  products: Product[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function applyProductFilters(
  builder: any,
  params: ProductsPageParams
) {
  let q = builder
  q = q.eq('status', 'active')
  if (params.categoryIds?.length) {
    const ids = params.categoryIds
    const containsFilters = ids.map((id) => `category_ids.cs.${JSON.stringify([id])}`).join(',')
    q = q.or(`${containsFilters},category_id.in.(${ids.join(',')})`)
  }
  if (params.uncategorized) {
    q = q.or('category_id.is.null,category_ids.is.null')
  }
  if (params.search) {
    const words = params.search.trim().split(/\s+/).filter(Boolean)
    for (const w of words) {
      q = q.ilike('name', `%${escapeLike(w)}%`)
    }
  }
  if (params.priceMinCents != null) q = q.gte('price_cents', params.priceMinCents)
  if (params.priceMaxCents != null) q = q.lte('price_cents', params.priceMaxCents)
  if (params.inStockOnly) q = q.eq('in_stock', true)
  return q
}

export const getProductsPage = cache(async (params: ProductsPageParams = {}): Promise<ProductsPageResult> => {
  const supabase = getSupabaseClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(48, Math.max(1, params.pageSize ?? 12))
  const start = (page - 1) * pageSize

  const { count } = await applyProductFilters(
    supabase.from('products').select('id', { count: 'exact', head: true }),
    params
  )

  let q = applyProductFilters(
    supabase.from('products').select('*, categories(name), product_variants(*)'),
    params
  )
  switch (params.sort) {
    case 'price_asc':
      q = q.order('price_cents', { ascending: true })
      break
    case 'price_desc':
      q = q.order('price_cents', { ascending: false })
      break
    default:
      q = q.order('created_at', { ascending: false })
  }
  q = q.range(start, start + pageSize - 1)

  const { data } = await q
  const total = count ?? 0

  return {
    products: ((data ?? []) as any[]).map(mapProduct),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
})

export const getProducts = cache(async (params?: {
  category?: string
  search?: string
  limit?: number
}): Promise<Product[]> => {
  try {
    const supabase = getSupabaseClient()
    let q = supabase
      .from('products')
      .select('*, categories(name), product_variants(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (params?.category) q = q.or(`category_id.eq.${params.category},category_ids.cs.${JSON.stringify([params.category])}`)
    if (params?.search) {
      const words = params.search.trim().split(/\s+/).filter(Boolean)
      for (const w of words) {
        q = q.ilike('name', `%${escapeLike(w)}%`)
      }
    }
    if (params?.limit) q = q.limit(params.limit)

    const { data } = await q
    return ((data ?? []) as any[]).map(mapProduct)
  } catch {
    return []
  }
})

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name), product_variants(*)')
      .eq('slug', slug)
      .eq('status', 'active')
      .limit(1)
    if (error || !data?.length) return null
    return mapProduct(data[0])
  } catch {
    return null
  }
})

export const getFeaturedProducts = cache(async (): Promise<Product[]> => {
  try {
    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from('featured_products')
      .select('sort_order, products!inner(*, categories(name), product_variants(*))')
      .order('sort_order', { ascending: true })
    return ((data ?? []) as any[]).map((fp: any) => mapProduct(fp.products))
  } catch {
    return []
  }
})

function buildCategoryTree(flat: Category[]): Category[] {
  const map = new Map<string, Category>()
  for (const c of flat) map.set(c.id, { ...c, children: [] })

  const roots: Category[] = []
  for (const c of map.values()) {
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children!.push(c)
    } else {
      roots.push(c)
    }
  }
  return roots
}

export function getCategoriesFlat(): Promise<Category[]> {
  return getCategories()
}

export const getCategories = cache(async (rootOnly?: boolean): Promise<Category[]> => {
  try {
    const supabase = getSupabaseClient()
    let q = supabase.from('categories').select('id, name, slug, parent_id').order('name')
    if (rootOnly) q = q.is('parent_id', null)
    const { data } = await q
    return (data ?? []) as Category[]
  } catch {
    return []
  }
})

export async function searchProducts(query: string): Promise<Product[]> {
  return getProducts({ search: query })
}
