import type { WooProduct, WooCategory } from "@/types/product"

const BASE_URL = process.env.NEXT_PUBLIC_WOOCOMMERCE_URL
const CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY
const CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET

const hasCredentials =
  !!BASE_URL &&
  !!CONSUMER_KEY &&
  !!CONSUMER_SECRET &&
  !BASE_URL.includes("tusitio")

const mockCategories: WooCategory[] = [
  { id: 1, name: "Palas", slug: "palas", count: 8 },
  { id: 2, name: "Raquetas", slug: "raquetas", count: 6 },
  { id: 3, name: "Bolas", slug: "bolas", count: 5 },
  { id: 4, name: "Accesorios", slug: "accesorios", count: 12 },
  { id: 5, name: "Calzado", slug: "calzado", count: 4 },
  { id: 6, name: "Ropa", slug: "ropa", count: 10 },
]

const mockProducts: WooProduct[] = [
  {
    id: 1, name: "Pala de Pádel Pro Carbon 2026", slug: "pala-padel-pro-carbon-2026",
    price: "249.00", regular_price: "299.00", sale_price: "249.00",
    description: "Pala de fibra de carbono con núcleo de goma EVA de alta densidad.",
    short_description: "Potencia y control supremo.",
    images: [{ id: 1, src: "https://images.unsplash.com/photo-1622650509271-0c88c1c3ff52?w=600&q=80", alt: "Pala de pádel profesional" }],
    attributes: [{ id: 1, name: "Marca", option: "Sportbalin Pro" }, { id: 2, name: "Material", option: "Carbono 3K" }],
    stock_status: "instock", categories: [{ id: 1, name: "Palas", slug: "palas" }],
    average_rating: "4.8", review_count: 24,
  },
  {
    id: 2, name: "Raqueta de Tenis Aero Strike", slug: "raqueta-tenis-aero-strike",
    price: "179.00", regular_price: "179.00", sale_price: "",
    description: "Raqueta de grafito con patrón de cuerdas abierto para mayor efecto.",
    short_description: "Velocidad y efecto en cada golpe.",
    images: [{ id: 2, src: "https://images.unsplash.com/photo-1617083934393-f0a7a0b0d0a2?w=600&q=80", alt: "Raqueta de tenis profesional" }],
    attributes: [{ id: 3, name: "Marca", option: "Sportbalin Strike" }, { id: 4, name: "Peso", option: "300g" }],
    stock_status: "instock", categories: [{ id: 2, name: "Raquetas", slug: "raquetas" }],
    average_rating: "4.6", review_count: 18,
  },
  {
    id: 3, name: "Zapatillas Court Elite Pro", slug: "zapatillas-court-elite-pro",
    price: "139.00", regular_price: "159.00", sale_price: "139.00",
    description: "Zapatillas de alto rendimiento para superficies de pádel y tenis.",
    short_description: "Máxima tracción y comodidad.",
    images: [{ id: 3, src: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=80", alt: "Zapatillas de pádel y tenis" }],
    attributes: [{ id: 5, name: "Marca", option: "Sportbalin Elite" }, { id: 6, name: "Superficie", option: "Mixta" }],
    stock_status: "instock", categories: [{ id: 5, name: "Calzado", slug: "calzado" }],
    average_rating: "4.7", review_count: 31,
  },
  {
    id: 4, name: "Bolas de Pádel Pro-X 3 Estrellas", slug: "bolas-padel-pro-x",
    price: "8.50", regular_price: "8.50", sale_price: "",
    description: "Bolas de pádel de alta competición con visibilidad óptima.",
    short_description: "Máxima durabilidad y bote consistente.",
    images: [{ id: 4, src: "https://images.unsplash.com/photo-1611996575749-79a3cb250b0d?w=600&q=80", alt: "Bolas de pádel" }],
    attributes: [{ id: 7, name: "Marca", option: "Pro-X" }, { id: 8, name: "Unidades", option: "3" }],
    stock_status: "instock", categories: [{ id: 3, name: "Bolas", slug: "bolas" }],
    average_rating: "4.5", review_count: 42,
  },
  {
    id: 5, name: "Muñequera Deporte Transpirable", slug: "munequera-transpirable",
    price: "12.00", regular_price: "15.00", sale_price: "12.00",
    description: "Muñequera de microfibra para absorción de sudor.",
    short_description: "Comodidad y frescura durante el juego.",
    images: [{ id: 5, src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80", alt: "Muñequera deportiva" }],
    attributes: [{ id: 9, name: "Material", option: "Microfibra" }],
    stock_status: "instock", categories: [{ id: 4, name: "Accesorios", slug: "accesorios" }, { id: 6, name: "Ropa", slug: "ropa" }],
    average_rating: "4.3", review_count: 15,
  },
  {
    id: 6, name: "Camiseta Técnica Sportbalin Elite", slug: "camiseta-tecnica-elite",
    price: "49.00", regular_price: "49.00", sale_price: "",
    description: "Camiseta de compresión con tejido transpirable y secado rápido.",
    short_description: "Rendimiento y estilo en la pista.",
    images: [{ id: 6, src: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80", alt: "Camiseta técnica deportiva" }],
    attributes: [{ id: 10, name: "Marca", option: "Sportbalin Elite" }, { id: 11, name: "Material", option: "Poliéster reciclado" }],
    stock_status: "outofstock", categories: [{ id: 6, name: "Ropa", slug: "ropa" }],
    average_rating: "4.4", review_count: 9,
  },
]

async function fetchWoo<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = new URL(`${BASE_URL}/wp-json/wc/v3/${endpoint}`)

  if (CONSUMER_KEY && CONSUMER_SECRET) {
    url.searchParams.set("consumer_key", CONSUMER_KEY)
    url.searchParams.set("consumer_secret", CONSUMER_SECRET)
  }

  const res = await fetch(url.toString(), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  if (!res.ok) {
    throw new Error(`WooCommerce API error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

export async function getProducts(params?: {
  page?: number
  perPage?: number
  category?: number
  search?: string
}): Promise<WooProduct[]> {
  if (!hasCredentials) {
    let results = [...mockProducts]
    if (params?.category) results = results.filter((p) => p.categories.some((c) => c.id === params!.category))
    if (params?.search) results = results.filter((p) => p.name.toLowerCase().includes(params!.search!.toLowerCase()))
    return results
  }

  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.perPage) searchParams.set("per_page", String(params.perPage))
  if (params?.category) searchParams.set("category", String(params.category))
  if (params?.search) searchParams.set("search", params.search)

  const query = searchParams.toString()
  return fetchWoo<WooProduct[]>(`products${query ? `?${query}` : ""}`)
}

export async function getProductBySlug(slug: string): Promise<WooProduct | null> {
  if (!hasCredentials) {
    return mockProducts.find((p) => p.slug === slug) ?? null
  }
  const products = await fetchWoo<WooProduct[]>(`products?slug=${slug}`)
  return products[0] ?? null
}

export async function getProductById(id: number): Promise<WooProduct> {
  if (!hasCredentials) {
    const product = mockProducts.find((p) => p.id === id)
    if (!product) throw new Error(`Product ${id} not found`)
    return product
  }
  return fetchWoo<WooProduct>(`products/${id}`)
}

export async function getFeaturedProducts(): Promise<WooProduct[]> {
  if (!hasCredentials) {
    return mockProducts.slice(0, 3)
  }
  return fetchWoo<WooProduct[]>("products?featured=true")
}

export async function getCategories(): Promise<WooCategory[]> {
  if (!hasCredentials) {
    return mockCategories
  }
  return fetchWoo<WooCategory[]>("products/categories")
}

export async function searchProducts(query: string): Promise<WooProduct[]> {
  if (!hasCredentials) {
    const q = query.toLowerCase()
    return mockProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.short_description.toLowerCase().includes(q) ||
        p.categories.some((c) => c.name.toLowerCase().includes(q)),
    )
  }
  return fetchWoo<WooProduct[]>(`products?search=${encodeURIComponent(query)}`)
}
