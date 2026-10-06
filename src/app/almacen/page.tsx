'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Boxes, ChevronDown, DollarSign, Palette, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import SalesCheckout from '@/app/components/SalesCheckout'
import { createClient } from '@/lib/supabase/client'
import type { CatalogProduct, SalesSection } from '@/store/salesStore'

export interface PaymentAllocation {
  method: string
  amount: number
}

export interface Sale {
  id: string
  item: string
  quantity: number
  total: number
  section: SalesSection
  paymentMethod?: string
  paymentAllocations?: PaymentAllocation[]
  created_at?: string
}

type ThemeMode = 'minimal-light' | 'minimal-dark' | 'normal-light' | 'normal-dark'

const themeOptions = [
  { id: 'minimal-light', label: 'Minimal (Light)' },
  { id: 'minimal-dark', label: 'Minimal (Dark)' },
  { id: 'normal-light', label: 'Normal (Light)' },
  { id: 'normal-dark', label: 'Normal (Dark)' },
] as const

export default function AlmacenPage() {
  const supabase = createClient()

  const [theme, setTheme] = useState<ThemeMode>('normal-light')
  const [isThemeOpen, setIsThemeOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  const loadData = async () => {
    const { data: productsData, error: prodErr } = await supabase
      .from('products')
      .select('*')
    if (!prodErr && productsData) {
      // Mapeamos para asegurarnos de que null se convierta en undefined y matchee el store
      const formatted = productsData.map((p) => ({
        ...p,
        offerName: p.offerName ?? undefined,
        offerPrice: p.offerPrice ?? undefined,
      }))
      setProducts(formatted as CatalogProduct[])
    }

    const { data: salesData, error: salesErr } = await supabase
      .from('sales')
      .select('*')
      .eq('section', 'almacen')
    if (!salesErr && salesData) {
      setSales(salesData as Sale[])
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem('emilia_theme') as ThemeMode | null
    if (savedTheme) setTheme(savedTheme)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsThemeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const productCatalog = products.filter(
    (product) => product.active && product.sections?.includes('almacen')
  )

  const isDark = theme.includes('dark')

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme)
    localStorage.setItem('emilia_theme', newTheme)
    setIsThemeOpen(false)
  }

  const handleRemoveSale = async (id: string) => {
    const confirmed = window.confirm('¿Deseas eliminar este registro de venta?')
    if (!confirmed) return

    const { error } = await supabase.from('sales').delete().eq('id', id)
    if (error) {
      alert(`Error al eliminar en Supabase: ${error.message}`)
      return
    }

    setSales((prev) => prev.filter((sale) => sale.id !== id))
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    loadData()
  }

  const totalVentas = sales.reduce((acc, sale) => acc + sale.total, 0)

  return (
    <main className={`min-h-screen p-4 md:p-8 transition-colors duration-300 ${isDark ? 'bg-stone-950 text-stone-100' : 'bg-[#FAFAFA] text-stone-800'}`}>
      <div className="mx-auto max-w-7xl">
        <header className={`mb-6 flex flex-col gap-4 rounded-[28px] border px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between ${isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200/80 bg-white'}`}>
          <div className="flex items-center gap-3">
            <Link href="/" className={`rounded-xl p-2.5 transition ${isDark ? 'bg-stone-800 text-[#1D7A4B] hover:bg-stone-700' : 'bg-[#E7F7ED] text-[#1D7A4B] hover:bg-[#d4f0df]'}`} aria-label="Volver al inicio">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Almacén</h1>
              <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Kiosco conectado al stock compartido del inventario</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setIsThemeOpen((prev) => !prev)} className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition ${isDark ? 'border-stone-700 bg-stone-800 text-[#A7F3D0] hover:bg-stone-700' : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
                <Palette className="h-3.5 w-3.5 text-[#1D7A4B]" />
                <span>Theme: {themeOptions.find((opt) => opt.id === theme)?.label}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isThemeOpen ? 'rotate-180' : ''}`} />
              </button>

              {isThemeOpen && (
                <div className={`absolute right-0 z-50 mt-2 w-44 rounded-2xl border py-1.5 shadow-xl ${isDark ? 'border-stone-800 bg-stone-900 text-stone-200' : 'border-stone-200 bg-white text-stone-800'}`}>
                  {themeOptions.map((opt) => (
                    <button key={opt.id} onClick={() => handleThemeChange(opt.id)} className={`flex w-full items-center justify-between px-4 py-2 text-left text-xs font-medium transition ${theme === opt.id ? (isDark ? 'bg-stone-800 text-[#A7F3D0]' : 'bg-[#E7F7ED] text-[#1D7A4B]') : (isDark ? 'hover:bg-stone-800/60' : 'hover:bg-stone-50')}`}>
                      <span>{opt.label}</span>
                      {theme === opt.id && <span className="h-1.5 w-1.5 rounded-full bg-[#1D7A4B]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => setIsModalOpen(true)} className="flex shrink-0 items-center gap-2 rounded-xl bg-[#1D7A4B] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#145C3A]">
              <Plus className="h-4 w-4" />
              Registrar venta
            </button>
          </div>
        </header>

        <section className={`mb-6 grid gap-4 rounded-[28px] border p-5 md:grid-cols-3 ${isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200/80 bg-white'}`}>
          <div className={`rounded-2xl border p-4 ${isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-[#E7F7ED]'}`}>
            <div className="mb-3 flex items-center justify-between">
              <span className={`text-xs font-semibold ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Productos</span>
              <div className={`rounded-xl p-2 ${isDark ? 'bg-stone-800 text-[#A7F3D0]' : 'bg-[#E7F7ED] text-[#1D7A4B]'}`}>
                <Boxes className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black">{productCatalog.length}</p>
          </div>
          <div className={`rounded-2xl border p-4 ${isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-[#E7F7ED]'}`}>
            <div className="mb-3 flex items-center justify-between">
              <span className={`text-xs font-semibold ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>En stock</span>
              <div className={`rounded-xl p-2 ${isDark ? 'bg-stone-800 text-[#A7F3D0]' : 'bg-[#E7F7ED] text-[#1D7A4B]'}`}>
                <Boxes className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black">{productCatalog.reduce((sum, product) => sum + product.stock, 0).toLocaleString('es-AR')}</p>
          </div>
          <div className={`rounded-2xl border p-4 ${isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-[#E7F7ED]'}`}>
            <div className="mb-3 flex items-center justify-between">
              <span className={`text-xs font-semibold ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Ventas</span>
              <div className={`rounded-xl p-2 ${isDark ? 'bg-stone-800 text-[#A7F3D0]' : 'bg-[#E7F7ED] text-[#1D7A4B]'}`}>
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black">${totalVentas.toLocaleString('es-AR')}</p>
          </div>
        </section>

        <div className={`mb-6 rounded-[28px] border p-5 ${isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200/80 bg-white'}`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Stock disponible en kiosco</h2>
            <Link href="/inventario" className="text-xs font-semibold text-[#1D7A4B] hover:underline">Editar catálogo en Inventario</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {productCatalog.map((product) => (
              <div key={product.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="font-bold">{product.name}</p>
                <p className="text-xs text-stone-500">{product.category}</p>
                <div className="mt-2 flex justify-between text-sm">
                  <span>Stock: {product.stock} {product.unit}</span>
                  <span className="font-bold">${(product.offerPrice ?? product.price).toLocaleString('es-AR')}</span>
                </div>
                {product.offerName && <p className="mt-1 text-xs font-semibold text-amber-700">{product.offerName}</p>}
              </div>
            ))}
            {productCatalog.length === 0 && <p className="text-sm text-stone-500">No hay productos asignados al kiosco todavía.</p>}
          </div>
        </div>

        <div className={`rounded-[28px] border p-5 ${isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200/80 bg-white'}`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Movimientos de stock</h2>
            <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Mercadería</span>
          </div>

          <div className="space-y-3">
            {sales.map((sale) => (
              <div key={sale.id} className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-[#FAF7FF]'}`}>
                <div className="flex items-center gap-3">
                  <div className={`rounded-xl p-2.5 ${isDark ? 'bg-stone-800 text-[#A7F3D0]' : 'bg-[#E7F7ED] text-[#1D7A4B]'}`}>
                    <Boxes className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold">{sale.item}</p>
                    <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                      {sale.quantity} unidades · {sale.paymentAllocations?.map((allocation) => `${allocation.method} $${allocation.amount.toLocaleString('es-AR')}`).join(' + ') ?? sale.paymentMethod}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-base font-black">${sale.total.toLocaleString('es-AR')}</p>
                  <button onClick={() => handleRemoveSale(sale.id)} className={`rounded-xl p-2 transition ${isDark ? 'bg-stone-800 text-stone-200 hover:bg-stone-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`} aria-label={`Eliminar venta de ${sale.item}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && <SalesCheckout section="almacen" products={productCatalog} isDark={isDark} onClose={handleCloseModal} />}
    </main>
  )
}