"use client"

import { motion } from "framer-motion"
import type { Product } from "@/types/product"

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
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
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className="group relative flex flex-col rounded-2xl bg-[#12121a] border border-[#1e1e2e] overflow-hidden transition-all duration-500 hover:border-[#00e5ff]/30 hover:shadow-[0_0_30px_-8px_rgba(0,229,255,0.15)]"
    >
      <div className="relative aspect-square overflow-hidden bg-[#0a0a0f]">
        {image && (
          <img
            src={image.url}
            alt={product.name}
            className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {!product.in_stock && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#ff1744]/20 border border-[#ff1744]/30 text-xs font-medium text-[#ff1744] backdrop-blur-sm">
            Agotado
          </div>
        )}

        {isOnSale && (
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#00c853]/20 border border-[#00c853]/30 text-xs font-medium text-[#00c853] backdrop-blur-sm">
            -{Math.round((1 - product.price_cents / product.compare_at_price_cents!) * 100)}%
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 p-4">
        <h3 className="text-sm font-medium text-[#f0f0f5] leading-tight group-hover:text-[#00e5ff] transition-colors duration-300">
          {product.name}
        </h3>

        <div className="flex items-center gap-2">
          {isOnSale ? (
            <>
              <span className="text-lg font-semibold text-[#f0f0f5]">{formatPrice(product.price_cents)}€</span>
              <span className="text-sm text-[#6b6b80] line-through">{formatPrice(product.compare_at_price_cents!)}€</span>
            </>
          ) : (
            <span className="text-lg font-semibold text-[#f0f0f5]">{formatPrice(product.price_cents)}€</span>
          )}
        </div>

        <button
          disabled={!product.in_stock}
          className="relative mt-1 w-full overflow-hidden rounded-lg border border-[#00e5ff]/20 bg-[#00e5ff]/10 px-4 py-2.5 text-sm font-medium text-[#00e5ff] transition-all duration-300 hover:bg-[#00e5ff]/20 hover:shadow-[0_0_20px_-4px_rgba(0,229,255,0.3)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:bg-[#00e5ff]/10 group/btn"
        >
          <span className="relative z-10">Añadir al carrito</span>
          <span className="absolute inset-0 bg-gradient-to-r from-[#00e5ff]/0 via-[#00e5ff]/10 to-[#00e5ff]/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out" />
        </button>
      </div>
    </motion.article>
  )
}
