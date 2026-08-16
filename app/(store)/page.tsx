import { Suspense } from "react"
import { getProducts, getFeaturedProducts, getCategories } from "@/services/supabase-store"
import { getNewsTicker } from "@/lib/settings-public"
import HomeClient from "@/components/HomeClient"
import type { Product, Category } from "@/types/product"

export const dynamic = "force-dynamic"

function HomeSkeleton() {
  return (
    <div className="space-y-16 pb-20 animate-pulse">
      <div className="h-[50vh] bg-linen/30" />
      <div className="px-8">
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-24 h-24 rounded-full bg-linen/30 shrink-0" />
          ))}
        </div>
      </div>
      <div className="px-8">
        <div className="h-8 w-40 bg-linen/30 rounded mb-6" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[260px] h-[340px] bg-linen/20 rounded shrink-0" />
          ))}
        </div>
      </div>
    </div>
  )
}

async function HomeContent() {
  const [products, featured, categories, newsTicker] = await Promise.all([
    getProducts({ limit: 100 }),
    getFeaturedProducts(),
    getCategories(),
    getNewsTicker(),
  ])

  const saleProducts = products
    .filter((p) => p.compare_at_price_cents != null && p.compare_at_price_cents > p.price_cents)
    .slice(0, 8)

  const newestProducts = products.slice(0, 8)
  const topProducts = featured.length > 0 ? featured : newestProducts.slice(0, 4)
  const rootCategories = categories
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <HomeClient
      saleProducts={saleProducts}
      newestProducts={newestProducts}
      topProducts={topProducts}
      categories={rootCategories}
      newsTicker={newsTicker}
    />
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  )
}
