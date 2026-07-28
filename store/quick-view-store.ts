import { create } from 'zustand'

export type QuickViewProduct = {
  id: string
  name: string
  slug: string
  price_cents: number
  compare_at_price_cents: number | null
  description: string | null
  images: { url: string; color: string }[]
  sizes: string[]
  colors: { name: string; hex: string; slug: string }[]
  category_name: string | null
  in_stock: boolean
}

interface QuickViewState {
  isOpen: boolean
  product: QuickViewProduct | null
  open: (product: QuickViewProduct) => void
  close: () => void
}

export const useQuickViewStore = create<QuickViewState>((set) => ({
  isOpen: false,
  product: null,
  open: (product) => set({ isOpen: true, product }),
  close: () => set({ isOpen: false, product: null }),
}))
