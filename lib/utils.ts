import { type ClassValue, clsx } from "clsx"
import type { Product } from "@/types/product"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function getVariantMaxStock(product: Product, size: string, color: string): number {
  const variants = product.variants
  if (variants && variants.length > 0) {
    const variant = variants.find(
      (v) => (v.size || "") === (size || "") && (v.color_slug || "") === (color || "")
    )
    if (variant) {
      return variant.stock_quantity ?? 0
    }
  }
  return product.stock_quantity ?? 99
}

const CURRENCY_LOCALE_MAP: Record<string, string> = {
  USD: 'en-US',
  EUR: 'es-ES',
  GBP: 'en-GB',
}

export function formatPrice(priceCents: number, currency?: string, locale?: string): string {
  const curr = currency || 'EUR'
  return new Intl.NumberFormat(locale || CURRENCY_LOCALE_MAP[curr] || 'es-ES', {
    style: 'currency',
    currency: curr,
  }).format(priceCents / 100)
}

export function formatPriceRaw(price: number, currency?: string, locale?: string): string {
  const curr = currency || 'EUR'
  return new Intl.NumberFormat(locale || CURRENCY_LOCALE_MAP[curr] || 'es-ES', {
    style: 'currency',
    currency: curr,
  }).format(price)
}
