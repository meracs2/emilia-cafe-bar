'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Plus, IceCream, Trash2, Palette, ChevronDown, DollarSign, Package, Sparkles, Save } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type CatalogProduct = {
  id: string
  name: string
  category: string
  price: number
  offerPrice?: number
  stock: number
  unit: string
  active?: boolean
}

type IceCreamPriceOption = {
  id: string
  label: string
  grams: number
  price: number
  offerName?: string
  offerPrice?: number
  maxFlavors?: number
}

type Sale = {
  id: string
  productId?: string
  item: string
  quantity: number
  total: number
  paymentMethod?: string
  createdAt: string
}

type ThemeMode = 'minimal-light' | 'minimal-dark' | 'normal-light' | 'normal-dark'

const themeOptions = [
  { id: 'minimal-light', label: 'Minimal (Light)' },
  { id: 'minimal-dark', label: 'Minimal (Dark)' },
  { id: 'normal-light', label: 'Normal (Light)' },
  { id: 'normal-dark', label: 'Normal (Dark)' },
] as const

const initialIceCreamPrices: IceCreamPriceOption[] = [
  { id: '1', label: '1 bocha', grams: 100, price: 1300, maxFlavors: 1 },
  { id: '2', label: '2 bochas', grams: 200, price: 2400, maxFlavors: 2 },
  { id: '3', label: '3 bochas', grams: 300, price: 3400, maxFlavors: 3 },
  { id: '4', label: '1/4 kilo', grams: 250, price: 3800, maxFlavors: 3 },
  { id: '5', label: '1/2 kilo', grams: 500, price: 7000, maxFlavors: 4 },
  { id: '6', label: '1 kilo', grams: 1000, price: 13000, maxFlavors: 4 },
]

