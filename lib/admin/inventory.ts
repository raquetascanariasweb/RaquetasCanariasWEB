'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { InventoryItem } from './types'

async function checkAdmin() {
  const { userId } = await auth()
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID || process.env.ADMIN_USER_ID || 'user_3G8ZXADowWQkNZdX65U1djf8JYZ'
  if (!userId || (adminId && userId !== adminId)) throw new Error('Unauthorized')
}

export async function getInventory(search?: string, lowStockOnly?: boolean): Promise<InventoryItem[]> {
  await checkAdmin()
  const supabase = createAdminClient()

  let q = supabase.from('products').select('*, categories(name), product_variants(*)')

  if (search) q = q.ilike('name', `%${search}%`)
  if (lowStockOnly) q = q.or('stock_quantity.lte.5,track_inventory.eq.true,and(in_stock.eq.true)')

  const { data } = await q.order('name', { ascending: true })

  return ((data ?? []) as any[]).map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku ?? '',
    track_inventory: p.track_inventory ?? false,
    stock_quantity: p.stock_quantity ?? 0,
    in_stock: p.in_stock ?? false,
    price_cents: p.price_cents,
    category_name: p.categories?.name ?? null,
    variants: (p.product_variants ?? []).map((v: any) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      color_slug: v.color_slug,
      stock_quantity: v.stock_quantity,
      track_inventory: v.track_inventory,
    })),
    created_at: p.created_at,
  }))
}

export async function updateProductStock(id: string, data: { stock_quantity?: number; track_inventory?: boolean; in_stock?: boolean }) {
  await checkAdmin()
  const supabase = createAdminClient()
  const updateData: Record<string, string | number | boolean> = {}
  if (data.stock_quantity !== undefined) updateData.stock_quantity = data.stock_quantity
  if (data.track_inventory !== undefined) updateData.track_inventory = data.track_inventory
  if (data.in_stock !== undefined) updateData.in_stock = data.in_stock
  const { error } = await supabase.from('products').update(updateData).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/inventory')
  return { success: true }
}

export async function updateVariantStock(id: string, data: { stock_quantity?: number; track_inventory?: boolean }) {
  await checkAdmin()
  const supabase = createAdminClient()
  const updateData: Record<string, string | number | boolean> = {}
  if (data.stock_quantity !== undefined) updateData.stock_quantity = data.stock_quantity
  if (data.track_inventory !== undefined) updateData.track_inventory = data.track_inventory
  const { error } = await supabase.from('product_variants').update(updateData).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/inventory')
  return { success: true }
}
