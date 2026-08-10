import { Suspense } from "react"
import { getProducts, getCategories } from "@/services/supabase-store"
import ProductCatalog from "@/components/ProductCatalog"

function ShopSkeleton() {
  return (
    <div className="px-6 md:px-12 max-w-[1800px] mx-auto py-8 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-8" />
      <div className="flex gap-12">
        <div className="hidden lg:block w-[260px] shrink-0 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[4/5] bg-gray-200" />
              <div className="mt-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

async function ShopContent() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ])

  return (
    <ProductCatalog
      products={products}
      categories={categories}
      activeCategorySlug={null}
    />
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopContent />
    </Suspense>
  )
}
