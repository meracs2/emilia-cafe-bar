'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSalesStore } from '@/app/store/salesStore'

export default function StoreInitializer() {
  const setProducts = useSalesStore((state) => state.setProducts)
  const supabase = createClient()

  useEffect(() => {
    async function syncProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error al sincronizar catálogo con Supabase:', error.message)
      } else if (data) {
        setProducts(data)
      }
    }

    syncProducts()
  }, [setProducts, supabase])

  return null // No renderiza nada visual
}