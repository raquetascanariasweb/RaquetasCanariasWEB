import ProductCard from "@/components/ProductCard"
import HeroSection from "@/components/HeroSection"
import { getProducts } from "@/services/supabase-store"
import type { Product } from "@/types/product"

export default async function Home() {
  const products: Product[] = await getProducts()
  return (
    <main>
      <HeroSection />

      <section id="productos" className="container-main py-20 sm:py-28">
        <div className="flex flex-col items-center gap-3 text-center mb-14">
          <span className="text-xs font-medium text-[#00e5ff] tracking-[0.2em] uppercase">
            Productos Destacados
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#f0f0f5]">
            Lo Más Vendido
          </h2>
          <p className="max-w-md text-[#a0a0b0] text-sm">
            Equipamiento seleccionado por nuestros jugadores profesionales.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.slice(0, 6).map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </section>

      <footer className="border-t border-[#1e1e2e] py-8 text-center text-sm text-[#6b6b80]">
        <div className="container-main">
          <p>&copy; {new Date().getFullYear()} Sportbalin. Todos los derechos reservados.</p>
        </div>
      </footer>
    </main>
  )
}
