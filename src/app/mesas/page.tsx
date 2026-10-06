'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, CircleDollarSign, Minus, Plus, Trash2, Users, X } from 'lucide-react'
import { initialPaymentSplitPlan, PaymentSplitEditor, resolvePaymentSplit, type PaymentSplitPlan } from '@/app/components/SalesCheckout'
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

export interface TableOrderLine {
  id: string
  productId: string
  item: string
  quantity: number
  unitPrice: number
  total: number
}

export interface TableOrder {
  tableName: string
  openedAt?: string
  lines: TableOrderLine[]
}

export const tableNames = [
  'Mesa 1',
  'Mesa 2',
  'Mesa 3',
  'Mesa 4',
  'Mesa 5',
  'Mesa 6',
  'Mesa 7',
  'Mesa 8',
  'Mesa 9',
  'Mesa 10',
]

export default function MesasPage() {
  const supabase = createClient()

  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [tableOrders, setTableOrders] = useState<Record<string, TableOrder>>(() => {
    const initial: Record<string, TableOrder> = {}
    tableNames.forEach((name) => {
      initial[name] = { tableName: name, lines: [] }
    })
    return initial
  })

  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [paymentPlan, setPaymentPlan] = useState<PaymentSplitPlan>(initialPaymentSplitPlan)
  const [error, setError] = useState('')

  // 1. CARGAR PRODUCTOS Y VENTAS CERRADAS DESDE SUPABASE
  const loadData = async () => {
    const { data: productsData, error: prodErr } = await supabase
      .from('products')
      .select('*')
    if (!prodErr && productsData) {
      setProducts(productsData)
    }

    const { data: salesData, error: salesErr } = await supabase
      .from('sales')
      .select('*')
      .eq('section', 'mesas')
    if (!salesErr && salesData) {
      setSales(salesData)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const productCatalog = products.filter(
    (product) => product.active && product.sections?.includes('mesas'),
  )

  const activeTables = tableNames.filter(
    (tableName) => (tableOrders[tableName]?.lines.length ?? 0) > 0,
  ).length

  const totalOpen = tableNames.reduce(
    (sum, tableName) =>
      sum + (tableOrders[tableName]?.lines.reduce((lineSum, line) => lineSum + line.total, 0) ?? 0),
    0,
  )

  const closedSalesTotal = sales.reduce((sum, sale) => sum + sale.total, 0)

  const currentOrder = selectedTable ? tableOrders[selectedTable] : null
  const currentTotal = currentOrder?.lines.reduce((sum, line) => sum + line.total, 0) ?? 0
  const selectedProduct =
    productCatalog.find((product) => product.id === selectedProductId) ?? productCatalog[0]

  // 2. AGREGAR ITEM A LA COMANDA DE LA MESA
  const handleAddItem = () => {
    if (!selectedTable || !selectedProduct) return
    const qty = Number(quantity)
    if (isNaN(qty) || qty <= 0) {
      setError('Ingresá una cantidad válida.')
      return
    }

    if (qty > selectedProduct.stock) {
      setError(`Stock insuficiente (disponible: ${selectedProduct.stock} ${selectedProduct.unit})`)
      return
    }

    const unitPrice = selectedProduct.offerPrice ?? selectedProduct.price

    setTableOrders((prev) => {
      const existingOrder = prev[selectedTable] ?? {
        tableName: selectedTable,
        lines: [],
        openedAt: new Date().toISOString(),
      }
      const existingLineIndex = existingOrder.lines.findIndex(
        (l) => l.productId === selectedProduct.id,
      )

      let updatedLines = [...existingOrder.lines]

      if (existingLineIndex >= 0) {
        const existingLine = updatedLines[existingLineIndex]
        const newQty = existingLine.quantity + qty
        if (newQty > selectedProduct.stock) {
          setError(`Stock insuficiente para agregar esa cantidad (disponible: ${selectedProduct.stock})`)
          return prev
        }
        updatedLines[existingLineIndex] = {
          ...existingLine,
          quantity: newQty,
          total: newQty * unitPrice,
        }
      } else {
        updatedLines.push({
          id: crypto.randomUUID(),
          productId: selectedProduct.id,
          item: selectedProduct.name,
          quantity: qty,
          unitPrice,
          total: qty * unitPrice,
        })
      }

      return {
        ...prev,
        [selectedTable]: {
          ...existingOrder,
          openedAt: existingOrder.openedAt || new Date().toISOString(),
          lines: updatedLines,
        },
      }
    })

    setError('')
    setQuantity('1')
  }

  // 3. ACTUALIZAR CANTIDAD DE UN ITEM EN LA COMANDA
  const handleUpdateQuantity = (tableName: string, lineId: string, newQty: number) => {
    const prodLine = tableOrders[tableName]?.lines.find((l) => l.id === lineId)
    if (!prodLine) return

    const product = products.find((p) => p.id === prodLine.productId)
    if (product && newQty > product.stock) {
      setError(`Stock insuficiente (disponible: ${product.stock})`)
      return
    }

    setTableOrders((prev) => {
      const order = prev[tableName]
      if (!order) return prev

      const updatedLines = order.lines.map((line) => {
        if (line.id === lineId) {
          return {
            ...line,
            quantity: newQty,
            total: newQty * line.unitPrice,
          }
        }
        return line
      })

      return {
        ...prev,
        [tableName]: { ...order, lines: updatedLines },
      }
    })
    setError('')
  }

  // 4. QUITAR UN ITEM DE LA COMANDA
  const handleRemoveItem = (tableName: string, lineId: string) => {
    setTableOrders((prev) => {
      const order = prev[tableName]
      if (!order) return prev
      return {
        ...prev,
        [tableName]: {
          ...order,
          lines: order.lines.filter((l) => l.id !== lineId),
        },
      }
    })
  }

  // 5. COBRAR Y CERRAR LA COMANDA EN SUPABASE
  const handleCloseOrder = async () => {
    if (!selectedTable || !currentOrder || currentOrder.lines.length === 0) return
    const paymentAllocations = resolvePaymentSplit(currentTotal, paymentPlan)
    if (!paymentAllocations?.length) {
      setError('Revisá los importes distribuidos entre los medios de pago.')
      return
    }

    const salesToInsert = currentOrder.lines.map((line) => ({
      item: `${selectedTable} · ${line.item}`,
      quantity: line.quantity,
      total: line.total,
      section: 'mesas',
      product_id: line.productId,
      payment_method: paymentAllocations.map((p) => p.method).join(', '),
      payment_allocations: paymentAllocations,
    }))

    const { error: insertError } = await supabase.from('sales').insert(salesToInsert)

    if (insertError) {
      setError(`Error al guardar la venta: ${insertError.message}`)
      return
    }

    // Descontar stock de productos en Supabase
    for (const line of currentOrder.lines) {
      const prod = products.find((p) => p.id === line.productId)
      if (prod) {
        const newStock = Math.max(0, prod.stock - line.quantity)
        await supabase.from('products').update({ stock: newStock }).eq('id', line.productId)
      }
    }

    await loadData()

    setTableOrders((prev) => ({
      ...prev,
      [selectedTable]: { tableName: selectedTable, lines: [], openedAt: undefined },
    }))

    setError('')
    setPaymentPlan(initialPaymentSplitPlan())
    setSelectedTable(null)
  }

  // 6. CANCELAR COMANDA Y LIMPIAR
  const handleCancelOrder = () => {
    if (
      !selectedTable ||
      !window.confirm(
        `¿Cancelar la comanda de ${selectedTable}? El stock reservado se devolverá al inventario.`,
      )
    )
      return
    setTableOrders((prev) => ({
      ...prev,
      [selectedTable]: { tableName: selectedTable, lines: [], openedAt: undefined },
    }))
    setError('')
    setSelectedTable(null)
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] p-4 text-stone-800 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center gap-3 rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
          <Link href="/" className="rounded-xl bg-[#F0F9FF] p-2.5 text-[#0F766E] transition hover:bg-[#dff7ff]" aria-label="Volver al inicio">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold tracking-tight">Comandas de mesas</h1>
            <p className="text-xs text-stone-500">Agregá pedidos a una mesa abierta; la venta pasa a Caja al cobrar y cerrar.</p>
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <p className="flex items-center gap-2 text-xs font-semibold text-stone-500"><Users className="h-4 w-4" /> Mesas con comanda abierta</p>
            <p className="mt-2 text-2xl font-black">{activeTables}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-semibold text-amber-800">Total pendiente de cobro</p>
            <p className="mt-2 text-2xl font-black text-amber-900">${totalOpen.toLocaleString('es-AR')}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <p className="flex items-center gap-2 text-xs font-semibold text-stone-500"><CircleDollarSign className="h-4 w-4" /> Cobrado en mesas hoy</p>
            <p className="mt-2 text-2xl font-black">${closedSalesTotal.toLocaleString('es-AR')}</p>
          </div>
        </section>

        <section className="mb-6 rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold">Salón</h2>
            <p className="mt-1 text-xs text-stone-500">Seleccioná una mesa para abrir una comanda nueva o continuar una pendiente.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {tableNames.map((tableName) => {
              const order = tableOrders[tableName]
              const isOpen = (order?.lines.length ?? 0) > 0
              const total = order?.lines.reduce((sum, line) => sum + line.total, 0) ?? 0
              const isSelected = selectedTable === tableName

              return (
                <button
                  key={tableName}
                  type="button"
                  onClick={() => {
                    setSelectedTable(tableName)
                    setSelectedProductId(productCatalog[0]?.id ?? '')
                    setError('')
                  }}
                  className={`rounded-2xl border p-4 text-left transition ${
                    isSelected
                      ? 'border-[#0F766E] bg-[#F0F9FF] ring-2 ring-[#0F766E]/20'
                      : isOpen
                        ? 'border-amber-300 bg-amber-50 hover:bg-amber-100'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">{tableName}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isOpen ? 'bg-amber-200 text-amber-900' : 'bg-stone-200 text-stone-600'}`}>
                      {isOpen ? 'ABIERTA' : 'LIBRE'}
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-black">${total.toLocaleString('es-AR')}</p>
                  <p className="text-xs text-stone-500">{order?.lines.length ?? 0} productos</p>
                  <p className="mt-3 text-xs font-semibold text-[#0F766E]">{isOpen ? 'Ver / editar comanda' : 'Abrir comanda'}</p>
                </button>
              )
            })}
          </div>
        </section>

        {selectedTable && currentOrder && (
          <section className="grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#0F766E]">Comanda abierta</p>
                  <h2 className="text-xl font-black">{selectedTable}</h2>
                  {currentOrder.openedAt && <p className="mt-1 text-xs text-stone-500">Abierta: {new Date(currentOrder.openedAt).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</p>}
                </div>
                <button type="button" onClick={() => setSelectedTable(null)} className="rounded-xl border border-stone-200 p-2 text-stone-500 hover:bg-stone-100" aria-label="Cerrar detalle de comanda">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {currentOrder.lines.length > 0 ? (
                <div className="space-y-3">
                  {currentOrder.lines.map((line) => (
                    <article key={line.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                      <div className="min-w-0">
                        <p className="font-bold">{line.item}</p>
                        <p className="text-xs text-stone-500">${line.unitPrice.toLocaleString('es-AR')} por unidad</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (line.quantity <= 1) handleRemoveItem(selectedTable, line.id)
                            else {
                              handleUpdateQuantity(selectedTable, line.id, line.quantity - 1)
                            }
                          }}
                          className="rounded-lg border border-stone-200 bg-white p-2 hover:bg-stone-100"
                          aria-label={`Restar una unidad de ${line.item}`}
                        >
                          {line.quantity <= 1 ? <Trash2 className="h-4 w-4 text-red-600" /> : <Minus className="h-4 w-4" />}
                        </button>
                        <span className="min-w-8 text-center font-bold">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateQuantity(selectedTable, line.id, line.quantity + 1)
                          }}
                          className="rounded-lg border border-stone-200 bg-white p-2 hover:bg-stone-100"
                          aria-label={`Agregar una unidad de ${line.item}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <span className="min-w-24 text-right font-black">${line.total.toLocaleString('es-AR')}</span>
                        <button type="button" onClick={() => handleRemoveItem(selectedTable, line.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" aria-label={`Quitar ${line.item} de la comanda`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl bg-stone-50 p-6 text-center text-sm text-stone-500">Comanda vacía. Agregá el primer producto desde el catálogo.</p>
              )}

              <div className="mt-5 flex items-center justify-between border-t border-stone-200 pt-4">
                <span className="text-sm font-semibold text-stone-500">Total de la comanda</span>
                <span className="text-2xl font-black">${currentTotal.toLocaleString('es-AR')}</span>
              </div>

              {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

              {currentOrder.lines.length > 0 && (
                <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                  <div className="sm:col-span-3"><PaymentSplitEditor total={currentTotal} plan={paymentPlan} onChange={setPaymentPlan} /></div>
                  <button type="button" onClick={handleCancelOrder} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50">
                    Cancelar comanda
                  </button>
                  <button type="button" onClick={handleCloseOrder} className="flex items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#115E59]">
                    <Check className="h-4 w-4" /> Cobrar y cerrar
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">Agregar pedido</h2>
              <p className="mb-4 mt-1 text-xs text-stone-500">El producto se reserva del stock mientras la comanda está abierta.</p>
              {productCatalog.length > 0 ? (
                <div className="space-y-4">
                  <label className="block text-sm font-medium">Producto
                    <select value={selectedProduct?.id ?? ''} onChange={(event) => setSelectedProductId(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm">
                      {productCatalog.map((product) => (
                        <option key={product.id} value={product.id} disabled={product.stock <= 0}>
                          {product.name} · ${(product.offerPrice ?? product.price).toLocaleString('es-AR')} · stock {product.stock} {product.unit}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium">Cantidad
                    <input type="number" min="0.01" step="0.01" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm" />
                  </label>
                  {selectedProduct && <p className="text-sm text-stone-600">Subtotal: <span className="font-bold">${((selectedProduct.offerPrice ?? selectedProduct.price) * (Number(quantity) || 0)).toLocaleString('es-AR')}</span></p>}
                  <button type="button" onClick={handleAddItem} disabled={!selectedProduct || selectedProduct.stock <= 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#115E59] disabled:cursor-not-allowed disabled:opacity-50">
                    <Plus className="h-4 w-4" /> Agregar a {selectedTable}
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                  No hay productos disponibles para Mesas. Asigná productos a esta sección desde <Link href="/inventario" className="font-bold underline">Inventario</Link>.
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}