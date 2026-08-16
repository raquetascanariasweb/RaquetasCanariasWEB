import { Suspense } from "react"
import { getProductsPage, getCategories } from "@/services/supabase-store"
import type { ProductsPageParams } from "@/services/supabase-store"
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

type SearchParams = { [key: string]: string | string[] | undefined }

function parsePage(value: string | string[] | undefined): number {
  const n = parseInt(Array.isArray(value) ? value[0] : (value ?? "1"), 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}

function buildParams(searchParams: SearchParams): ProductsPageParams {
  const params: ProductsPageParams = {
    page: parsePage(searchParams.page),
  }
  const search = Array.isArray(searchParams.search) ? searchParams.search[0] : searchParams.search
  if (search) params.search = search
  if (searchParams.sin_categoria === "1") params.uncategorized = true
  const precioMin = Array.isArray(searchParams.precio_min) ? searchParams.precio_min[0] : searchParams.precio_min
  const precioMax = Array.isArray(searchParams.precio_max) ? searchParams.precio_max[0] : searchParams.precio_max
  if (precioMin) {
    const cents = Math.round(Number(precioMin) * 100)
    if (Number.isFinite(cents)) params.priceMinCents = cents
  }
  if (precioMax) {
    const cents = Math.round(Number(precioMax) * 100)
    if (Number.isFinite(cents)) params.priceMaxCents = cents
  }
  if (searchParams.stock === "1") params.inStockOnly = true
  const orden = Array.isArray(searchParams.orden) ? searchParams.orden[0] : searchParams.orden
  if (orden === "precio_asc") params.sort = "price_asc"
  else if (orden === "precio_desc") params.sort = "price_desc"
  return params
}

async function ShopContent({ searchParams }: { searchParams: SearchParams }) {
  const [result, categories] = await Promise.all([
    getProductsPage(buildParams(searchParams)),
    getCategories(),
  ])

  return (
    <ProductCatalog
      products={result.products}
      categories={categories}
      activeCategorySlug={null}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
    />
  )
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopContent searchParams={await searchParams} />
    </Suspense>
  )
}
