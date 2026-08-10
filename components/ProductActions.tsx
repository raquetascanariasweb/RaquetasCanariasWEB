"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useCartStore } from "@/store/cart"
import { useFavoritesStore } from "@/store/favorites-store"
import { addFavorite, removeFavorite } from "@/services/favorites"
import type { Product } from "@/types/product"

export default function ProductActions({ product }: { product: Product }) {
  const router = useRouter()
  const { isSignedIn } = useUser()
  const [selectedSize, setSelectedSize] = useState(
    product.sizes.length > 0 ? product.sizes[0] : ""
  )
  const [selectedColor, setSelectedColor] = useState(
    product.colors.length > 0 ? product.colors[0].name : ""
  )
  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [favLoading, setFavLoading] = useState(false)

  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)
  const addFav = useFavoritesStore((s) => s.add)
  const removeFav = useFavoritesStore((s) => s.remove)
  const isFavorite = useFavoritesStore((s) => s.isFavorite)
  const fav = isFavorite(product.id)
  const image = product.images[0]

  const handleToggleFavorite = useCallback(async () => {
    if (!isSignedIn) {
      router.push("/sign-in?redirect_url=" + encodeURIComponent(window.location.pathname))
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

  function handleAddToCart() {
    addItem({
      product_id: product.id,
      name: product.name,
      price_cents: product.price_cents,
      image: image?.url || "",
      size: selectedSize,
      color: selectedColor,
      quantity,
    })
    openCart()
  }

  return (
    <>
      {product.sizes.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-[#8A8680] uppercase tracking-wider mb-2">
            Talla
          </label>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  selectedSize === size
                    ? "border-ember bg-ember/10 text-ember"
                    : "border-[#DDD8CC] text-[#8A8680] hover:border-ember/30 hover:text-ink"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {product.colors.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-[#8A8680] uppercase tracking-wider mb-2">
            Color: {selectedColor}
          </label>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((color) => (
              <button
                key={color.slug}
                onClick={() => {
                  setSelectedColor(color.name)
                  const imgIdx = product.images.findIndex(
                    (img) => img.color?.toLowerCase() === color.slug.toLowerCase()
                  )
                  if (imgIdx >= 0) setActiveImage(imgIdx)
                }}
                className={`w-10 h-10 rounded-full border-2 transition-all ${
                  selectedColor === color.name
                    ? "border-ember scale-110"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center border border-[#DDD8CC] rounded-lg">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-2.5 text-[#A09C95] hover:text-ink transition-colors"
          >
            −
          </button>
          <span className="px-3 py-2.5 text-sm font-medium min-w-[2.5rem] text-center">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-3 py-2.5 text-[#A09C95] hover:text-ink transition-colors"
          >
            +
          </button>
        </div>

        <button
          disabled={!product.in_stock}
          onClick={handleAddToCart}
          className="flex-1 px-8 py-3 rounded-lg bg-ember text-white font-semibold text-sm transition-all duration-300 hover:bg-ember/90 hover:shadow-[0_4px_20px_-4px_rgba(61,126,154,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Añadir al carrito
        </button>

        <button
          onClick={handleToggleFavorite}
          disabled={favLoading}
          className={`shrink-0 w-11 h-11 rounded-lg border flex items-center justify-center transition-all duration-200 ${
            fav
              ? "bg-ember/10 border-ember text-ember"
              : "border-[#DDD8CC] text-[#A09C95] hover:border-ember/30 hover:text-ember"
          }`}
          aria-label={fav ? "Quitar de favoritos" : "Añadir a favoritos"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={fav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>
      </div>
    </>
  )
}
