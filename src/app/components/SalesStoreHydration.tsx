'use client'

import { useEffect, type ReactNode } from 'react'
import { useSalesStore } from '@/store/salesStore'
import { useSupplierStore } from '@/store/supplierStore'
import { createClient } from '@/lib/supabase/client'

export function SalesStoreHydration({ children }: { children: ReactNode }) {
  const setProducts = useSalesStore((state) => state.setProducts)
  const supabase = createClient()

  useEffect(() => {
    async function initStores() {
      // 1. Rehidratar el almacenamiento local (persist)
      await Promise.all([
        useSalesStore.persist.rehydrate(),
        useSupplierStore.persist.rehydrate(),
      ])

      // 2. Traer el catálogo actualizado desde Supabase a Zustand
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error al sincronizar con Supabase:', error.message)
      } else if (data) {
        setProducts(data)
      }
    }

    initStores()
  }, [setProducts, supabase])

  return <>{children}</>
}