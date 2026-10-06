import { create } from 'zustand'
import { CatalogProduct } from '@/types' // Ajustá la ruta según donde tengas definido el tipo CatalogProduct

export interface SalesState {
  products: CatalogProduct[]
  setProducts: (products: CatalogProduct[]) => void
  addProduct: (product: CatalogProduct) => void
  updateProduct: (id: string, patch: Partial<CatalogProduct>) => void
  deleteProduct: (id: string) => void
}

export const useSalesStore = create<SalesState>((set) => ({
  products: [],
  setProducts: (products) => set({ products }),
  addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
  updateProduct: (id, patch) =>
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),
  deleteProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    })),
}))