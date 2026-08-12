"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { useCartStore } from "@/store/cart"
import ProductCard from "@/components/ProductCard"
import type { Product, Category } from "@/types/product"

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2)
}

const CATEGORY_ICONS: Record<string, string> = {
  padel: "🎾",
  tenis: "🎾",
  squash: "🏸",
  running: "👟",
  trekking: "🥾",
  natacion: "🏊",
  fitness: "💪",
  calzado: "👟",
  ropa: "👕",
  accesorios: "🧤",
  outlet: "🏷️",
}

function BannerVideo({ src, start, end }: { src: string; start?: number | null; end?: number | null }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = videoRef.current
    if (!el || start == null) return
    el.currentTime = start
  }, [start])

  useEffect(() => {
    const el = videoRef.current
    if (!el || end == null) return
    function checkTime() {
      if (el && end != null && el.currentTime >= end) {
        el.currentTime = start ?? 0
      }
    }
    el.addEventListener('timeupdate', checkTime)
    return () => el.removeEventListener('timeupdate', checkTime)
  }, [end, start])

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      style={{
        width: 'max(100vw, 177.78vh)',
        height: 'max(56.25vw, 100vh)',
        objectFit: 'cover',
      }}
    />
  )
}

function HeroBanner() {
  const [banners, setBanners] = useState<any[]>([])
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    fetch("/api/public/banners")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setBanners(data)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [banners.length])

  if (banners.length > 0) {
    const b = banners[current]

    return (
      <section className={`relative bg-ink overflow-hidden ${b.video_url ? 'h-[60vh] sm:h-[80vh]' : 'h-[45vh] sm:h-[55vh]'}`}>
        {b.video_url ? (
          <BannerVideo src={b.video_url} start={b.video_start} end={b.video_end} />
        ) : b.image_url ? (
          <Image
            src={b.image_url}
            alt={b.title || ""}
            fill
            className="object-cover opacity-60"
            priority
            sizes="100vw"
          />
        ) : null}
        <div className={`absolute inset-0 bg-gradient-to-t ${b.video_url ? 'from-ink/40 via-transparent to-transparent' : 'from-ink/60 via-transparent to-transparent'}`} />
        <div className="absolute inset-0 flex items-end pb-16 sm:pb-20 justify-center">
          <div className="text-center px-4">
            <h1
              className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]"
              style={{ color: b.title_color || "#FFFFFF" }}
            >
              {b.title}
            </h1>
            {b.subtitle && (
              <p
                className="mt-3 text-base sm:text-lg max-w-lg mx-auto"
                style={{ color: b.subtitle_color || "#EBECEE" }}
              >
                {b.subtitle}
              </p>
            )}
            {b.link_label && (
              <a
                href={b.link_url || "#"}
                className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 bg-ember text-black text-sm font-semibold tracking-wide hover:bg-ember/90 transition-colors"
              >
                {b.link_label}
              </a>
            )}
          </div>
        </div>
        {banners.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === current ? "w-6 bg-ember" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="relative h-[45vh] sm:h-[55vh] bg-gradient-to-b from-ink to-ink/90 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #C4E326 0%, transparent 50%), radial-gradient(circle at 80% 30%, #C4E326 0%, transparent 40%)",
          }}
        />
      </div>
      <div className="text-center px-4 relative z-10">
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.05]">
          El Juego Empieza Aquí
        </h1>
        <p className="mt-3 text-base sm:text-lg text-white/60 max-w-lg mx-auto">
          Equipamiento premium de pádel y tenis. Tecnología y diseño para cada golpe.
        </p>
        <a
          href="#catalogo"
          className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 bg-ember text-black text-sm font-semibold tracking-wide hover:bg-ember/90 transition-colors"
        >
          Ver colección
        </a>
      </div>
    </section>
  )
}

function SectionHeader({
  title,
  subtitle,
  href,
}: {
  title: string
  subtitle?: string
  href?: string
}) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-linen mt-1">{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="text-xs font-semibold tracking-wider uppercase text-linen hover:text-ember transition-colors"
        >
          Ver todo →
        </Link>
      )}
    </div>
  )
}

function SaleProductCard({ product, index }: { product: Product; index: number }) {
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)
  const image = product.images?.[0]
  const discount = Math.round(
    (1 - product.price_cents / product.compare_at_price_cents!) * 100
  )

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex-shrink-0 w-[220px] sm:w-[260px] group cursor-pointer"
    >
      <Link href={`/product/${product.slug}`}>
        <div className="relative aspect-[3/4] bg-[#E8E6E1] overflow-hidden mb-3">
          {image && (
            <Image
              src={image.url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="260px"
            />
          )}
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-ember text-black text-[10px] font-bold tracking-wider">
            -{discount}%
          </div>
        </div>
        <p className="text-[13px] font-medium text-ink leading-snug line-clamp-2">
          {product.name}
        </p>
      </Link>
      <div className="flex items-center gap-2 mt-1">
        <span className="font-mono text-sm font-semibold text-ink">
          {formatPrice(product.price_cents)}€
        </span>
        <span className="font-mono text-xs text-linen line-through">
          {formatPrice(product.compare_at_price_cents!)}€
        </span>
      </div>
    </motion.div>
  )
}

