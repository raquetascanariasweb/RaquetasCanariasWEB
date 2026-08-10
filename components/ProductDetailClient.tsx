"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Heart } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useCartStore } from "@/store/cart"
import { useFavoritesStore } from "@/store/favorites-store"
import { getFavorites, addFavorite, removeFavorite } from "@/lib/favorites"
import { toast } from "sonner"
import type { Product } from "@/types/product"

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2)
}

export default function ProductDetailClient({ product }: { product: Product }) {
  const [selectedColor, setSelectedColor] = useState(
    product.colors.length > 0 ? product.colors[0].name : ""
  )
  const [selectedSize, setSelectedSize] = useState("")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [added, setAdded] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)
  const { isSignedIn, isLoaded } = useUser()
  const {
    isFavorite,
    add: addToFavStore,
    remove: removeFromFavStore,
    setItems,
  } = useFavoritesStore()

  useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn) {
      getFavorites()
        .then((favs) => {
          setItems(
            favs.map((f) => ({
              product_id: f.product_id,
              name: f.name,
              slug: f.slug,
              price_cents: f.price_cents,
              image: f.image,
              in_stock: f.in_stock,
            }))
          )
        })
        .catch(() => {})
    }
  }, [isLoaded, isSignedIn])

  async function handleToggleWishlist(e: React.MouseEvent) {
    e.preventDefault()
    if (!isLoaded) return
    if (!isSignedIn) {
      toast.error("Inicia sesión para guardar favoritos")
      return
    }
    if (wishlistLoading) return
    setWishlistLoading(true)
    try {
      const favorited = isFavorite(product.id)
      if (favorited) {
        const res = await removeFavorite(product.id)
        if (!res?.error) {
          removeFromFavStore(product.id)
          toast.success("Eliminado de favoritos")
        }
      } else {
        const res = await addFavorite(product.id)
        if (!res?.error) {
          addToFavStore({
            product_id: product.id,
            name: product.name,
            slug: product.slug,
            price_cents: product.price_cents,
            image: product.images?.[0]?.url ?? "",
            in_stock: product.in_stock,
          })
          toast.success("Añadido a favoritos")
        }
      }
    } catch {
      toast.error("Algo salió mal. Inténtalo de nuevo.")
    } finally {
      setWishlistLoading(false)
    }
  }

  const selectedColorSlug =
    product.colors.find((c) => c.name === selectedColor)?.slug ?? ""

  const filteredImages = product.images.filter(
    (img) => !selectedColorSlug || img.color === selectedColorSlug
  )
  const displayImages = filteredImages.length > 0 ? filteredImages : product.images
  const currentImage = displayImages[currentImageIndex]?.url ?? product.images[0]?.url ?? ""

  const handleAddToCart = () => {
    if (product.sizes.length > 0 && !selectedSize) return
    addItem({
      product_id: product.id,
      name: product.name,
      price_cents: product.price_cents,
      image: currentImage,
      size: selectedSize,
      color: selectedColor,
      quantity: 1,
    })
    setAdded(true)
    openCart()
    setTimeout(() => setAdded(false), 2000)
  }

  const isOnSale =
    product.compare_at_price_cents != null &&
    product.compare_at_price_cents > product.price_cents

  return (
    <main className="min-h-screen bg-paper pb-20">
      <div className="px-6 lg:px-8 max-w-[1400px] mx-auto">
        <nav className="flex items-center gap-2 text-[11px] tracking-wide text-[#A09C95] mb-8 pt-6">
          <a href="/" className="hover:text-ink transition-colors">Inicio</a>
          <span className="text-[#DDD8CC]">/</span>
          {product.category_name && (
            <>
              <span className="text-ink/60">{product.category_name}</span>
              <span className="text-[#DDD8CC]">/</span>
            </>
          )}
          <span className="text-ink font-medium">{product.name}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* ── Image Gallery ───────────────────────── */}
          <div className="lg:w-[55%] flex flex-row-reverse lg:flex-row gap-3">
            {/* Thumbnails — vertical on desktop, horizontal on mobile */}
            {displayImages.length > 1 && (
              <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible lg:w-16 shrink-0 pb-1 lg:pb-0">
                {displayImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative w-14 h-14 lg:w-16 lg:h-16 flex-shrink-0 overflow-hidden transition-all ${
                      idx === currentImageIndex
                        ? "ring-1 ring-ink ring-offset-1 ring-offset-paper"
                        : "opacity-50 hover:opacity-80"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={`${product.name} ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="flex-1 relative aspect-[3/4] bg-[#DDD8CC]/20 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0"
                >
                  {currentImage ? (
                    <Image
                      src={currentImage}
                      alt={product.name}
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 1024px) 100vw, 55vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-black text-white/50 text-sm">
                      Sin imagen
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {displayImages.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {displayImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        idx === currentImageIndex ? "bg-ember w-4" : "bg-white/50 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              )}

              {isOnSale && (
                <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-ember text-black">
                  -{Math.round((1 - product.price_cents / product.compare_at_price_cents!) * 100)}%
                </span>
              )}
              {!product.in_stock && (
                <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-ink text-paper">
                  Agotado
                </span>
              )}
            </div>
          </div>

          {/* ── Product Info ────────────────────────── */}
          <div className="lg:w-[45%] flex flex-col gap-5 lg:pt-0">
            {product.category_name && (
              <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-linen">
                {product.category_name}
              </p>
            )}

            <h1 className="font-display text-2xl lg:text-3xl text-ink leading-[1.1] tracking-tight">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xl font-semibold text-ink">
                {formatPrice(product.price_cents)}€
              </span>
              {isOnSale && (
                <span className="font-mono text-sm text-[#A09C95] line-through">
                  {formatPrice(product.compare_at_price_cents!)}€
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-sm text-ink/60 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            )}

            {product.materials && (
              <p className="text-xs text-linen">
                <span className="font-semibold uppercase tracking-wider text-[#8A8680]">Materiales</span>
                {" "}{product.materials}
              </p>
            )}

            {/* Color selector */}
            {product.colors.length > 0 && (
              <fieldset>
                <legend className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#8A8680] mb-2.5">
                  Color — {selectedColor}
                </legend>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color.slug}
                      onClick={() => {
                        setSelectedColor(color.name)
                        setCurrentImageIndex(0)
                      }}
                      className={`w-8 h-8 rounded-full transition-all ${
                        selectedColor === color.name
                          ? "ring-2 ring-ink ring-offset-2 ring-offset-paper scale-110"
                          : "ring-1 ring-[#DDD8CC] hover:ring-ink/30"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                      aria-label={`Color ${color.name}`}
                    />
                  ))}
                </div>
              </fieldset>
            )}

            {/* Size selector */}
            {product.sizes.length > 0 && (
              <fieldset>
                <legend className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#8A8680] mb-2.5">
                  Talla
                </legend>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[3rem] px-4 py-2.5 text-xs font-semibold tracking-wide border transition-colors ${
                        selectedSize === size
                          ? "border-ink bg-ink text-paper"
                          : "border-[#DDD8CC] text-ink/70 hover:border-ink/40 hover:text-ink"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {/* Add to cart + wishlist */}
            <div className="flex gap-3 pt-2">
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  {added ? (
                    <motion.button
                      key="added"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className="w-full h-12 bg-ember/10 border border-ember/30 text-ember font-semibold text-sm tracking-wide flex items-center justify-center gap-2"
                      disabled
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Añadido
                    </motion.button>
                  ) : (
                    <motion.button
                      key="add"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      onClick={handleAddToCart}
                      disabled={(product.sizes.length > 0 && !selectedSize) || !product.in_stock}
                      className="w-full h-12 bg-ink text-paper font-semibold text-sm tracking-wide hover:bg-ink/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {!product.in_stock
                        ? "Agotado"
                        : product.sizes.length > 0 && !selectedSize
                        ? "Selecciona una talla"
                        : "Añadir al carrito"}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                className={`flex items-center justify-center w-12 h-12 border transition-colors ${
                  isFavorite(product.id)
                    ? "bg-ember/10 border-ember/30 text-ember"
                    : "border-[#DDD8CC] text-ink/30 hover:border-ink/30 hover:text-ink/60"
                }`}
                aria-label={isFavorite(product.id) ? "Quitar de favoritos" : "Añadir a favoritos"}
              >
                <Heart size={18} strokeWidth={1.5} fill={isFavorite(product.id) ? "currentColor" : "none"} />
              </button>
            </div>

            {!product.in_stock && (
              <p className="text-xs text-linen text-center">
                Este producto no está disponible actualmente
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
