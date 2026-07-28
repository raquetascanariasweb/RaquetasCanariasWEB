import { type ClassValue, clsx } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
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
