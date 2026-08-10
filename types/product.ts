export interface WooProductImage {
  id: number
  src: string
  alt: string
}

export interface WooProductAttribute {
  id: number
  name: string
  option: string
}

export interface WooCategory {
  id: number
  name: string
  slug: string
  count: number
}

export interface WooProduct {
  id: number
  name: string
  slug: string
  price: string
  regular_price: string
  sale_price: string
  description: string
  short_description: string
  images: WooProductImage[]
  attributes: WooProductAttribute[]
  stock_status: "instock" | "outofstock" | "onbackorder"
  categories: { id: number; name: string; slug: string }[]
  average_rating: string
  review_count: number
}

export interface WooProductsResponse {
  data: WooProduct[]
  total: number
  totalPages: number
}

export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'

export interface ColorSwatch {
  name: string
  hex: string
  slug: string
}

export interface VariantImage {
  url: string
  color: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  materials: string
  price_cents: number
  compare_at_price_cents: number | null
  category_id: string | null
  category_ids?: string[]
  category_name?: string
  images: VariantImage[]
  sizes: string[]
  colors: ColorSwatch[]
  in_stock: boolean
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string | null
  children?: Category[]
}

export interface CartItem {
  id: string
  product_id: string
  name: string
  price_cents: number
  image: string
  size: string
  color: string
  quantity: number
}

export interface Order {
  id: string
  user_id: string
  status: 'pending' | 'paid' | 'fulfilled' | 'cancelled' | 'refunded'
  total_cents: number
  stripe_session_id: string | null
  items: OrderItem[]
  shipping_address: Record<string, string> | null
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  price_cents: number
  size: string
}
