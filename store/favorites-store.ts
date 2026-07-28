import { create } from 'zustand'

export interface FavoriteItem {
  product_id: string
  name: string
  price_cents: number
  image: string
  slug: string
  in_stock: boolean
}

interface FavoritesState {
  items: FavoriteItem[]
  loaded: boolean
  count: () => number
  isFavorite: (productId: string) => boolean
  setItems: (items: FavoriteItem[]) => void
  add: (item: FavoriteItem) => void
  remove: (productId: string) => void
}

const stored = typeof window !== 'undefined' ? localStorage.getItem('sportbalin-favorites') : null
const initialItems: FavoriteItem[] = stored ? JSON.parse(stored) : []

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  items: initialItems,
  loaded: false,
  count: () => get().items.length,
  isFavorite: (productId) => get().items.some((i) => i.product_id === productId),
  setItems: (items) => {
    set({ items, loaded: true })
    if (typeof window !== 'undefined') localStorage.setItem('sportbalin-favorites', JSON.stringify(items))
  },
  add: (item) => {
    if (get().items.some((i) => i.product_id === item.product_id)) return
    const newItems = [item, ...get().items]
    set({ items: newItems })
    if (typeof window !== 'undefined') localStorage.setItem('sportbalin-favorites', JSON.stringify(newItems))
  },
  remove: (productId) => {
    const newItems = get().items.filter((i) => i.product_id !== productId)
    set({ items: newItems })
    if (typeof window !== 'undefined') localStorage.setItem('sportbalin-favorites', JSON.stringify(newItems))
  },
}))
