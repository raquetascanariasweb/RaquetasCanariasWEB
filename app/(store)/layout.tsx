import type { Category } from "@/types/product"
import { getCategories } from "@/services/supabase-store"
import { isAdmin } from "@/lib/admin-auth"
import { auth } from "@clerk/nextjs/server"
import NavbarWrapper from "@/components/NavbarWrapper"
import CartDrawerWrapper from "@/components/CartDrawerWrapper"
import FooterWrapper from "@/components/FooterWrapper"

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let categories: Category[] = []
  try {
    categories = await getCategories()
  } catch {}

  const { userId } = await auth()
  const admin = isAdmin(userId)

  return (
    <>
      <NavbarWrapper categories={categories} isAdmin={admin} />
      <main className="flex-1">{children}</main>
      <FooterWrapper />
      <CartDrawerWrapper />
    </>
  )
}
