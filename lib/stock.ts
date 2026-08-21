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

export async function decrementStockWithFallback(
  supabase: SupabaseAdmin,
  items: StockItem[]
): Promise<{ error?: string }> {
  for (const item of items) {
    if (!item.product_id || item.quantity <= 0) continue

    if (item.size || item.color) {
      const colorSlug = await normalizeColorSlug(supabase, item.product_id, item.color || "")

      const { data: variant, error: variantError } = await supabase
        .from("product_variants")
        .select("id, product_id, stock_quantity")
        .eq("product_id", item.product_id)
        .eq("size", item.size || "")
        .eq("color_slug", colorSlug)
        .maybeSingle()

      if (variantError) {
        console.error("[decrementStock] Variant query error:", variantError.message)
        continue
      }
      if (!variant) {
        console.warn("[decrementStock] Variant not found:", { product_id: item.product_id, size: item.size, color: colorSlug })
        continue
      }

      const newQty = Math.max(0, (variant.stock_quantity ?? 0) - item.quantity)
      const { error } = await supabase
        .from("product_variants")
        .update({ stock_quantity: newQty })
        .eq("id", variant.id)

      if (error) {
        console.error("[decrementStock] Variant update error:", error.message)
        continue
      }

      // Actualizar stock total del producto
      const { data: remaining } = await supabase
        .from("product_variants")
        .select("stock_quantity")
        .eq("product_id", variant.product_id)
      const totalLeft = (remaining ?? []).reduce((s, v) => s + (v.stock_quantity ?? 0), 0)
      await supabase
        .from("products")
        .update({ in_stock: totalLeft > 0, stock_quantity: totalLeft })
        .eq("id", variant.product_id)

      console.log(`[decrementStock] OK: variant ${variant.id} → ${newQty}`)
    } else {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id, stock_quantity")
        .eq("id", item.product_id)
        .maybeSingle()

      if (productError) {
        console.error("[decrementStock] Product query error:", productError.message)
        continue
      }
      if (!product) {
        console.warn("[decrementStock] Product not found:", item.product_id)
        continue
      }

      const newQty = Math.max(0, (product.stock_quantity ?? 0) - item.quantity)
      const { error } = await supabase
        .from("products")
        .update({ stock_quantity: newQty, in_stock: newQty > 0 })
        .eq("id", product.id)

      if (error) {
        console.error("[decrementStock] Product update error:", error.message)
        continue
      }

      console.log(`[decrementStock] OK: product ${product.id} → ${newQty}`)
    }
  }
  return {}
}
