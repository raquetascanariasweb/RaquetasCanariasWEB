import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types/product'
import { addServerCartItem, removeServerCartItem, updateServerCartItemQuantity, clearServerCart } from '@/lib/cart-actions'

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

        const currentQty = existing ? existing.quantity : 0
        const maxQty = item.maxStock ?? 99
        const newQty = currentQty + item.quantity

        if (newQty > maxQty) return

        let newItems: CartItem[]

        if (existing) {
          newItems = get().items.map((i) =>
            i.product_id === item.product_id && i.size === item.size && i.color === item.color
              ? { ...i, quantity: newQty }
              : i
          )
        } else {
          const id = crypto.randomUUID()
          newItems = [...get().items, { ...item, id }]
        }

        set({ items: newItems })
        addServerCartItem(item).catch(() => {})
      },

      removeItem: (id) => {
        const item = get().items.find((i) => i.id === id)
        if (!item) return
        set({ items: get().items.filter((i) => i.id !== id) })
        removeServerCartItem({ product_id: item.product_id, size: item.size, color: item.color }).catch(() => {})
      },

      updateQuantity: (id, quantity) => {
        const item = get().items.find((i) => i.id === id)
        if (!item) return

        const maxQty = item.maxStock ?? 99
        const clampedQty = Math.max(1, Math.min(quantity, maxQty))

        if (clampedQty < 1) {
          set({ items: get().items.filter((i) => i.id !== id) })
        } else {
          set({ items: get().items.map((i) => (i.id === id ? { ...i, quantity: clampedQty } : i)) })
        }

        updateServerCartItemQuantity(
          { product_id: item.product_id, size: item.size, color: item.color },
          clampedQty
        ).catch(() => {})
      },

      clearCart: () => {
        set({ items: [] })
        clearServerCart().catch(() => {})
      },

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    { name: 'raquetascanarias-cart' }
  )
)
