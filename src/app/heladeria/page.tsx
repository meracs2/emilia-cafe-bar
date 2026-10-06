'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Plus, IceCream, Trash2, Palette, ChevronDown, DollarSign, Package, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { countSaleTickets, useSalesStore } from '@/store/salesStore'
import { useShallow } from 'zustand/react/shallow'
import SalesCheckout, { type SaleProductOption } from '@/app/components/SalesCheckout'

type ThemeMode = 'minimal-light' | 'minimal-dark' | 'normal-light' | 'normal-dark'

const themeOptions = [
  { id: 'minimal-light', label: 'Minimal (Light)' },
  { id: 'minimal-dark', label: 'Minimal (Dark)' },
  { id: 'normal-light', label: 'Normal (Light)' },
  { id: 'normal-dark', label: 'Normal (Dark)' },
] as const

export default function HeladeriaPage() {
  const [theme, setTheme] = useState<ThemeMode>('normal-light')
  const [isThemeOpen, setIsThemeOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const productCatalog = useSalesStore(useShallow((state) =>
    state.products.filter((product) => product.active && product.sections.includes('heladeria')),
  ))
  const sales = useSalesStore(useShallow((state) => state.getSectionSales('heladeria')))
  const iceCreamPrices = useSalesStore(useShallow((state) => state.iceCreamPrices))
  const updateIceCreamPrice = useSalesStore((state) => state.updateIceCreamPrice)
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

  const totalVentas = sales.reduce((acc, sale) => acc + sale.total, 0)
  const tickets = countSaleTickets(sales)
  const promedio = tickets > 0 ? totalVentas / tickets : 0
  const ventasPorProducto = sales.reduce<Record<string, number>>((acc, sale) => {
    acc[sale.item] = (acc[sale.item] ?? 0) + sale.quantity
    return acc
  }, {})
  const topProduct = Object.entries(ventasPorProducto).sort((a, b) => b[1] - a[1])[0]
  const saleOptions: SaleProductOption[] = productCatalog.flatMap((product) => {
    if (product.category === 'Gustos de helado') {
      return iceCreamPrices.map((serving) => ({
        id: `${product.id}:${serving.id}`,
        productId: product.id,
        item: `${product.name} · ${serving.label}`,
        label: `${product.name} · ${serving.label} · $${(serving.offerPrice ?? serving.price).toLocaleString('es-AR')} · stock ${product.stock} ${product.unit}`,
        unitPrice: serving.offerPrice ?? serving.price,
        stockPerUnit: serving.grams,
      }))
    }
    return [{
      id: product.id,
      productId: product.id,
      item: product.name,
      label: `${product.name} · $${(product.offerPrice ?? product.price).toLocaleString('es-AR')} · stock ${product.stock} ${product.unit}`,
      unitPrice: product.offerPrice ?? product.price,
      stockPerUnit: 1,
    }]
  })

  return (
    <main className={`min-h-screen p-4 md:p-8 transition-colors duration-300 ${isDark ? 'bg-stone-950 text-stone-100' : 'bg-[#FAFAFA] text-stone-800'}`}>
      <div className="mx-auto max-w-7xl">
        <header className={`mb-6 flex flex-col gap-4 rounded-[28px] border px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between ${isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200/80 bg-white'}`}>
          <div className="flex items-center gap-3">
            <Link href="/" className={`rounded-xl p-2.5 transition ${isDark ? 'bg-stone-800 text-[#4F46E5] hover:bg-stone-700' : 'bg-[#E0E7FF] text-[#4F46E5] hover:bg-[#C7D2FE]'}`} aria-label="Volver al inicio">
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div>
              <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight">
                Heladería Emilia
                <span className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  | mostrador
                </span>
              </h1>
              <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                Control de ventas, caja y stock de helados
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setIsThemeOpen((prev) => !prev)} className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition ${isDark ? 'border-stone-700 bg-stone-800 text-[#C7D2FE] hover:bg-stone-700' : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
                <Palette className="h-3.5 w-3.5 text-[#4F46E5]" />
                <span>Theme: {themeOptions.find((opt) => opt.id === theme)?.label}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isThemeOpen ? 'rotate-180' : ''}`} />
              </button>

              {isThemeOpen && (
                <div className={`absolute right-0 z-50 mt-2 w-44 rounded-2xl border py-1.5 shadow-xl ${isDark ? 'border-stone-800 bg-stone-900 text-stone-200' : 'border-stone-200 bg-white text-stone-800'}`}>
                  {themeOptions.map((opt) => (
                    <button key={opt.id} onClick={() => handleThemeChange(opt.id)} className={`flex w-full items-center justify-between px-4 py-2 text-left text-xs font-medium transition ${theme === opt.id ? (isDark ? 'bg-stone-800 text-[#C7D2FE]' : 'bg-[#E0E7FF] text-[#4F46E5]') : (isDark ? 'hover:bg-stone-800/60' : 'hover:bg-stone-50')}`}>
                      <span>{opt.label}</span>
                      {theme === opt.id && <span className="h-1.5 w-1.5 rounded-full bg-[#4F46E5]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => setIsModalOpen(true)} className="flex shrink-0 items-center gap-2 rounded-xl bg-[#4F46E5] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#4338CA]">
              <Plus className="h-4 w-4" />
              Registrar venta
            </button>
          </div>
        </header>

        <section className={`mb-6 grid gap-4 rounded-[28px] border p-5 md:grid-cols-4 ${isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200/80 bg-white'}`}>
          <div className={`rounded-2xl border p-4 ${isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-[#F5F3FF]'}`}>
            <div className="mb-3 flex items-center justify-between">
              <span className={`text-xs font-semibold ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Ventas del día</span>
              <div className={`rounded-xl p-2 ${isDark ? 'bg-stone-800 text-[#C7D2FE]' : 'bg-[#E0E7FF] text-[#4F46E5]'}`}>
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black">${totalVentas.toLocaleString('es-AR')}</p>
          </div>

          <div className={`rounded-2xl border p-4 ${isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-[#F5F3FF]'}`}>
            <div className="mb-3 flex items-center justify-between">
              <span className={`text-xs font-semibold ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Tickets</span>
              <div className={`rounded-xl p-2 ${isDark ? 'bg-stone-800 text-[#C7D2FE]' : 'bg-[#E0E7FF] text-[#4F46E5]'}`}>
                <Package className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black">{tickets}</p>
          </div>

          <div className={`rounded-2xl border p-4 ${isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-[#F5F3FF]'}`}>
            <div className="mb-3 flex items-center justify-between">
              <span className={`text-xs font-semibold ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Promedio</span>
              <div className={`rounded-xl p-2 ${isDark ? 'bg-stone-800 text-[#C7D2FE]' : 'bg-[#E0E7FF] text-[#4F46E5]'}`}>
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black">${Math.round(promedio).toLocaleString('es-AR')}</p>
          </div>

          <div className={`rounded-2xl border p-4 ${isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-[#F5F3FF]'}`}>
            <div className="mb-3 flex items-center justify-between">
              <span className={`text-xs font-semibold ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Más vendido</span>
              <div className={`rounded-xl p-2 ${isDark ? 'bg-stone-800 text-[#C7D2FE]' : 'bg-[#E0E7FF] text-[#4F46E5]'}`}>
                <IceCream className="h-4 w-4" />
              </div>
            </div>
            <p className="text-lg font-black">{topProduct ? `${topProduct[0]} (${topProduct[1]})` : 'Sin ventas'}</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <div className={`rounded-[28px] border p-5 ${isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200/80 bg-white'}`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Últimos movimientos</h2>
              <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Mostrador / local</span>
            </div>

            <div className="space-y-3">
              {sales.map((sale) => (
                <div key={sale.id} className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-[#FDFDFF]'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl p-2.5 ${isDark ? 'bg-stone-800 text-[#C7D2FE]' : 'bg-[#E0E7FF] text-[#4F46E5]'}`}>
                      <IceCream className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold">{sale.item}</p>
                      <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                        {sale.quantity} unidades · {new Date(sale.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="text-base font-black">${sale.total.toLocaleString('es-AR')}</p>
                    <button onClick={() => removeSale(sale.id)} className={`rounded-xl p-2 transition ${isDark ? 'bg-stone-800 text-stone-200 hover:bg-stone-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`} aria-label={`Eliminar venta de ${sale.item}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className={`rounded-[28px] border p-5 ${isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200/80 bg-white'}`}>
            <h2 className="mb-4 text-lg font-bold">Stock compartido de heladería</h2>
            <div className="space-y-3">
              {productCatalog.map((product) => {
                const sold = sales.filter((sale) => sale.productId === product.id).reduce((acc, sale) => acc + sale.quantity, 0)

                return (
                  <div key={product.id} className={`rounded-2xl border p-3 ${isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-[#F8F7FF]'}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold">{product.name}</span>
                      <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                        {product.category === 'Gustos de helado' ? product.category : `$${(product.offerPrice ?? product.price).toLocaleString('es-AR')}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className={isDark ? 'text-stone-400' : 'text-stone-500'}>Vendidos</span>
                      <span className="font-bold">{sold}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className={isDark ? 'text-stone-400' : 'text-stone-500'}>Stock</span>
                      <span className={`font-bold ${product.stock > 400 ? 'text-emerald-500' : 'text-amber-500'}`}>{product.stock} {product.unit}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-5 border-t border-stone-200 pt-4">
              <h3 className="mb-3 font-bold">Precios por tamaño y ofertas</h3>
              <div className="space-y-3">
                {iceCreamPrices.map((option) => (
                  <div key={option.id} className="rounded-xl border border-stone-200 p-3">
                    <div className="grid grid-cols-[1fr_5rem_6rem] gap-2">
                      <input aria-label="Nombre del tamaño" value={option.label} onChange={(event) => updateIceCreamPrice(option.id, { label: event.target.value })} className="min-w-0 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs" />
                      <input aria-label="Gramos" type="number" min="1" value={option.grams} onChange={(event) => updateIceCreamPrice(option.id, { grams: Number(event.target.value) })} className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs" />
                      <input aria-label="Precio" type="number" min="0" value={option.price} onChange={(event) => updateIceCreamPrice(option.id, { price: Number(event.target.value) })} className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs" />
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input aria-label="Nombre de la oferta" value={option.offerName ?? ''} onChange={(event) => updateIceCreamPrice(option.id, { offerName: event.target.value || undefined })} className="min-w-0 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs" placeholder="Oferta (opcional)" />
                      <input aria-label="Precio de oferta" type="number" min="0" value={option.offerPrice ?? ''} onChange={(event) => updateIceCreamPrice(option.id, { offerPrice: event.target.value === '' ? undefined : Number(event.target.value) })} className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs" placeholder="Precio oferta" />
                    </div>
                  </div>
                ))}
              </div>
              <p className={`mt-2 text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Tamaño · gramos · precio. El stock de cada gusto se descuenta según los gramos.</p>
            </div>
          </aside>
        </section>
      </div>

      {isModalOpen && <SalesCheckout section="heladeria" products={productCatalog} options={saleOptions} isDark={isDark} onClose={() => setIsModalOpen(false)} />}
    </main>
  )
}
