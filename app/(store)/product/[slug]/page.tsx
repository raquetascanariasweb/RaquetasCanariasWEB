import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getProductBySlug } from "@/services/supabase-store"
import ProductDetailClient from "@/components/ProductDetailClient"

function LoadingSkeleton() {
  return (
    <main className="min-h-screen bg-paper pt-14">
      <div className="container-main py-12">
        <div className="animate-pulse flex flex-col lg:flex-row gap-10">
          <div className="lg:w-1/2 aspect-[4/5] bg-linen/80" />
          <div className="lg:w-1/2 space-y-4 pt-4 lg:pt-12">
            <div className="h-4 bg-linen/80 rounded w-1/4" />
            <div className="h-8 bg-linen/80 rounded w-3/4" />
            <div className="h-6 bg-linen/80 rounded w-1/3" />
            <div className="h-24 bg-linen/80 rounded" />
            <div className="h-12 bg-linen/80 rounded" />
          </div>
        </div>
      </div>
    </main>
  )
}

async function ProductContent({ slug }: { slug: string }) {
  const product = await getProductBySlug(decodeURIComponent(slug))
  if (!product) notFound()

  return <ProductDetailClient product={product} />
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(decodeURIComponent(slug))
  if (!product) return { title: "Producto no encontrado | Raquetas Canarias" }
  return {
    title: `${product.name} | Raquetas Canarias`,
    description: product.description?.slice(0, 160) || `Compra ${product.name} en Raquetas Canarias.`,
    openGraph: product.images[0]?.url ? { images: [product.images[0].url] } : undefined,
  }
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AsyncParams params={params} />
    </Suspense>
  )
}

async function AsyncParams({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <ProductContent slug={slug} />
}
