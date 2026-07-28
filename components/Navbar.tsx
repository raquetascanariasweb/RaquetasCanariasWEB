"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useCartStore } from "@/store/cart"
import SearchBar from "./SearchBar"
import type { Category } from "@/types/product"
import { useUser, UserButton } from "@clerk/nextjs"

export default function Navbar({ categories }: { categories: Category[] }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const itemCount = useCartStore((s) => s.totalItems())
  const { isSignedIn } = useUser()

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-slate border-b border-white/10" />

      <nav className="relative z-10 container-main flex items-center justify-between h-16 sm:h-18">
        <Link href="/" className="text-lg font-bold text-white tracking-tight">
          Sport<span className="text-ember">balin</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/?categoria=${cat.slug}`}
              className="px-3 py-2 text-sm text-white/60 rounded-lg transition-all duration-200 hover:text-white hover:bg-white/10"
            >
              {cat.name}
            </Link>
          ))}
          <span className="w-px h-5 bg-white/15 mx-1" />
          <Link
            href="/about"
            className="px-3 py-2 text-sm text-white/60 rounded-lg transition-all duration-200 hover:text-white hover:bg-white/10"
          >
            Sobre Nosotros
          </Link>
          <Link
            href="/terms"
            className="px-3 py-2 text-sm text-white/60 rounded-lg transition-all duration-200 hover:text-white hover:bg-white/10"
          >
            Condiciones de Venta
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block w-48 lg:w-64">
            <SearchBar />
          </div>

          <Link
            href="/cart"
            className="relative flex items-center justify-center w-9 h-9 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-4.5 h-4.5 rounded-full bg-ember text-[10px] font-bold text-white leading-none">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>

          {isSignedIn ? (
            <>
              <Link
                href="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-200"
              >
                Admin
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                  },
                }}
              />
            </>
          ) : (
            <Link
              href="/sign-in"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-ember border border-ember/30 rounded-lg hover:bg-ember/5 transition-all duration-200"
            >
              Iniciar Sesión
            </Link>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden relative flex items-center justify-center w-9 h-9 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
            aria-label="Menú"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {mobileOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-b border-white/10 bg-slate/95"
          >
            <div className="container-main py-4 flex flex-col gap-1">
              <div className="sm:hidden pb-3">
                <SearchBar />
              </div>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/?categoria=${cat.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 text-sm text-white/60 rounded-lg transition-all duration-200 hover:text-white hover:bg-white/10"
                >
                  {cat.name}
                </Link>
              ))}
              <div className="h-px bg-white/15 my-2" />
              <Link
                href="/about"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 text-sm text-white/60 rounded-lg transition-all duration-200 hover:text-white hover:bg-white/10"
              >
                Sobre Nosotros
              </Link>
              <Link
                href="/terms"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 text-sm text-white/60 rounded-lg transition-all duration-200 hover:text-white hover:bg-white/10"
              >
                Condiciones de Venta
              </Link>

              <div className="h-px bg-white/15 my-2" />

              {isSignedIn ? (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-white rounded-lg transition-all duration-200 hover:bg-white/10"
                >
                  Panel Admin
                </Link>
              ) : (
                <Link
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-ember rounded-lg transition-all duration-200 hover:bg-ember/5"
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
