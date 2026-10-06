'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Bike, ChevronDown, DollarSign, Palette, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useSalesStore } from '@/store/salesStore'
import { useShallow } from 'zustand/react/shallow'
import SalesCheckout from '@/app/components/SalesCheckout'

type ThemeMode = 'minimal-light' | 'minimal-dark' | 'normal-light' | 'normal-dark'
type PlatformKey = 'pedidosya' | 'rappi' | 'uber'

const themeOptions = [
  { id: 'minimal-light', label: 'Minimal (Light)' },
  { id: 'minimal-dark', label: 'Minimal (Dark)' },
  { id: 'normal-light', label: 'Normal (Light)' },
  { id: 'normal-dark', label: 'Normal (Dark)' },
] as const

const platformLabels: Record<PlatformKey, string> = {
  pedidosya: 'PedidosYa',
  rappi: 'Rappi',
  uber: 'Uber Eats',
}

export default function DeliveryPage() {
  const [theme, setTheme] = useState<ThemeMode>('normal-light')
  const [isThemeOpen, setIsThemeOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformKey>('pedidosya')
  const [clientName, setClientName] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const productCatalog = useSalesStore(useShallow((state) =>
    state.products.filter((product) => product.active && product.sections.includes('delivery')),
  ))
  const sales = useSalesStore(useShallow((state) => state.getSectionSales('delivery')))
  const removeSale = useSalesStore((state) => state.removeSale)

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

  const isDark = theme.includes('dark')

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme)
    localStorage.setItem('emilia_theme', newTheme)
    setIsThemeOpen(false)
  }

  const totalsByPlatform = (['pedidosya', 'rappi', 'uber'] as PlatformKey[]).reduce(
    (acc, platform) => {
      acc[platform] = sales
        .filter((sale) => sale.item.startsWith(`${platformLabels[platform]} •`))
        .reduce((sum, sale) => sum + sale.total, 0)
      return acc
    },
    { pedidosya: 0, rappi: 0, uber: 0 } as Record<PlatformKey, number>,
  )

  const granTotalGeneral = Object.values(totalsByPlatform).reduce((sum, value) => sum + value, 0)

  return (
    <main className={`min-h-screen font-sans p-4 md:p-8 flex flex-col justify-between transition-colors duration-300 ${isDark ? 'bg-stone-950 text-stone-100' : 'bg-[#FAFAFA] text-stone-800'}`}>
      <div className="mx-auto w-full max-w-7xl">
        <header className={`mb-6 flex flex-col gap-4 rounded-2xl border px-6 py-4 shadow-sm transition-colors duration-300 md:flex-row md:items-center md:justify-between ${isDark ? 'border-stone-800 bg-stone-900 text-stone-100' : 'bg-white border-stone-200/80 text-stone-900'}`}>
          <div className="flex items-center gap-3">
            <Link href="/" className={`rounded-xl p-2.5 transition ${isDark ? 'bg-stone-800 text-[#6B8E23] hover:bg-stone-700' : 'bg-[#EAF4DC] text-[#6B8E23] hover:bg-[#d8ecbe]'}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight">
                Control de Ventas por Delivery
                <span className={`text-xs font-normal ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>| Caja del Día</span>
              </h1>
              <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Carga manual por plataforma y consolidado de ingresos</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setIsThemeOpen((prev) => !prev)} className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition ${isDark ? 'border-stone-700 bg-stone-800 text-[#C5E1A5] hover:bg-stone-700' : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
                <Palette className="h-3.5 w-3.5 text-[#6B8E23]" />
                <span>Theme: {themeOptions.find((opt) => opt.id === theme)?.label}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isThemeOpen ? 'rotate-180' : ''}`} />
              </button>

              {isThemeOpen && (
                <div className={`absolute right-0 z-50 mt-2 w-44 rounded-2xl border py-1.5 shadow-xl ${isDark ? 'border-stone-800 bg-stone-900 text-stone-200' : 'border-stone-200 bg-white text-stone-800'}`}>
                  {themeOptions.map((opt) => (
                    <button key={opt.id} onClick={() => handleThemeChange(opt.id)} className={`flex w-full items-center justify-between px-4 py-2 text-left text-xs font-medium transition ${theme === opt.id ? (isDark ? 'bg-stone-800 text-[#6B8E23]' : 'bg-[#EAF4DC] text-[#6B8E23]') : (isDark ? 'hover:bg-stone-800/60' : 'hover:bg-stone-50')}`}>
                      <span>{opt.label}</span>
                      {theme === opt.id && <span className="h-1.5 w-1.5 rounded-full bg-[#6B8E23]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => setIsModalOpen(true)} className="flex shrink-0 items-center gap-2 rounded-xl bg-[#6B8E23] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#55731B]">
              <Plus className="h-4 w-4" />
              Cargar pedido manual
            </button>
          </div>
        </header>

        <div className={`mb-6 flex flex-col items-center justify-between gap-4 rounded-3xl border p-5 shadow-sm md:flex-row ${isDark ? 'border-stone-800 bg-stone-900' : 'bg-white border-stone-200/80'}`}>
          <div className="flex items-center gap-3">
            <div className={`rounded-2xl p-3 ${isDark ? 'bg-stone-800 text-[#C5E1A5]' : 'bg-[#EAF4DC] text-[#4A6B15]'}`}>
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Total General</h2>
              <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Pedidos del día</p>
            </div>
          </div>
          <p className="text-3xl font-black">${granTotalGeneral.toLocaleString('es-AR')}</p>
        </div>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          {(['pedidosya', 'rappi', 'uber'] as PlatformKey[]).map((platform) => (
            <div key={platform} className={`rounded-[24px] border p-5 ${isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-white'}`}>
              <div className="mb-3 flex items-center justify-between">
                <span className={`text-xs font-semibold ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>{platformLabels[platform]}</span>
                <Bike className="h-4 w-4 text-[#6B8E23]" />
              </div>
              <p className="text-2xl font-black">${totalsByPlatform[platform].toLocaleString('es-AR')}</p>
            </div>
          ))}
        </section>

        <div className={`rounded-[28px] border p-5 ${isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200/80 bg-white'}`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Últimos pedidos</h2>
            <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Pedidos activos</span>
          </div>

          <div className="space-y-3">
            {sales.map((sale) => (
              <div key={sale.id} className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-[#FAFAF6]'}`}>
                <div className="flex items-center gap-3">
                  <div className={`rounded-xl p-2.5 ${isDark ? 'bg-stone-800 text-[#C5E1A5]' : 'bg-[#EAF4DC] text-[#6B8E23]'}`}>
                    <Bike className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold">{sale.item}</p>
                    <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>{sale.paymentAllocations?.map((allocation) => `${allocation.method} $${allocation.amount.toLocaleString('es-AR')}`).join(' + ') ?? sale.paymentMethod} · Pedido #{sale.id.slice(-4)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-base font-black">${sale.total.toLocaleString('es-AR')}</p>
                  <button onClick={() => removeSale(sale.id)} className={`rounded-xl p-2 transition ${isDark ? 'bg-stone-800 text-stone-200 hover:bg-stone-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`} aria-label={`Eliminar pedido ${sale.item}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <SalesCheckout
          section="delivery"
          products={productCatalog}
          isDark={isDark}
          onClose={() => {
            setClientName('')
            setIsModalOpen(false)
          }}
          title="Nuevo pedido"
          itemPrefix={`${platformLabels[selectedPlatform]} • ${clientName.trim()} · `}
          canSubmit={Boolean(clientName.trim())}
          validationMessage="Ingresá el nombre del cliente para identificar el pedido."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Plataforma
              <select value={selectedPlatform} onChange={(event) => setSelectedPlatform(event.target.value as PlatformKey)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-800">
                <option value="pedidosya">PedidosYa</option>
                <option value="rappi">Rappi</option>
                <option value="uber">Uber Eats</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Cliente
              <input type="text" value={clientName} onChange={(event) => setClientName(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-800" placeholder="Ej: Sofía M." />
            </label>
          </div>
        </SalesCheckout>
      )}
    </main>
  )
}
