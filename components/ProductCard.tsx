"use client"

import { motion } from "framer-motion"
import type { Product } from "@/types/product"

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2)
}

export default function ProductCard({ product, index }: { product: Product; index: number }) {
  const image = product.images?.[0]
  const isOnSale = product.compare_at_price_cents != null && product.compare_at_price_cents > product.price_cents

  return (
    <motion.article
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
      className="group relative flex flex-col rounded-xl bg-white border border-[#DDD8CC] overflow-hidden transition-all duration-300 hover:border-ember/30 hover:shadow-[0_4px_20px_-8px_rgba(61,126,154,0.12)]"
    >
      <div className="relative aspect-square overflow-hidden bg-linen/50">
        {image && (
          <img
            src={image.url}
            alt={product.name}
            className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {!product.in_stock && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-ember/15 border border-ember/25 text-xs font-medium text-ember">
            Agotado
          </div>
        )}

        {isOnSale && (
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-green-100 border border-green-200 text-xs font-medium text-green-700">
            -{Math.round((1 - product.price_cents / product.compare_at_price_cents!) * 100)}%
          </div>
        )}
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
          className="relative mt-1 w-full overflow-hidden rounded-lg border border-ember/20 bg-ember/10 px-4 py-2.5 text-sm font-medium text-ember transition-all duration-300 hover:bg-ember/20 hover:shadow-[0_0_20px_-4px_rgba(61,126,154,0.15)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:bg-ember/10"
        >
          <span className="relative z-10">Añadir al carrito</span>
        </button>
      </div>
    </motion.article>
  )
}