function SaleCarousel({ products }: { products: Product[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return
    const amount = scrollRef.current.clientWidth * 0.7
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    })
  }

  return (
    <section className="py-10 sm:py-14 px-4 sm:px-8 max-w-[1800px] mx-auto relative">
      <SectionHeader
        title="En Rebajas"
        subtitle="Aprovecha los mejores descuentos"
      />

      <div className="relative group">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg border border-[#DDD8CC] flex items-center justify-center text-ink/70 hover:text-ink hover:bg-white transition-all opacity-0 group-hover:opacity-100 -ml-2"
          aria-label="Desplazar izquierda"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-none -mx-4 sm:-mx-8 px-4 sm:px-8 scroll-smooth"
        >
          {products.map((product, i) => (
            <SaleProductCard key={product.id} product={product} index={i} />
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg border border-[#DDD8CC] flex items-center justify-center text-ink/70 hover:text-ink hover:bg-white transition-all opacity-0 group-hover:opacity-100 -mr-2"
          aria-label="Desplazar derecha"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </section>
  )
}

export default function HomeClient({
  saleProducts,
  newestProducts,
  topProducts,
  categories,
}: {
  saleProducts: Product[]
  newestProducts: Product[]
  topProducts: Product[]
  categories: Category[]
}) {
  const [blocks, setBlocks] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/public/blocks")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBlocks(data.filter((b: any) => b.active))
      })
      .catch(() => {})
  }, [])

  function renderBlock(block: any) {
    const content = block.content || {}
    switch (block.type) {
      case "custom_html":
        return (
          <section className="py-10 sm:py-14 px-4 sm:px-8 max-w-[1800px] mx-auto">
            <div dangerouslySetInnerHTML={{ __html: content.html || "" }} />
          </section>
        )
      case "richtext":
        return (
          <section className="py-10 sm:py-14 px-4 sm:px-8 max-w-[1800px] mx-auto">
            <div className="max-w-3xl mx-auto">
              {block.title && <h2 className="text-2xl font-bold text-ink mb-4">{block.title}</h2>}
              <div className="prose prose-sm max-w-none text-ink/70" dangerouslySetInnerHTML={{ __html: content.html || content.text || "" }} />
            </div>
          </section>
        )
      case "image":
        return (
          <section className="py-10 sm:py-14 px-4 sm:px-8 max-w-[1800px] mx-auto">
            {content.image_url && (
              <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden">
                <Image src={content.image_url} alt={block.title || ""} fill className="object-cover" />
              </div>
            )}
          </section>
        )
      case "quote":
        return (
          <section className="py-10 sm:py-14 px-4 sm:px-8 max-w-[1800px] mx-auto">
            <blockquote className="max-w-2xl mx-auto text-center">
              <p className="text-xl sm:text-2xl font-serif italic text-ink/80">"{content.quote || content.text}"</p>
              {content.author && <cite className="block mt-3 text-sm text-ink/50 not-italic">— {content.author}</cite>}
            </blockquote>
          </section>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-paper">
      {/* Hero */}
      <HeroBanner />

      {/* Editorial Blocks */}
      {blocks.map((block, i) => (
        <div key={block.id}>{renderBlock(block)}</div>
      ))}

      {/* Rebajas */}
      {saleProducts.length > 0 && (
        <SaleCarousel products={saleProducts} />
      )}

      {/* Destacados / Más vendidos */}
      {topProducts.length > 0 && (
        <section className="py-10 sm:py-14 px-4 sm:px-8 max-w-[1800px] mx-auto">
          <SectionHeader
            title="Más Vendidos"
            subtitle="Los favoritos de nuestros clientes"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {topProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Novedades */}
      {newestProducts.length > 0 && (
        <section id="catalogo" className="py-10 sm:py-14 px-4 sm:px-8 max-w-[1800px] mx-auto">
          <SectionHeader
            title="Novedades"
            subtitle="Lo último en equipamiento deportivo"
            href="/shop"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {newestProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="py-16 sm:py-20 text-center">
        <p className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
          ¿Listo para jugar?
        </p>
        <p className="mt-2 text-linen text-sm max-w-sm mx-auto">
          Explora nuestra colección completa de equipamiento premium.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 mt-6 px-8 py-3 bg-ink text-white text-sm font-semibold tracking-wide hover:bg-ink/90 transition-colors"
        >
          Ver todos los productos
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </section>
    </div>
  )
}
