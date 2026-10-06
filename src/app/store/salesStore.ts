import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SalesSection = 'cafeteria' | 'heladeria' | 'bar' | 'almacen' | 'mesas' | 'delivery'

export interface CatalogProduct {
  id: string
  name: string
  category: string
  price: number
  stock: number
  unit: string
  sections: SalesSection[]
  active: boolean
  offerName?: string | null
  offerPrice?: number | null
  isWeightBased?: boolean
}

export interface SalesState {
  products: CatalogProduct[]
  setProducts: (products: CatalogProduct[]) => void
  addProduct: (product: CatalogProduct) => void
  updateProduct: (id: string, patch: Partial<CatalogProduct>) => void
  deleteProduct: (id: string) => void
}

export const useSalesStore = create<SalesState>()(
  persist(
    (set) => ({
      products: [],

      setProducts: (products) => set({ products }),

      addProduct: (product) =>
        set((state) => ({
          products: [...state.products, product],
        })),

      updateProduct: (id, patch) =>
        set((state) => ({
          products: state.products.map((item) =>
            item.id === id ? { ...item, ...patch } : item
          ),
        })),

      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((item) => item.id !== id),
        })),
    }),
    {
      name: 'sales-store',
      skipHydration: true,
    }
  )
)