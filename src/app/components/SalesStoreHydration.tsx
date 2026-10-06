'use client'

import { useEffect, type ReactNode } from 'react'
import { useSalesStore } from '@/store/salesStore'
import { useSupplierStore } from '@/store/supplierStore'

export function SalesStoreHydration({ children }: { children: ReactNode }) {
  useEffect(() => {
    void Promise.all([
      useSalesStore.persist.rehydrate(),
      useSupplierStore.persist.rehydrate(),
    ])
  }, [])

  return children
}
