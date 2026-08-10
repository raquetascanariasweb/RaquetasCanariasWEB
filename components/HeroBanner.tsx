"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

interface Banner {
  id: string
  image_url: string
  title?: string
  subtitle?: string
  link_label?: string
  link_url?: string
  title_color?: string | null
  subtitle_color?: string | null
  sort_order: number
  active: boolean
}

export default function HeroBanner() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [currentBanner, setCurrentBanner] = useState(0)

  useEffect(() => {
    fetch("/api/public/banners")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setBanners(data)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [banners.length])

  const hasBanners = banners.length > 0
  const activeBanner = banners[currentBanner]

  return (
    <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden">
      {/* Background: dark gradient with subtle light flares */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#111] to-[#1a1a1a]" />

      {/* Light flare: top center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#C4E326] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />

      {/* Light flare: bottom right */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[350px] bg-[#C4E326] opacity-[0.02] blur-[100px] rounded-full pointer-events-none" />

      {/* Subtle grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {hasBanners ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeBanner.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            {activeBanner.image_url && (
              <Image
                src={activeBanner.image_url}
                alt={activeBanner.title || ""}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/60" />
          </motion.div>
        </AnimatePresence>
      ) : null}

      {!loading && (
        <div className="relative z-10 container-main text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {hasBanners ? (
              <>
                <h1
                  className="font-display text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.1] tracking-tight"
                  style={{ color: activeBanner.title_color || "#FFFFFF" }}
                >
                  {activeBanner.title}
                </h1>
                {activeBanner.subtitle && (
                  <p
                    className="mt-4 text-lg sm:text-xl max-w-xl mx-auto font-light leading-relaxed"
                    style={{ color: activeBanner.subtitle_color || "#EBECEE" }}
                  >
                    {activeBanner.subtitle}
                  </p>
                )}
              </>
            ) : (
              <>
                <h1
                  className="font-display text-5xl sm:text-6xl md:text-7xl font-bold text-[#C4E326] leading-[1.1] tracking-tight"
                  style={{
                    textShadow:
                      "0 0 20px rgba(196,227,38,0.5), 0 0 40px rgba(196,227,38,0.25), 0 0 80px rgba(196,227,38,0.12), 0 0 120px rgba(196,227,38,0.06)",
                  }}
                >
                  El Juego
                  <br />
                  Empieza Aquí
                </h1>
                <p
                  className="mt-4 text-lg sm:text-xl max-w-xl mx-auto font-light leading-relaxed text-white/85"
                  style={{
                    textShadow: "0 0 12px rgba(255,255,255,0.15), 0 0 30px rgba(255,255,255,0.05)",
                  }}
                >
                  Equipamiento premium de pádel y tenis. Tecnología y diseño para cada golpe.
                </p>
              </>
            )}

            {activeBanner?.link_label ? (
              <a
                href={activeBanner.link_url || "#"}
                className="inline-flex items-center gap-2 mt-8 px-8 py-3.5 rounded-xl bg-ember text-black font-semibold text-sm transition-all duration-300 hover:bg-ember/90 hover:shadow-[0_0_30px_-4px_rgba(196,227,38,0.5)]"
              >
                {activeBanner.link_label}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                </svg>
              </a>
            ) : (
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 mt-8 px-8 py-3.5 rounded-xl bg-[#C4E326] text-black font-semibold text-sm transition-all duration-300 hover:bg-[#d4f533] hover:shadow-[0_0_30px_-4px_rgba(196,227,38,0.5)] hover:scale-[1.02]"
              >
                Ver Colección
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            )}
          </motion.div>
        </div>
      )}

      {hasBanners && banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentBanner(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === currentBanner ? "bg-ember w-6" : "bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
