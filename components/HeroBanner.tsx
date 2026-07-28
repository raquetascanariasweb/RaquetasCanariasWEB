"use client"

import { motion } from "framer-motion"

export default function HeroBanner() {
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate via-[#1a1a1a] to-black">
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(196,227,38,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(196,227,38,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-ember/5 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-ember/8 blur-3xl" />

      <div className="relative z-10 container-main text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1
            className="font-display text-5xl sm:text-6xl md:text-7xl font-bold text-ember leading-[1.1] tracking-tight"
            style={{
              textShadow: "0 0 20px rgba(196,227,38,0.4), 0 0 40px rgba(196,227,38,0.2), 0 0 80px rgba(196,227,38,0.1)",
            }}
          >
            El Juego
            <br />
            Empieza Aquí
          </h1>
          <p className="mt-4 text-paper/80 text-lg sm:text-xl max-w-xl mx-auto font-light leading-relaxed">
            Equipamiento premium de pádel y tenis. Tecnología y diseño para cada golpe.
          </p>
          <a
            href="#productos"
            className="inline-flex items-center gap-2 mt-8 px-8 py-3.5 rounded-xl bg-ember text-black font-semibold text-sm transition-all duration-300 hover:bg-ember/90 hover:shadow-[0_0_24px_-4px_rgba(196,227,38,0.4)]"
          >
            Ver Colección
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  )
}
