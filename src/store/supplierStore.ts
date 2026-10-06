'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Supplier = {
  id: string
  name: string
  contact: string
  notes: string
  createdAt: string
}

export type SupplierEntryType = 'purchase' | 'payment'

export type SupplierEntry = {
  id: string
  supplierId: string
  type: SupplierEntryType
  detail: string
  amount: number
  date: string
  reference: string
  paymentMethod: string
  createdAt: string
}

type SupplierState = {
  suppliers: Supplier[]
  entries: SupplierEntry[]
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void
  updateSupplier: (id: string, changes: Partial<Omit<Supplier, 'id' | 'createdAt'>>) => void
  removeSupplier: (id: string) => void
  addEntry: (entry: Omit<SupplierEntry, 'id' | 'createdAt'>) => void
  removeEntry: (id: string) => void
}

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`

export const useSupplierStore = create<SupplierState>()(
  persist(
    (set) => ({
      suppliers: [],
      entries: [],
      addSupplier: (supplier) => {
        set((state) => ({
          suppliers: [{ ...supplier, id: makeId('supplier'), createdAt: new Date().toISOString() }, ...state.suppliers],
        }))
      },
      updateSupplier: (id, changes) => {
        set((state) => ({
          suppliers: state.suppliers.map((supplier) => supplier.id === id ? { ...supplier, ...changes } : supplier),
        }))
      },
      removeSupplier: (id) => {
        set((state) => ({
          suppliers: state.suppliers.filter((supplier) => supplier.id !== id),
          entries: state.entries.filter((entry) => entry.supplierId !== id),
        }))
      },
      addEntry: (entry) => {
        set((state) => ({
          entries: [{ ...entry, id: makeId('supplier-entry'), createdAt: new Date().toISOString() }, ...state.entries],
        }))
      },
      removeEntry: (id) => {
        set((state) => ({ entries: state.entries.filter((entry) => entry.id !== id) }))
      },
    }),
    {
      name: 'emilia-supplier-book',
      version: 2,
      migrate: () => ({ suppliers: [], entries: [] }),
      partialize: (state) => ({ suppliers: state.suppliers, entries: state.entries }),
      skipHydration: true,
    },
  ),
)
