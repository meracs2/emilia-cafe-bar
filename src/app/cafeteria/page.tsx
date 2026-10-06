'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Plus, Coffee, Trash2, Palette, ChevronDown, DollarSign, Package, Sparkles, X, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { CatalogProduct, SalesSection } from '@/store/salesStore'

export interface PaymentAllocation {
  method: string
  amount: number
}

export interface TicketItem {
  productId: string
  item: string
  quantity: number
  unitPrice: number
  total: number
  notes?: string
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
  notes?: string
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
  
  // Estados para el armado del ticket en el modal
  const [ticketItems, setTicketItems] = useState<TicketItem[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [quantity, setQuantity] = useState<number | string>(1)
  const [notes, setNotes] = useState<string>('')
  
  // Pago del ticket
  const [paymentMethod, setPaymentMethod] = useState<string>('Efectivo')
  const [mixedCash, setMixedCash] = useState<number>(0)
  const [mixedTransfer, setMixedTransfer] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleOpenModal = () => {
    if (productCatalog.length > 0 && !selectedProductId) {
      setSelectedProductId(productCatalog[0].id)
    }
    setTicketItems([])
    setQuantity(1)
    setNotes('')
    setPaymentMethod('Efectivo')
    setMixedCash(0)
    setMixedTransfer(0)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    loadData()
  }

  const selectedProductObj = productCatalog.find((p) => p.id === selectedProductId)
  const numericQuantity = typeof quantity === 'number' ? quantity : parseFloat(quantity) || 1
  const currentItemPrice = selectedProductObj ? (selectedProductObj.offerPrice ?? selectedProductObj.price) : 0

  const handleAddItemToTicket = () => {
    if (!selectedProductObj) {
      alert('Selecciona un producto válido')
      return
    }

    const subtotal = currentItemPrice * numericQuantity

    const newItem: TicketItem = {
      productId: selectedProductObj.id,
      item: selectedProductObj.name,
      quantity: numericQuantity,
      unitPrice: currentItemPrice,
      total: subtotal,
      notes: notes.trim() || undefined,
    }

    setTicketItems((prev) => [...prev, newItem])
    setNotes('')
    setQuantity(1)
  }

  const handleRemoveTicketItem = (index: number) => {
    setTicketItems((prev) => prev.filter((_, i) => i !== index))
  }

  const ticketTotal = ticketItems.reduce((acc, item) => acc + item.total, 0)

  const handleConfirmTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (ticketItems.length === 0) {
      alert('Agrega al menos un producto al ticket antes de confirmar')
      return
    }

    let paymentAllocations: PaymentAllocation[] | undefined = undefined

    if (paymentMethod === 'Mixto') {
      const cashAmount = Number(mixedCash) || 0
      const transferAmount = Number(mixedTransfer) || 0

      if (cashAmount + transferAmount !== ticketTotal) {
        alert(`La suma de los montos (${cashAmount + transferAmount}) debe ser igual al total del ticket (${ticketTotal})`)
        return
      }

      paymentAllocations = [
        { method: 'Efectivo', amount: cashAmount },
        { method: 'Transferencia', amount: transferAmount }
      ]
    }

    setIsSubmitting(true)
    const createdAt = new Date().toISOString()

    for (const item of ticketItems) {
      const newSale = {
        productId: item.productId,
        item: item.item,
        quantity: item.quantity,
        total: item.total,
        section: 'cafeteria' as SalesSection,
        paymentMethod,
        paymentAllocations,
        notes: item.notes,
        created_at: createdAt,
      }

      const { error } = await supabase.from('sales').insert([newSale])
      if (error) {
        alert(`Error al registrar venta de ${item.item}: ${error.message}`)
        setIsSubmitting(false)
        return
      }

      const prod = products.find((p) => p.id === item.productId)
      if (prod) {
        const newStock = Math.max(0, prod.stock - item.quantity)
        await supabase.from('products').update({ stock: newStock }).eq('id', prod.id)
      }
    }

    setIsSubmitting(false)
    handleCloseModal()
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
              onClick={handleOpenModal}
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
                        Cant: {sale.quantity} · {sale.paymentMethod === 'Mixto' ? 'Pago Mixto' : sale.paymentMethod || 'Efectivo'} · {new Date(sale.createdAt || sale.created_at || Date.now()).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })}
                      </p>
                      {sale.notes && (
                        <p className={`text-xs italic mt-0.5 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                          📝 {sale.notes}
                        </p>
                      )}
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

      {/* Modal con Armado de Ticket, Cantidad Manual y Pago Mixto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all overflow-y-auto">
          <div className={`w-full max-w-xl overflow-hidden rounded-[28px] border shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-200 ${
            isDark ? 'border-stone-800 bg-stone-900 text-stone-100' : 'border-stone-200 bg-white text-stone-800'
          }`}>
            {/* Cabecera */}
            <div className={`px-6 py-4 border-b flex items-center justify-between ${
              isDark ? 'border-stone-800 bg-stone-800/50' : 'border-stone-100 bg-stone-50/50'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`rounded-xl p-2 ${isDark ? 'bg-stone-800 text-[#F9D6DE]' : 'bg-[#FDECEF] text-[#8C1D40]'}`}>
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold">Armar Ticket de Venta</h3>
              </div>
              <button 
                onClick={handleCloseModal}
                className={`rounded-xl p-2 transition-colors ${
                  isDark ? 'text-stone-400 hover:bg-stone-800 hover:text-stone-200' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Formulario / Constructor de Ticket */}
            <form onSubmit={handleConfirmTicket} className="p-6 space-y-5">
              {/* Sección de adición de productos */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-stone-50/70'
              }`}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C1D40]">Agregar producto al ticket</h4>
                
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                    Producto
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#8C1D40] ${
                      isDark ? 'border-stone-700 bg-stone-800 text-stone-100' : 'border-stone-200 bg-white text-stone-800'
                    }`}
                  >
                    {productCatalog.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} (${prod.offerPrice ?? prod.price} - Stock: {prod.stock} {prod.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                      Cantidad / Unidades
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Ej: 1, 12, 100..."
                      className={`w-full rounded-xl border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#8C1D40] ${
                        isDark ? 'border-stone-700 bg-stone-800 text-stone-100' : 'border-stone-200 bg-white text-stone-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                      Sabores / Mix (Opcional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ej: 6 criollas / Mitad jamón"
                      className={`w-full rounded-xl border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#8C1D40] ${
                        isDark ? 'border-stone-700 bg-stone-800 text-stone-100' : 'border-stone-200 bg-white text-stone-800'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddItemToTicket}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white bg-[#8C1D40] transition hover:bg-[#6F1632]`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Agregar al ticket
                  </button>
                </div>
              </div>

              {/* Listado de ítems agregados al ticket */}
              <div>
                <h4 className={`text-xs font-bold mb-2 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                  Ítems en el ticket ({ticketItems.length})
                </h4>
                {ticketItems.length === 0 ? (
                  <p className={`text-xs italic p-4 text-center rounded-2xl border border-dashed ${
                    isDark ? 'border-stone-800 text-stone-500' : 'border-stone-200 text-stone-400'
                  }`}>
                    No hay productos agregados todavía. Ingresa la cantidad e indícalos arriba.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {ticketItems.map((ti, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                          isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-white'
                        }`}
                      >
                        <div>
                          <p className="font-bold">{ti.item} <span className="font-normal opacity-80">(x{ti.quantity})</span></p>
                          {ti.notes && <p className="italic text-stone-400 mt-0.5">📝 {ti.notes}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black">${ti.total.toLocaleString('es-AR')}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTicketItem(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selección de Método de Pago */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                  Método de Pago Global
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#8C1D40] ${
                    isDark ? 'border-stone-700 bg-stone-800 text-stone-100' : 'border-stone-200 bg-stone-50 text-stone-800'
                  }`}
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Mixto">Mixto (Efectivo + Transferencia)</option>
                </select>
              </div>

              {/* Campos dinámicos si se selecciona Pago Mixto */}
              {paymentMethod === 'Mixto' && (
                <div className={`grid grid-cols-2 gap-4 rounded-2xl border p-4 animate-in fade-in duration-200 ${
                  isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-[#FFF8F9]'
                }`}>
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                      Efectivo ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={mixedCash}
                      onChange={(e) => setMixedCash(parseFloat(e.target.value) || 0)}
                      className={`w-full rounded-xl border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#8C1D40] ${
                        isDark ? 'border-stone-700 bg-stone-800 text-stone-100' : 'border-stone-200 bg-white text-stone-800'
                      }`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                      Transferencia ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={mixedTransfer}
                      onChange={(e) => setMixedTransfer(parseFloat(e.target.value) || 0)}
                      className={`w-full rounded-xl border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#8C1D40] ${
                        isDark ? 'border-stone-700 bg-stone-800 text-stone-100' : 'border-stone-200 bg-white text-stone-800'
                      }`}
                      required
                    />
                  </div>
                  <div className="col-span-2 text-xs text-right font-medium text-stone-500">
                    Suma asignada: ${(Number(mixedCash) + Number(mixedTransfer)).toLocaleString('es-AR')} / Total ticket:${ticketTotal.toLocaleString('es-AR')}
                  </div>
                </div>
              )}

              {/* Total Final del Ticket */}
              <div className={`rounded-2xl border p-4 flex items-center justify-between ${
                isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-stone-50'
              }`}>
                <span className={`text-xs font-semibold ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>Total del Ticket</span>
                <span className="text-xl font-black text-[#8C1D40]">${ticketTotal.toLocaleString('es-AR')}</span>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={`rounded-xl px-4 py-3 text-xs font-bold transition ${
                    isDark ? 'bg-stone-800 text-stone-300 hover:bg-stone-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || ticketItems.length === 0}
                  className="rounded-xl bg-[#8C1D40] px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#6F1632] disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : `Confirmar y cobrar ($${ticketTotal.toLocaleString('es-AR')})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}