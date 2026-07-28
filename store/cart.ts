import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types/product'

interface CartState {
  items: CartItem[]
  loaded: boolean
  isOpen: boolean
  setItems: (items: CartItem[]) => void
  setLoaded: (loaded: boolean) => void
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  subtotal: () => number
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      loaded: false,
      isOpen: false,

      setItems: (items) => set({ items, loaded: true }),
      setLoaded: (loaded) => set({ loaded }),

      addItem: (item) => {
        const existing = get().items.find(
          (i) => i.product_id === item.product_id && i.size === item.size && i.color === item.color
        )
        let newItems: CartItem[]

        if (existing) {
          newItems = get().items.map((i) =>
            i.product_id === item.product_id && i.size === item.size && i.color === item.color
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          )
        } else {
          const id = crypto.randomUUID()
          newItems = [...get().items, { ...item, id }]
        }

        set({ items: newItems })
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) })
      },

      updateQuantity: (id, quantity) => {
        if (quantity < 1) {
          set({ items: get().items.filter((i) => i.id !== id) })
        } else {
          set({ items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)) })
        }
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    { name: 'sportbalin-cart' }
  )
)
