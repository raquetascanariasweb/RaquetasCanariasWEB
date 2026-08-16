"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Heart, ChevronLeft, ChevronRight, Plus, Minus, Truck, ShieldCheck } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useCartStore } from "@/store/cart"
import { useFavoritesStore } from "@/store/favorites-store"
import { getFavorites, addFavorite, removeFavorite } from "@/services/favorites"
import { getVariantMaxStock } from "@/lib/utils"
import { toast } from "sonner"
import type { Product } from "@/types/product"

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2)
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
  }),
}

export default function ProductDetailClient({ product }: { product: Product }) {
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name ?? "")
  const [selectedSize, setSelectedSize] = useState("")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [added, setAdded] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [direction, setDirection] = useState(0)

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
  }, [isLoaded, isSignedIn, setItems])

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

  const goToImage = useCallback(
    (idx: number) => {
      setDirection(idx > currentImageIndex ? 1 : -1)
      setCurrentImageIndex(idx)
    },
    [currentImageIndex]
  )

  const nextImage = useCallback(() => {
    if (displayImages.length <= 1) return
    setDirection(1)
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length)
  }, [displayImages.length])

  const prevImage = useCallback(() => {
    if (displayImages.length <= 1) return
    setDirection(-1)
    setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length)
  }, [displayImages.length])

  const handleColorChange = (colorName: string) => {
    setSelectedColor(colorName)
    setCurrentImageIndex(0)
  }

  const maxStock = getVariantMaxStock(product, selectedSize, selectedColorSlug)

  const handleAddToCart = () => {
    if (product.sizes.length > 0 && !selectedSize) {
      toast.error("Selecciona una talla")
      return
    }
    if (!product.in_stock || maxStock <= 0) {
      toast.error("Producto agotado")
      return
    }
    if (quantity > maxStock) {
      toast.error(`Solo hay ${maxStock} unidades disponibles`)
      return
    }

    addItem({
      product_id: product.id,
      name: product.name,
      price_cents: product.price_cents,
      image: currentImage,
      size: selectedSize,
      color: selectedColor,
      quantity,
      maxStock,
    })
    setAdded(true)
    openCart()
    setTimeout(() => setAdded(false), 2000)
  }

  const isOnSale =
    product.compare_at_price_cents != null &&
    product.compare_at_price_cents > product.price_cents

  const discountPercent = isOnSale
    ? Math.round((1 - product.price_cents / product.compare_at_price_cents!) * 100)
    : 0

  return (
    <main className="min-h-screen bg-paper pb-24 lg:pb-20">
      <div className="max-w-[1400px] mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[11px] tracking-wide text-[#A09C95] px-4 lg:px-8 py-4 lg:pt-6">
          <Link href="/" className="hover:text-ink transition-colors">Inicio</Link>
          <ChevronRight size={12} className="text-[#DDD8CC]" />
          {product.category_name ? (
            <>
              <span className="text-ink/60">{product.category_name}</span>
              <ChevronRight size={12} className="text-[#DDD8CC]" />
            </>
          ) : null}
          <span className="text-ink font-medium truncate">{product.name}</span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:gap-12">
          {/* ── Image Gallery ───────────────────────── */}
          <div className="w-full lg:w-[58%] xl:w-[55%]">
            {/* Mobile: full-bleed main image */}
            <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] lg:aspect-[3/4] bg-[#DDD8CC]/20 overflow-hidden lg:rounded-xl">
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                  key={currentImageIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
                  drag={displayImages.length > 1 ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.15}
                  onDragEnd={(_, info) => {
                    if (info.offset.x > 60) prevImage()
                    else if (info.offset.x < -60) nextImage()
                  }}
                  className="absolute inset-0 cursor-grab active:cursor-grabbing"
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

              {/* Navigation arrows */}
              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-ink hover:bg-white transition-colors z-10"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft size={20} strokeWidth={2} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-ink hover:bg-white transition-colors z-10"
                    aria-label="Imagen siguiente"
                  >
                    <ChevronRight size={20} strokeWidth={2} />
                  </button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                {isOnSale && (
                  <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-ember text-black rounded">
                    -{discountPercent}%
                  </span>
                )}
                {!product.in_stock && (
                  <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-ink text-paper rounded">
                    Agotado
                  </span>
                )}
              </div>

              {/* Dots indicator */}
              {displayImages.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm z-10">
                  {displayImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => goToImage(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === currentImageIndex ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                      }`}
                      aria-label={`Ver imagen ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {displayImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto px-4 lg:px-0 py-3 lg:py-4 scrollbar-none">
                {displayImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToImage(idx)}
                    className={`relative w-16 h-20 sm:w-20 sm:h-24 lg:w-16 lg:h-20 flex-shrink-0 overflow-hidden rounded-lg transition-all bg-[#DDD8CC]/20 ${
                      idx === currentImageIndex
                        ? "ring-2 ring-ink ring-offset-2 ring-offset-paper opacity-100"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={`${product.name} ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product Info ────────────────────────── */}
          <div className="flex-1 px-4 lg:px-0 pt-5 lg:pt-10 pb-6 lg:pb-0">
            <div className="max-w-xl lg:max-w-none">
              {product.category_name && (
                <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-linen mb-2">
                  {product.category_name}
                </p>
              )}

              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl text-ink leading-[1.05] tracking-tight">
                {product.name}
              </h1>

              <div className="flex items-baseline gap-3 mt-3">
                <span className="font-mono text-2xl font-semibold text-ink">
                  {formatPrice(product.price_cents)}€
                </span>
                {isOnSale && (
                  <>
                    <span className="font-mono text-base text-[#A09C95] line-through">
                      {formatPrice(product.compare_at_price_cents!)}€
                    </span>
                    <span className="text-xs font-semibold text-ember bg-ember/10 px-2 py-0.5 rounded">
                      Ahorra {formatPrice(product.compare_at_price_cents! - product.price_cents)}€
                    </span>
                  </>
                )}
              </div>

              {/* Stock / shipping hints */}
              <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-linen">
                {product.in_stock && maxStock > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    En stock
                    {maxStock < 20 ? ` (${maxStock} disponibles)` : null}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-red-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Agotado
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Truck size={13} />
                  Envío en 24-72h
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={13} />
                  Devolución 30 días
                </span>
              </div>

              {product.description && (
                <div className="mt-6">
                  <p className="text-sm text-ink/70 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {product.materials && (
                <p className="mt-4 text-xs text-linen">
                  <span className="font-semibold uppercase tracking-wider text-[#8A8680]">Materiales</span>
                  {" "}{product.materials}
                </p>
              )}

              {/* Color selector */}
              {product.colors.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#8A8680]">
                      Color
                    </span>
                    <span className="text-xs text-ink font-medium">{selectedColor}</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {product.colors.map((color) => (
                      <button
                        key={color.slug}
                        onClick={() => handleColorChange(color.name)}
                        className={`w-9 h-9 rounded-full transition-all ${
                          selectedColor === color.name
                            ? "ring-2 ring-ink ring-offset-2 ring-offset-paper scale-110"
                            : "ring-1 ring-[#DDD8CC] hover:ring-ink/40"
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                        aria-label={`Color ${color.name}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Size selector */}
              {product.sizes.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#8A8680]">
                      Talla
                    </span>
                    {selectedSize && (
                      <span className="text-xs text-ink font-medium">{selectedSize}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[2.75rem] px-3.5 py-2.5 text-xs font-semibold tracking-wide border rounded-lg transition-colors ${
                          selectedSize === size
                            ? "border-ink bg-ink text-paper"
                            : "border-[#DDD8CC] text-ink/70 hover:border-ink/40 hover:text-ink"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity selector */}
              <div className="mt-6">
                <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#8A8680] block mb-3">
                  Cantidad
                </span>
                <div className="inline-flex items-center border border-[#DDD8CC] rounded-lg bg-white">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-11 h-11 flex items-center justify-center text-ink hover:bg-linen/10 transition-colors disabled:opacity-30"
                    aria-label="Reducir cantidad"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold text-ink">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                    disabled={quantity >= maxStock}
                    className="w-11 h-11 flex items-center justify-center text-ink hover:bg-linen/10 transition-colors disabled:opacity-30"
                    aria-label="Aumentar cantidad"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {maxStock > 0 && maxStock < 20 && (
                  <p className="mt-2 text-[11px] text-linen">
                    Máximo {maxStock} unidades por pedido
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-8">
                <div className="flex-1">
                  <AnimatePresence mode="wait">
                    {added ? (
                      <motion.button
                        key="added"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        className="w-full h-14 bg-ember/10 border border-ember/30 text-ember font-semibold text-sm tracking-wide flex items-center justify-center gap-2 rounded-xl"
                        disabled
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                        disabled={(product.sizes.length > 0 && !selectedSize) || !product.in_stock || maxStock <= 0}
                        className="w-full h-14 bg-ink text-paper font-semibold text-sm tracking-wide hover:bg-ink/90 transition-colors rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {!product.in_stock || maxStock <= 0
                          ? "Agotado"
                          : product.sizes.length > 0 && !selectedSize
                          ? "Selecciona una talla"
                          : `Añadir al carrito — ${formatPrice(product.price_cents * quantity)}€`}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={handleToggleWishlist}
                  disabled={wishlistLoading}
                  className={`flex items-center justify-center w-14 h-14 border rounded-xl transition-colors ${
                    isFavorite(product.id)
                      ? "bg-ember/10 border-ember/30 text-ember"
                      : "border-[#DDD8CC] text-ink/30 hover:border-ink/30 hover:text-ink/60"
                  }`}
                  aria-label={isFavorite(product.id) ? "Quitar de favoritos" : "Añadir a favoritos"}
                >
                  <Heart size={20} strokeWidth={1.5} fill={isFavorite(product.id) ? "currentColor" : "none"} />
                </button>
              </div>

              {!product.in_stock && (
                <p className="mt-4 text-xs text-linen text-center">
                  Este producto no está disponible actualmente
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
