import { createAdminClient } from "@/lib/supabase/admin"

export interface StockItem {
  product_id: string
  quantity: number
  size?: string
  color?: string
}

type SupabaseAdmin = ReturnType<typeof createAdminClient>

async function decrementStockFallback(
  supabase: SupabaseAdmin,
  item: StockItem
): Promise<string | undefined> {
  if (!item.product_id || item.quantity <= 0) return

  if (item.size || item.color) {
    const { data: variant, error: variantError } = await supabase
      .from("product_variants")
      .select("id, product_id, stock_quantity, track_inventory")
      .eq("product_id", item.product_id)
      .eq("size", item.size || "")
      .eq("color_slug", item.color || "")
      .maybeSingle()

    if (variantError) return variantError.message
    if (!variant?.track_inventory) return

    const newQty = Math.max(0, (variant.stock_quantity ?? 0) - item.quantity)
    const { error } = await supabase
      .from("product_variants")
      .update({ stock_quantity: newQty })
      .eq("id", variant.id)
    if (error) return error.message

    const { data: remaining } = await supabase
      .from("product_variants")
      .select("stock_quantity")
      .eq("product_id", variant.product_id)
    const totalLeft = (remaining ?? []).reduce((s, v) => s + (v.stock_quantity ?? 0), 0)
    await supabase
      .from("products")
      .update({ in_stock: totalLeft > 0, stock_quantity: totalLeft })
      .eq("id", variant.product_id)
  } else {
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, stock_quantity, track_inventory")
      .eq("id", item.product_id)
      .maybeSingle()

    if (productError) return productError.message
    if (!product?.track_inventory) return

    const newQty = Math.max(0, (product.stock_quantity ?? 0) - item.quantity)
    const { error } = await supabase
      .from("products")
      .update({ stock_quantity: newQty, in_stock: newQty > 0 })
      .eq("id", product.id)
    if (error) return error.message
  }
}

export async function decrementStockWithFallback(
  supabase: SupabaseAdmin,
  items: StockItem[]
): Promise<{ error?: string }> {
  for (const item of items) {
    const { error: rpcError } = await supabase.rpc("decrement_stock", {
      p_product_id: item.product_id,
      p_size: item.size || null,
      p_color: item.color || null,
      p_quantity: item.quantity,
    })

    if (rpcError) {
      console.warn("[decrementStock] RPC failed, using fallback:", rpcError.message)
      const fallbackError = await decrementStockFallback(supabase, item)
      if (fallbackError) {
        console.error("[decrementStock] Fallback also failed:", fallbackError)
        return { error: fallbackError }
      }
    }
  }
  return {}
}
