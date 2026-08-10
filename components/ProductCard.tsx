"use client"

import { memo, useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { useUser } from "@clerk/nextjs"
import { useCartStore } from "@/store/cart"
import { useFavoritesStore } from "@/store/favorites-store"
import { addFavorite, removeFavorite } from "@/services/favorites"
import type { Product } from "@/types/product"

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2)
}

function ProductCardInner({ product, index }: { product: Product; index: number }) {
  const router = useRouter()
  const { isSignedIn } = useUser()
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)
  const addFav = useFavoritesStore((s) => s.add)
  const removeFav = useFavoritesStore((s) => s.remove)
  const isFavorite = useFavoritesStore((s) => s.isFavorite)
  const [favLoading, setFavLoading] = useState(false)

  const image = product.images?.[0]
  const isOnSale = product.compare_at_price_cents != null && product.compare_at_price_cents > product.price_cents
  const fav = isFavorite(product.id)

  const goToProduct = useCallback(() => {
    router.push(`/product/${product.slug}`)
  }, [router, product.slug])

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!product.in_stock) return
    addItem({
      product_id: product.id,
      name: product.name,
      price_cents: product.price_cents,
      image: image?.url || "",
      size: product.sizes[0] || "",
      color: product.colors[0]?.name || "",
      quantity: 1,
    })
    openCart()
  }, [product, image, addItem, openCart])

  const handleToggleFavorite = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isSignedIn) {
      router.push("/sign-in?redirect_url=" + encodeURIComponent(window.location.pathname + window.location.search))
      return
    }
    if (favLoading) return
    setFavLoading(true)

    if (fav) {
      removeFav(product.id)
      await removeFavorite(product.id)
    } else {
      addFav({
        product_id: product.id,
        name: product.name,
        price_cents: product.price_cents,
        image: image?.url || "",
        slug: product.slug,
        in_stock: product.in_stock,
      })
      await addFavorite(product.id)
    }

    setFavLoading(false)
  }, [fav, favLoading, isSignedIn, product, image, addFav, removeFav, router])

  return (
    <motion.article
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
      onClick={goToProduct}
      className="group relative flex flex-col rounded-xl bg-white border border-[#DDD8CC] overflow-hidden transition-all duration-300 hover:border-ember/30 hover:shadow-[0_4px_20px_-8px_rgba(61,126,154,0.12)] cursor-pointer"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#E8E6E1]">
        {image ? (
          <Image
            src={image.url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-all duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black text-white/50 text-sm">
            Sin imagen
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {!product.in_stock && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-ember/15 border border-ember/25 text-xs font-medium text-ember">
            Agotado
          </div>
        )}

        {isOnSale && !product.in_stock && (
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-green-100 border border-green-200 text-xs font-medium text-green-700">
            -{Math.round((1 - product.price_cents / product.compare_at_price_cents!) * 100)}%
          </div>
        )}
        {isOnSale && product.in_stock && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-green-100 border border-green-200 text-xs font-medium text-green-700">
            -{Math.round((1 - product.price_cents / product.compare_at_price_cents!) * 100)}%
          </div>
        )}

        <button
          onClick={handleToggleFavorite}
          disabled={favLoading}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
            fav
              ? "bg-ember text-white shadow-md"
              : "bg-white/70 text-[#8A8680] hover:bg-white hover:text-ember opacity-0 group-hover:opacity-100"
          } ${fav ? "opacity-100" : ""}`}
          aria-label={fav ? "Quitar de favoritos" : "Añadir a favoritos"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={fav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <h3 className="text-sm font-medium text-ink leading-tight group-hover:text-ember transition-colors duration-300">
          {product.name}
        </h3>

        <div className="flex items-center gap-2">
          {isOnSale ? (
            <>
              <span className="font-mono text-lg font-semibold text-ink">{formatPrice(product.price_cents)}€</span>
              <span className="font-mono text-sm text-[#A09C95] line-through">{formatPrice(product.compare_at_price_cents!)}€</span>
            </>
          ) : (
            <span className="font-mono text-lg font-semibold text-ink">{formatPrice(product.price_cents)}€</span>
          )}
        </div>

        <button
          disabled={!product.in_stock}
          onClick={handleAddToCart}
          className="relative mt-1 w-full overflow-hidden rounded-lg border border-ember/20 bg-ember/10 px-4 py-2.5 text-sm font-medium text-ember transition-all duration-300 hover:bg-ember/20 hover:shadow-[0_0_20px_-4px_rgba(61,126,154,0.15)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:bg-ember/10"
        >
          <span className="relative z-10">Añadir al carrito</span>
        </button>
      </div>
    </motion.article>
  )
}

const ProductCard = memo(ProductCardInner)
export default ProductCard