export default function HeladeriaPage() {
  const [theme, setTheme] = useState<ThemeMode>('normal-light')
  const [isThemeOpen, setIsThemeOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [productCatalog, setProductCatalog] = useState<CatalogProduct[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [iceCreamPrices, setIceCreamPrices] = useState<IceCreamPriceOption[]>(initialIceCreamPrices)
  const [savingPrices, setSavingPrices] = useState(false)
  
  // Estados para el flujo del modal de ventas y pagos
  const [selectedSize, setSelectedSize] = useState<IceCreamPriceOption | null>(null)
  const [selectedFlavors, setSelectedFlavors] = useState<CatalogProduct[]>([])
  const [quantity, setQuantity] = useState<number>(1)
  
  // Estados de pago
  const [paymentType, setPaymentType] = useState<'simple' | 'mixed'>('simple')
  const [singleMethod, setSingleMethod] = useState<'Efectivo' | 'Débito' | 'Transferencia'>('Efectivo')
  const [mixedAmounts, setMixedAmounts] = useState({
    efectivo: 0,
    debito: 0,
    transferencia: 0,
  })

  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const updateIceCreamPrice = (id: string, updates: Partial<IceCreamPriceOption>) => {
    setIceCreamPrices((current) =>
      current.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }

  const handleSavePricesToSupabase = async () => {
    setSavingPrices(true)
    // Guardamos los precios en una tabla llamada 'ice_cream_config' o hacemos upsert por id
    for (const option of iceCreamPrices) {
      const { error } = await supabase
        .from('ice_cream_prices')
        .upsert({
          id: option.id,
          label: option.label,
          grams: option.grams,
          price: option.price,
          max_flavors: option.maxFlavors ?? 4
        }, { onConflict: 'id' })

      if (error) {
        console.error('Error al guardar precio:', error.message)
      }
    }
    setSavingPrices(false)
    alert('¡Precios guardados exitosamente en Supabase!')
  }

  const loadData = async () => {
    // Cargar productos de heladería
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .contains('sections', ['heladeria'])
      .order('name', { ascending: true })

    if (productsError) {
      console.error('Error al cargar productos:', productsError.message)
    } else if (productsData) {
      setProductCatalog(productsData)
    }

    // Cargar ventas de heladería
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .eq('section', 'heladeria')
      .order('created_at', { ascending: false })

    if (salesError) {
      console.error('Error al cargar ventas:', salesError.message)
    } else if (salesData) {
      setSales(salesData.map((sale) => ({
        id: sale.id,
        productId: sale.product_id,
        item: sale.item,
        quantity: Number(sale.quantity),
        total: Number(sale.total),
        paymentMethod: sale.payment_method,
        createdAt: sale.created_at ?? '',
      })))
    }

    // Cargar precios personalizados de Supabase si existen
    const { data: pricesData, error: pricesError } = await supabase
      .from('ice_cream_prices')
      .select('*')

    if (!pricesError && pricesData && pricesData.length > 0) {
      setIceCreamPrices(pricesData.map((p) => ({
        id: p.id,
        label: p.label,
        grams: p.grams,
        price: p.price,
        maxFlavors: p.max_flavors
      })))
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

  const isDark = theme.includes('dark')

  const handleRemoveSale = async (id: string) => {
    if (!window.confirm('¿Deseas eliminar este registro de venta?')) return

    const { error } = await supabase.from('sales').delete().eq('id', id)
    if (error) {
      alert(`Error al eliminar: ${error.message}`)
      return
    }

    setSales((current) => current.filter((sale) => sale.id !== id))
  }

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme)
    localStorage.setItem('emilia_theme', newTheme)
    setIsThemeOpen(false)
  }

  const toggleFlavor = (product: CatalogProduct) => {
    if (!selectedSize) return
    const max = selectedSize.maxFlavors ?? 4

    if (selectedFlavors.some((f) => f.id === product.id)) {
      setSelectedFlavors(selectedFlavors.filter((f) => f.id !== product.id))
    } else {
      if (selectedFlavors.length >= max) {
        alert(`Este tamaño permite un máximo de ${max} gusto(s).`)
        return
      }
      setSelectedFlavors([...selectedFlavors, product])
    }
  }

  const handleRegisterSale = async () => {
    if (!selectedSize) {
      alert('Seleccioná un tamaño o medida.')
      return
    }
    if (selectedFlavors.length === 0) {
      alert('Seleccioná al menos un gusto de helado.')
      return
    }

    const unitPrice = selectedSize.offerPrice ?? selectedSize.price
    const total = unitPrice * quantity

    let paymentMethodValue = singleMethod
    let paymentAllocationsValue: Record<string, number> = {}

    if (paymentType === 'mixed') {
      const sumMixed = mixedAmounts.efectivo + mixedAmounts.debito + mixedAmounts.transferencia
      if (sumMixed !== total) {
        alert(`La suma de los pagos (${sumMixed.toLocaleString('es-AR')}) no coincide con el total de la venta (${total.toLocaleString('es-AR')}).`)
        return
      }
      paymentMethodValue = 'Mixto'
      paymentAllocationsValue = {
        efectivo: mixedAmounts.efectivo,
        debito: mixedAmounts.debito,
        transferencia: mixedAmounts.transferencia,
      }
    } else {
      const key = singleMethod.toLowerCase() === 'débito' ? 'debito' : singleMethod.toLowerCase()
      paymentAllocationsValue = { [key]: total }
    }

    const flavorsText = selectedFlavors.map((f) => f.name).join(', ')
    const itemName = `${selectedSize.label} (${flavorsText})`
    const totalGramsPerUnit = selectedSize.grams
    const gramsPerFlavor = totalGramsPerUnit / selectedFlavors.length

    const { error: saleError } = await supabase.from('sales').insert({
      section: 'heladeria',
      item: itemName,
      quantity: quantity,
      total: total,
      payment_method: paymentMethodValue,
      payment_allocations: paymentAllocationsValue,
    })

    if (saleError) {
      alert(`Error al registrar venta: ${saleError.message}`)
      return
    }

    for (const flavor of selectedFlavors) {
      const deductionInKg = (gramsPerFlavor * quantity) / 1000
      const newStock = Math.max(0, flavor.stock - deductionInKg)

      await supabase
        .from('products')
        .update({ stock: Number(newStock.toFixed(3)) })
        .eq('id', flavor.id)
    }

    setSelectedSize(null)
    setSelectedFlavors([])
    setQuantity(1)
    setPaymentType('simple')
    setSingleMethod('Efectivo')
    setMixedAmounts({ efectivo: 0, debito: 0, transferencia: 0 })
    setIsModalOpen(false)
    loadData()
  }

  const totalVentas = sales.reduce((acc, sale) => acc + sale.total, 0)
  const tickets = sales.length
  const promedio = tickets > 0 ? totalVentas / tickets : 0
  const ventasPorProducto = sales.reduce<Record<string, number>>((acc, sale) => {
    acc[sale.item] = (acc[sale.item] ?? 0) + sale.quantity
    return acc
  }, {})
  const topProduct = Object.entries(ventasPorProducto).sort((a, b) => b[1] - a[1])[0]

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
            <p className="text-lg font-black truncate">{topProduct ? `${topProduct[0]} (${topProduct[1]})` : 'Sin ventas'}</p>
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
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{sale.item}</p>
                        {sale.paymentMethod && (
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${isDark ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-600'}`}>
                            {sale.paymentMethod}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                        {sale.quantity} unidades · {new Date(sale.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="text-base font-black">${sale.total.toLocaleString('es-AR')}</p>
                    <button onClick={() => handleRemoveSale(sale.id)} className={`rounded-xl p-2 transition ${isDark ? 'bg-stone-800 text-stone-200 hover:bg-stone-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`} aria-label="Eliminar venta">
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
                        {product.category}
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
            
            <div className="mt-5 border-t border-stone-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Precios por tamaño</h3>
                <button
                  type="button"
                  onClick={handleSavePricesToSupabase}
                  disabled={savingPrices}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {savingPrices ? 'Guardando...' : 'Guardar precios'}
                </button>
              </div>

              <div className="space-y-3">
                {iceCreamPrices.map((option) => (
                  <div key={option.id} className="rounded-xl border border-stone-200 p-3">
                    <div className="grid grid-cols-[1fr_5rem_6rem] gap-2">
                      <input aria-label="Nombre del tamaño" value={option.label} onChange={(event) => updateIceCreamPrice(option.id, { label: event.target.value })} className="min-w-0 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-800" />
                      <input aria-label="Gramos" type="number" min="1" value={option.grams} onChange={(event) => updateIceCreamPrice(option.id, { grams: Number(event.target.value) })} className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-800" />
                      <input aria-label="Precio" type="number" min="0" value={option.price} onChange={(event) => updateIceCreamPrice(option.id, { price: Number(event.target.value) })} className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-800" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>

      {/* Modal de Registro de Venta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl ${isDark ? 'border-stone-800 bg-stone-900 text-stone-100' : 'border-stone-200 bg-white text-stone-800'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Registrar Venta</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 hover:bg-stone-200 dark:hover:bg-stone-800">✕</button>
            </div>

            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#4F46E5]">1. Seleccioná el tamaño</label>
                <div className="grid grid-cols-2 gap-2">
                  {iceCreamPrices.map((size) => {
                    const price = size.offerPrice ?? size.price
                    const isSelected = selectedSize?.id === size.id
                    return (
                      <button
                        key={size.id}
                        type="button"
                        onClick={() => {
                          setSelectedSize(size)
                          setSelectedFlavors([])
                        }}
                        className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                          isSelected 
                            ? 'border-[#4F46E5] bg-[#4F46E5]/10 font-bold' 
                            : isDark ? 'border-stone-800 bg-stone-950 hover:bg-stone-800' : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                        }`}
                      >
                        <span className="text-sm">{size.label}</span>
                        <span className="text-xs text-stone-500">${price.toLocaleString('es-AR')}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {selectedSize && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#4F46E5]">
                    2. Seleccioná los gustos (Máx. {selectedSize.maxFlavors ?? 4})
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {productCatalog.map((product) => {
                      const isSelected = selectedFlavors.some((f) => f.id === product.id)
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => toggleFlavor(product)}
                          className={`flex items-center justify-between rounded-xl border p-2.5 text-xs transition ${
                            isSelected 
                              ? 'border-emerald-500 bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400' 
                              : isDark ? 'border-stone-800 bg-stone-950 hover:bg-stone-800' : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                          }`}
                        >
                          <span className="truncate">{product.name}</span>
                          <span className="text-[10px] text-stone-400">{product.stock}kg</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {selectedSize && selectedFlavors.length > 0 && (
                <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#4F46E5]">3. Cantidad</p>
                    </div>
                    <input 
                      type="number" 
                      min="1" 
                      value={quantity} 
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} 
                      className="w-20 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent px-3 py-2 text-center text-sm font-bold"
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#4F46E5]">4. Método de Pago</p>
                      <div className="flex gap-1 rounded-lg border border-stone-200 dark:border-stone-700 p-0.5 text-[11px]">
                        <button 
                          type="button" 
                          onClick={() => setPaymentType('simple')}
                          className={`rounded-md px-2.5 py-1 font-semibold transition ${paymentType === 'simple' ? 'bg-[#4F46E5] text-white' : 'text-stone-500'}`}
                        >
                          Simple
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setPaymentType('mixed')}
                          className={`rounded-md px-2.5 py-1 font-semibold transition ${paymentType === 'mixed' ? 'bg-[#4F46E5] text-white' : 'text-stone-500'}`}
                        >
                          Mixto
                        </button>
                      </div>
                    </div>

                    {paymentType === 'simple' ? (
                      <div className="grid grid-cols-3 gap-2">
                        {(['Efectivo', 'Débito', 'Transferencia'] as const).map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setSingleMethod(method)}
                            className={`rounded-xl border py-2 text-xs font-semibold transition ${
                              singleMethod === method 
                                ? 'border-[#4F46E5] bg-[#4F46E5]/10 text-[#4F46E5]' 
                                : isDark ? 'border-stone-800 bg-stone-950 text-stone-300' : 'border-stone-200 bg-stone-50 text-stone-700'
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className={`space-y-2 rounded-xl border p-3 ${isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-stone-50'}`}>
                        <p className="text-[11px] text-stone-500">Ingresá los montos por cada medio (debe sumar el total exacto):</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] text-stone-400 mb-1">Efectivo</label>
                            <input 
                              type="number" 
                              min="0"
                              value={mixedAmounts.efectivo || ''} 
                              onChange={(e) => setMixedAmounts({ ...mixedAmounts, efectivo: Number(e.target.value) })}
                              className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-transparent px-2 py-1.5 text-xs font-bold"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-stone-400 mb-1">Débito</label>
                            <input 
                              type="number" 
                              min="0"
                              value={mixedAmounts.debito || ''} 
                              onChange={(e) => setMixedAmounts({ ...mixedAmounts, debito: Number(e.target.value) })}
                              className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-transparent px-2 py-1.5 text-xs font-bold"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-stone-400 mb-1">Transferencia</label>
                            <input 
                              type="number" 
                              min="0"
                              value={mixedAmounts.transferencia || ''} 
                              onChange={(e) => setMixedAmounts({ ...mixedAmounts, transferencia: Number(e.target.value) })}
                              className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-transparent px-2 py-1.5 text-xs font-bold"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-stone-800">
                    <span className="text-sm font-bold">Total a cobrar:</span>
                    <span className="text-xl font-black text-[#4F46E5]">
                      ${((selectedSize.offerPrice ?? selectedSize.price) * quantity).toLocaleString('es-AR')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleRegisterSale}
                    className="w-full rounded-xl bg-[#4F46E5] py-3 text-center text-xs font-bold text-white shadow-md hover:bg-[#4338CA] transition mt-2"
                  >
                    Confirmar y Cobrar Venta
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}