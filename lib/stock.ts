import { createAdminClient } from "@/lib/supabase/admin"

export interface StockItem {
  product_id: string
  quantity: number
  size?: string
  color?: string
}

type SupabaseAdmin = ReturnType<typeof createAdminClient>

async function normalizeColorSlug(
  supabase: SupabaseAdmin,
  productId: string,
  color: string
): Promise<string> {
  if (!color) return ""
  // Intentar obtener el slug desde los colores del producto
  const { data: product } = await supabase
    .from("products")
    .select("colors")
    .eq("id", productId)
    .maybeSingle()

  if (product?.colors) {
    const colors = product.colors as { name: string; slug: string }[]
    const found = colors.find(
      (c) => c.name.toLowerCase() === color.toLowerCase() || c.slug.toLowerCase() === color.toLowerCase()
    )
    if (found) return found.slug
  }
  return color.toLowerCase()
}

async function decrementStockFallback(
  supabase: SupabaseAdmin,
  item: StockItem
): Promise<string | undefined> {
  if (!item.product_id || item.quantity <= 0) return

  if (item.size || item.color) {
    const colorSlug = await normalizeColorSlug(supabase, item.product_id, item.color || "")

    const { data: variant, error: variantError } = await supabase
      .from("product_variants")
      .select("id, product_id, stock_quantity")
      .eq("product_id", item.product_id)
      .eq("size", item.size || "")
      .eq("color_slug", colorSlug)
      .maybeSingle()

    if (variantError) return variantError.message
    if (!variant) return

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
      .select("id, stock_quantity")
      .eq("id", item.product_id)
      .maybeSingle()

    if (productError) return productError.message
    if (!product) return

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
    // Normalizar color a slug antes de llamar al RPC
    const colorSlug = item.color
      ? await normalizeColorSlug(supabase, item.product_id, item.color)
      : null

    const { error: rpcError } = await supabase.rpc("decrement_stock", {
      p_product_id: item.product_id,
      p_size: item.size || null,
      p_color: colorSlug,
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
