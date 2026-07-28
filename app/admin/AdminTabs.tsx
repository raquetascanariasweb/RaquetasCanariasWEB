'use client'

import { useState } from 'react'
import { ProductForm } from './ProductForm'
import { CategoryManager } from './CategoryManager'
import { ProductList } from './ProductList'
import { Plus, Layers, List } from 'lucide-react'

const tabs = [
  { id: 'products', label: 'Products', icon: List },
  { id: 'add-product', label: 'Add Product', icon: Plus },
  { id: 'categories', label: 'Categories', icon: Layers },
] as const

export function AdminTabs() {
  const [active, setActive] = useState('products')

  return (
    <div>
      <div className="flex gap-1 border-b border-luxury-charcoal/50 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-sans uppercase tracking-wider transition-all duration-300 border-b-2 -mb-[1px] ${
                active === tab.id
                  ? 'border-luxury-gold text-luxury-gold'
                  : 'border-transparent text-luxury-ivory/40 hover:text-luxury-ivory/70'
              }`}
            >
              <Icon size={14} strokeWidth={1.5} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {active === 'products' && <ProductList />}
      {active === 'add-product' && <ProductForm />}
      {active === 'categories' && <CategoryManager />}
    </div>
  )
}
