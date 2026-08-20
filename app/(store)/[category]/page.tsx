import { Suspense } from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProductsPage, getCategories } from "@/services/supabase-store"
import type { ProductsPageParams } from "@/services/supabase-store"
import type { Category } from "@/types/product"
import ProductCatalog from "@/components/ProductCatalog"

function LoadingSkeleton() {
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

function expandCategoryIds(categories: Category[], slug: string): string[] {
  const cat = categories.find((c) => c.slug === slug)
  if (!cat) return []
  const ids = [cat.id]
  const stack = [cat.id]
  while (stack.length > 0) {
    const currentId = stack.pop()!
    const children = categories.filter((c) => c.parent_id === currentId)
    for (const child of children) {
      ids.push(child.id)
      stack.push(child.id)
    }
  }
  return ids
}

function parsePage(value: string | string[] | undefined): number {
  const n = parseInt(Array.isArray(value) ? value[0] : (value ?? "1"), 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}

function buildParams(searchParams: SearchParams): ProductsPageParams {
  const params: ProductsPageParams = { page: parsePage(searchParams.page) }
  const search = Array.isArray(searchParams.search) ? searchParams.search[0] : searchParams.search
  if (search) params.search = search
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

async function CategoryContent({ slug, searchParams }: { slug: string; searchParams: SearchParams }) {
  const categories = await getCategories()

  const category = categories.find((c) => c.slug === slug)
  if (!category) notFound()

  const pageParams = buildParams(searchParams)
  pageParams.categoryIds = expandCategoryIds(categories, slug)
  const result = await getProductsPage(pageParams)

  return (
    <ProductCatalog
      products={result.products}
      categories={categories}
      activeCategorySlug={slug}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
    />
  )
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: slug } = await params
  const categories = await getCategories()
  const category = categories.find((c) => c.slug === slug)
  if (!category) return { title: "Categoría no encontrada | Raquetas Canarias" }
  return {
    title: `${category.name} | Raquetas Canarias`,
    description: `Explora nuestra colección de ${category.name.toLowerCase()} en Raquetas Canarias.`,
  }
}

export default function CategoryPage({ params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<SearchParams> }) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AsyncParams params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function AsyncParams({ params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<SearchParams> }) {
  const [{ category }, sp] = await Promise.all([params, searchParams])
  return <CategoryContent slug={category} searchParams={sp} />
}
