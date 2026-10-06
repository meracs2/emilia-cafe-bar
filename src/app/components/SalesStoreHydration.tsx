'use client'

import { useEffect, type ReactNode } from 'react'
import { useSalesStore } from '@/store/salesStore'
import { useSupplierStore } from '@/store/supplierStore'
import { createClient } from '@/lib/supabase/client'

export function SalesStoreHydration({ children }: { children: ReactNode }) {
  const supabase = createClient()

  useEffect(() => {
    async function initStores() {
      // 1. Rehidratar el almacenamiento local (persist)
      await Promise.all([
        useSalesStore.persist.rehydrate(),
        useSupplierStore.persist.rehydrate(),
      ])

      // 2. Traer el catálogo actualizado desde Supabase
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error al sincronizar con Supabase:', error.message)
      } else if (data) {
        // Asignación directa mediante la API nativa de Zustand
        useSalesStore.setState({ products: data })
      }
    }

    initStores()
  }, [supabase])

  return <>{children}</>
}