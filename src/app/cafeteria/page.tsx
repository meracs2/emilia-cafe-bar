'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Plus, Coffee, Trash2, Palette, ChevronDown, DollarSign, Package, Sparkles } from 'lucide-react'
import Link from 'next/link'
import SalesCheckout from '@/app/components/SalesCheckout'
import { createClient } from '@/lib/supabase/client'

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

export interface PaymentAllocation {
  method: string
  amount: number
}

export interface Sale {
  id: string
  productId?: string
  item: string
  quantity: number
  total: number
  section: SalesSection
  createdAt?: string
  created_at?: string
  paymentMethod?: string
  paymentAllocations?: PaymentAllocation[]
}

type ThemeMode = 'minimal-light' | 'minimal-dark' | 'normal-light' | 'normal-dark'

const themeOptions = [
  { id: 'minimal-light', label: 'Minimal (Light)' },
  { id: 'minimal-dark', label: 'Minimal (Dark)' },
  { id: 'normal-light', label: 'Normal (Light)' },
  { id: 'normal-dark', label: 'Normal (Dark)' },
] as const

export default function CafeteriaPage() {
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
      setProducts(productsData as CatalogProduct[])
    }

    const { data: salesData, error: salesErr } = await supabase
      .from('sales')
      .select('*')
      .eq('section', 'cafeteria')
    if (!salesErr && salesData) {
      setSales(salesData as Sale[])
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem('emilia_theme') as ThemeMode | null
    if (savedTheme) {
      setTheme(savedTheme)
    }
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
    (product) => product.active && product.sections?.includes('cafeteria')
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
  const tickets = sales.length
  const promedioTicket = tickets > 0 ? totalVentas / tickets : 0
  const productoMasVendido = sales.reduce<Record<string, number>>((acc, sale) => {
    acc[sale.item] = (acc[sale.item] ?? 0) + sale.quantity
    return acc
  }, {})
  const topProduct = Object.entries(productoMasVendido).sort((a, b) => b[1] - a[1])[0]

  return (
    <main
      className={`min-h-screen p-4 md:p-8 transition-colors duration-300 ${
        isDark ? 'bg-stone-950 text-stone-100' : 'bg-[#FAFAFA] text-stone-800'
      }`}
    >
      <div className="mx-auto max-w-7xl">
        <header
          className={`mb-6 flex flex-col gap-4 rounded-[28px] border px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between ${
            isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200/80 bg-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className={`rounded-xl p-2.5 transition ${
                isDark ? 'bg-stone-800 text-[#8C1D40] hover:bg-stone-700' : 'bg-[#FDECEF] text-[#8C1D40] hover:bg-[#F9D6DE]'
              }`}
              aria-label="Volver al inicio"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div>
              <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight">
                Cafetería Emilia
                <span className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  | Barra del día
                </span>
              </h1>
              <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                Control de ventas, caja y productos de la barra
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsThemeOpen((prev) => !prev)}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition ${
                  isDark
                    ? 'border-stone-700 bg-stone-800 text-[#F9D6DE] hover:bg-stone-700'
                    : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <Palette className="h-3.5 w-3.5 text-[#8C1D40]" />
                <span>Theme: {themeOptions.find((opt) => opt.id === theme)?.label}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isThemeOpen ? 'rotate-180' : ''}`} />
              </button>

              {isThemeOpen && (
                <div
                  className={`absolute right-0 z-50 mt-2 w-44 rounded-2xl border py-1.5 shadow-xl ${
                    isDark ? 'border-stone-800 bg-stone-900 text-stone-200' : 'border-stone-200 bg-white text-stone-800'
                  }`}
                >
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleThemeChange(opt.id)}
                      className={`flex w-full items-center justify-between px-4 py-2 text-left text-xs font-medium transition ${
                        theme === opt.id
                          ? isDark
                            ? 'bg-stone-800 text-[#F9D6DE]'
                            : 'bg-[#FDECEF] text-[#8C1D40]'
                          : isDark
                            ? 'hover:bg-stone-800/60'
                            : 'hover:bg-stone-50'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {theme === opt.id && <span className="h-1.5 w-1.5 rounded-full bg-[#8C1D40]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-[#8C1D40] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#6F1632]"
            >
              <Plus className="h-4 w-4" />
              Registrar venta
            </button>
          </div>
        </header>

        <section
          className={`mb-6 grid gap-4 rounded-[28px] border p-5 md:grid-cols-4 ${
            isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200/80 bg-white'
          }`}
        >
          <div className={`rounded-2xl border p-4 ${isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-[#FFF7F8]'}`}>
            <div className="mb-3 flex items-center justify-between">
              <span className={`text-xs font-semibold ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Ventas del día</span>
              <div className={`rounded-xl p-2 ${isDark ? 'bg-stone-800 text-[#F9D6DE]' : 'bg-[#FDECEF] text-[#8C1D40]'}`}>
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black">${totalVentas.toLocaleString('es-AR')}</p>
          </div>

          <div className={`rounded-2xl border p-4 ${isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-[#FFF7F8]'}`}>
            <div className="mb-3 flex items-center justify-between">
              <span className={`text-xs font-semibold ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Tickets</span>
              <div className={`rounded-xl p-2 ${isDark ? 'bg-stone-800 text-[#F9D6DE]' : 'bg-[#FDECEF] text-[#8C1D40]'}`}>
                <Package className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black">{tickets}</p>
          </div>

          <div className={`rounded-2xl border p-4 ${isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-[#FFF7F8]'}`}>
            <div className="mb-3 flex items-center justify-between">
              <span className={`text-xs font-semibold ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Promedio</span>
              <div className={`rounded-xl p-2 ${isDark ? 'bg-stone-800 text-[#F9D6DE]' : 'bg-[#FDECEF] text-[#8C1D40]'}`}>
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black">${Math.round(promedioTicket).toLocaleString('es-AR')}</p>
          </div>

          <div className={`rounded-2xl border p-4 ${isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-[#FFF7F8]'}`}>
            <div className="mb-3 flex items-center justify-between">
              <span className={`text-xs font-semibold ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Más vendido</span>
              <div className={`rounded-xl p-2 ${isDark ? 'bg-stone-800 text-[#F9D6DE]' : 'bg-[#FDECEF] text-[#8C1D40]'}`}>
                <Coffee className="h-4 w-4" />
              </div>
            </div>
            <p className="text-lg font-black">{topProduct ? `${topProduct[0]} (${topProduct[1]})` : 'Sin ventas'}</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <div
            className={`rounded-[28px] border p-5 ${
              isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200/80 bg-white'
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Últimos movimientos</h2>
              <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Barra y pastelería</span>
            </div>

            <div className="space-y-3">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
                    isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-[#FFFDFD]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl p-2.5 ${isDark ? 'bg-stone-800 text-[#F9D6DE]' : 'bg-[#FDECEF] text-[#8C1D40]'}`}>
                      <Coffee className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold">{sale.item}</p>
                      <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                        {sale.quantity} unidades · {new Date(sale.createdAt || sale.created_at || Date.now()).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="text-base font-black">${sale.total.toLocaleString('es-AR')}</p>
                    <button
                      onClick={() => handleRemoveSale(sale.id)}
                      className={`rounded-xl p-2 transition ${
                        isDark ? 'bg-stone-800 text-stone-200 hover:bg-stone-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                      aria-label={`Eliminar venta de ${sale.item}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside
            className={`rounded-[28px] border p-5 ${
              isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200/80 bg-white'
            }`}
          >
            <h2 className="mb-4 text-lg font-bold">Stock de la barra</h2>

            <div className="space-y-3">
              {productCatalog.map((product) => {
                const sold = sales.filter((sale) => sale.productId === product.id).reduce((acc, sale) => acc + sale.quantity, 0)

                return (
                  <div
                    key={product.id}
                    className={`rounded-2xl border p-3 ${
                      isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-[#FFF8F9]'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold">{product.name}</span>
                      <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                        ${product.offerPrice?.toLocaleString('es-AR') ?? product.price.toLocaleString('es-AR')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className={isDark ? 'text-stone-400' : 'text-stone-500'}>Vendidos</span>
                      <span className="font-bold">{sold}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className={isDark ? 'text-stone-400' : 'text-stone-500'}>Stock</span>
                      <span className={`font-bold ${product.stock > 4 ? 'text-emerald-500' : 'text-amber-500'}`}>{product.stock} {product.unit}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </aside>
        </section>
      </div>

      {isModalOpen && <SalesCheckout section="cafeteria" products={productCatalog} isDark={isDark} onClose={handleCloseModal} />}
    </main>
  )
}