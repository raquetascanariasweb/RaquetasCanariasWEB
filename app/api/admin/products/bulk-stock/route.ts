import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin-auth"

const BulkStockSchema = z.object({
  stock_quantity: z.number().int().min(0).max(1000000),
})

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!isAdmin(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = BulkStockSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid stock_quantity" }, { status: 400 })
  }
  const { stock_quantity } = parsed.data

  const supabase = createAdminClient()
  const { count, error } = await supabase
    .from("products")
    .update({ stock_quantity, in_stock: stock_quantity > 0 })
    .neq("status", "archived")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ updated: count ?? 0 })
}
