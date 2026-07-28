"use client"

import { motion } from "framer-motion"

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-[#00e5ff]/5 via-transparent to-[#12121a] pointer-events-none" />

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00e5ff]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00e5ff]/20 bg-[#00e5ff]/10 px-4 py-1.5 text-xs font-medium text-[#00e5ff] tracking-wider uppercase">
            Nueva colección 2026
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          className="text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-[#f0f0f5]"
        >
          El Juego{" "}
          <span className="bg-gradient-to-r from-[#00e5ff] to-[#06f] bg-clip-text text-transparent">
            Empieza Aquí
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="max-w-xl text-base sm:text-lg text-[#a0a0b0] leading-relaxed"
        >
          Equipamiento premium de pádel y tenis. Tecnología de vanguardia para jugadores que exigen lo mejor en cada golpe.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4 pt-4"
        >
          <a
            href="/shop"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg px-8 py-3.5 text-sm font-semibold text-[#0a0a0f] transition-all duration-300"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-[#00e5ff] to-[#06f]" />
            <span className="absolute inset-0 bg-gradient-to-r from-[#00e5ff] to-[#06f] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
            <span className="relative z-10">Ver Colección</span>
          </a>

          <a
            href="#"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg border border-[#1e1e2e] px-8 py-3.5 text-sm font-medium text-[#f0f0f5] transition-all duration-300 hover:border-[#f0f0f5]/20"
          >
            <span className="relative z-10">Saber Más</span>
          </a>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00e5ff]/20 to-transparent" />
    </section>
  )
}
