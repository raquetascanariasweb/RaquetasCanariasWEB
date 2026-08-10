"use client"

import Link from "next/link"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { useFavoritesStore } from "@/store/favorites-store"
import { removeFavorite } from "@/services/favorites"

export default function WishlistPage() {
  const { isSignedIn } = useUser()
  const { items, loaded, remove: removeFromStore } = useFavoritesStore()

  function formatPrice(cents: number) {
    return (cents / 100).toFixed(2)
  }

  async function handleRemove(productId: string) {
    removeFromStore(productId)
    await removeFavorite(productId)
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-paper pt-24">
        <div className="container-main py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-white border border-linen/60 overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-linen/80" />
                <div className="p-4 flex flex-col gap-3">
                  <div className="h-4 bg-linen/80 rounded w-3/4" />
                  <div className="h-5 bg-linen/80 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      <section className="pt-24 pb-12">
        <div className="container-main">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl lg:text-4xl font-bold text-ink">
                Favoritos
              </h1>
              <p className="text-sm text-[#A09C95] mt-1">
                {items.length} {items.length === 1 ? "producto" : "productos"}
              </p>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-linen/80 border border-[#DDD8CC] flex items-center justify-center mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#A09C95]">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </div>
              <h2 className="text-xl font-display font-semibold text-ink mb-2">
                Tu lista de favoritos está vacía
              </h2>
              <p className="text-sm text-[#8A8680] max-w-sm mb-6">
                {isSignedIn
                  ? "Guarda tus productos favoritos pulsando el corazón en cualquier producto."
                  : "Inicia sesión para guardar tus productos favoritos."}
              </p>
              <Link
                href="/"
                className="px-6 py-3 rounded-xl bg-ember text-white font-semibold text-sm hover:bg-ember/90 transition-colors"
              >
                Explorar colección
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {items.map((item) => (
                <div
                  key={item.product_id}
                  className="group relative rounded-xl bg-white border border-[#DDD8CC] overflow-hidden hover:border-ember/30 hover:shadow-md transition-all duration-300"
                >
                  <Link href={`/product/${item.slug}`}>
                    <div className="relative aspect-[3/4] overflow-hidden bg-[#E8E6E1]">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[#A09C95] text-sm">
                          Sin imagen
                        </div>
                      )}

                      {!item.in_stock && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium">
                            Agotado
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <button
                    onClick={() => handleRemove(item.product_id)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-[#8A8680] hover:text-ember hover:bg-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                    aria-label="Quitar de favoritos"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>

                  <div className="p-4">
                    <Link href={`/product/${item.slug}`}>
                      <h3 className="text-sm font-medium text-ink leading-tight hover:text-ember transition-colors line-clamp-2">
                        {item.name}
                      </h3>
                    </Link>
                    <p className="font-mono text-base font-semibold text-ink mt-2">
                      {formatPrice(item.price_cents)}€
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
