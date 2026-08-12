import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  const { userId } = await auth()
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID || "user_3G8ZXADowWQkNZdX65U1djf8JYZ"
  if (!userId || userId !== adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { stock_quantity } = await request.json()
  if (stock_quantity == null || stock_quantity < 0) {
    return NextResponse.json({ error: "Invalid stock_quantity" }, { status: 400 })
  }

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
