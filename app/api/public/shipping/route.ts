import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

export async function GET() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "shipping")
    .single()

  const value = (data?.value ?? {}) as Record<string, unknown>
  return Response.json({
    shipping_rate: isFiniteNumber(value.shipping_rate) ? value.shipping_rate : 10,
    free_shipping_threshold: isFiniteNumber(value.free_shipping_threshold)
      ? value.free_shipping_threshold
      : 200,
  })
}
