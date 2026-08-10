import type { Category } from "@/types/product"
import { getCategories } from "@/services/supabase-store"
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

  return (
    <>
      <NavbarWrapper categories={categories} />
      <main className="flex-1">{children}</main>
      <FooterWrapper />
      <CartDrawerWrapper />
    </>
  )
}
