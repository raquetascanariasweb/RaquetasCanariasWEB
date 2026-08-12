import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { createPublicClient } from '@/lib/supabase/public'
import type { Product, Category } from '@/types/product'

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

export const getProducts = cache(async (params?: {
  category?: string
  search?: string
}): Promise<Product[]> => {
  try {
    const supabase = getSupabaseClient()
    let q = supabase
      .from('products')
      .select('*, categories(name), product_variants(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (params?.category) q = q.or(`category_id.eq.${params.category},category_ids.cs.{${JSON.stringify([params.category]).slice(1, -1)}}`)
    if (params?.search) {
      const words = params.search.trim().split(/\s+/).filter(Boolean)
      for (const w of words) {
        q = q.ilike('name', `%${w}%`)
      }
    }

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
