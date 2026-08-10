import { create } from "zustand"

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

export const useFavoritesStore = create<FavoritesState>()((set, get) => ({
  items: [],
  loaded: false,
  count: () => get().items.length,
  isFavorite: (productId) => get().items.some((i) => i.product_id === productId),
  setItems: (items) => set({ items, loaded: true }),
  add: (item) => {
    if (get().items.some((i) => i.product_id === item.product_id)) return
    set({ items: [item, ...get().items] })
  },
  remove: (productId) => {
    set({ items: get().items.filter((i) => i.product_id !== productId) })
  },
}))
