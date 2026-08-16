"use server"

import { auth } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { escapeLike } from "@/lib/utils"
import type { InventoryItem } from "./types"

async function checkAdmin() {
  const { userId } = await auth()
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID || process.env.ADMIN_USER_ID
  if (!userId || userId !== adminId) throw new Error("Unauthorized")
}

export async function getInventory(search?: string, lowStockOnly?: boolean): Promise<InventoryItem[]> {
  await checkAdmin()
  const supabase = createAdminClient()

  let q = supabase.from("products").select("*, categories(name), product_variants(*)")

  if (search) q = q.ilike("name", `%${escapeLike(search)}%`)
  if (lowStockOnly) q = q.lte("stock_quantity", 5).gt("stock_quantity", 0).eq("in_stock", true)

  const { data } = await q.order("name", { ascending: true })

  return ((data ?? []) as any[]).map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku ?? "",
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
    })),
    created_at: p.created_at,
  }))
}

export async function updateProductStock(id: string, data: { stock_quantity?: number; in_stock?: boolean }) {
  await checkAdmin()
  const supabase = createAdminClient()
  const updateData: Record<string, string | number | boolean> = {}
  if (data.stock_quantity !== undefined) updateData.stock_quantity = data.stock_quantity
  if (data.in_stock !== undefined) updateData.in_stock = data.in_stock
  const { error } = await supabase.from("products").update(updateData).eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/admin/inventory")
  revalidatePath('/')
  revalidatePath('/shop')
  return { success: true }
}

export async function updateVariantStock(id: string, data: { stock_quantity?: number }) {
  await checkAdmin()
  const supabase = createAdminClient()

  const { data: variant } = await supabase
    .from('product_variants')
    .select('product_id')
    .eq('id', id)
    .single()
  if (!variant) return { error: 'Variant not found' }

  const updateData: Record<string, string | number> = {}
  if (data.stock_quantity !== undefined) updateData.stock_quantity = data.stock_quantity
  const { error } = await supabase.from('product_variants').update(updateData).eq('id', id)
  if (error) return { error: error.message }

  // Keep product-level stock in sync with variants
  const { data: variants } = await supabase
    .from('product_variants')
    .select('stock_quantity')
    .eq('product_id', variant.product_id)
  const totalStock = (variants ?? []).reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
  await supabase
    .from('products')
    .update({ stock_quantity: totalStock, in_stock: totalStock > 0 })
    .eq('id', variant.product_id)

  revalidatePath("/admin/inventory")
  revalidatePath('/')
  revalidatePath('/shop')
  return { success: true }
}
