'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, CircleDollarSign, Minus, Plus, Trash2, Users, X } from 'lucide-react'
import { useSalesStore, tableNames } from '@/store/salesStore'
import { useShallow } from 'zustand/react/shallow'
import { initialPaymentSplitPlan, PaymentSplitEditor, resolvePaymentSplit, type PaymentSplitPlan } from '@/app/components/SalesCheckout'

export default function MesasPage() {
  const products = useSalesStore(useShallow((state) =>
    state.products.filter((product) => product.active && product.sections.includes('mesas')),
  ))
  const tableOrders = useSalesStore((state) => state.tableOrders)
  const sales = useSalesStore(useShallow((state) => state.getSectionSales('mesas')))
  const addTableOrderItem = useSalesStore((state) => state.addTableOrderItem)
  const updateTableOrderItemQuantity = useSalesStore((state) => state.updateTableOrderItemQuantity)
  const removeTableOrderItem = useSalesStore((state) => state.removeTableOrderItem)
  const cancelTableOrder = useSalesStore((state) => state.cancelTableOrder)
  const closeTableOrder = useSalesStore((state) => state.closeTableOrder)

  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [paymentPlan, setPaymentPlan] = useState<PaymentSplitPlan>(initialPaymentSplitPlan)
  const [error, setError] = useState('')
  const activeTables = tableNames.filter((tableName) => (tableOrders[tableName]?.lines.length ?? 0) > 0).length
  const totalOpen = tableNames.reduce((sum, tableName) =>
    sum + (tableOrders[tableName]?.lines.reduce((lineSum, line) => lineSum + line.total, 0) ?? 0), 0)
  const closedSalesTotal = sales.reduce((sum, sale) => sum + sale.total, 0)
  const currentOrder = selectedTable ? tableOrders[selectedTable] : null
  const currentTotal = currentOrder?.lines.reduce((sum, line) => sum + line.total, 0) ?? 0
  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? products[0]

  const handleAddItem = () => {
    if (!selectedTable || !selectedProduct) return
    const result = addTableOrderItem(selectedTable, selectedProduct.id, Number(quantity))
    if (!result.success) {
      setError(result.error)
      return
    }
    setError('')
    setQuantity('1')
  }

  const handleCloseOrder = () => {
    if (!selectedTable) return
    const paymentAllocations = resolvePaymentSplit(currentTotal, paymentPlan)
    if (!paymentAllocations?.length) {
      setError('Revisá los importes distribuidos entre los medios de pago.')
      return
    }
    const result = closeTableOrder(selectedTable, paymentAllocations)
    if (!result.success) {
      setError(result.error)
      return
    }
    setError('')
    setPaymentPlan(initialPaymentSplitPlan())
    setSelectedTable(null)
  }

  const handleCancelOrder = () => {
    if (!selectedTable || !window.confirm(`¿Cancelar la comanda de ${selectedTable}? El stock reservado se devolverá al inventario.`)) return
    cancelTableOrder(selectedTable)
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
                    setSelectedProductId(products[0]?.id ?? '')
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
                            if (line.quantity <= 1) removeTableOrderItem(selectedTable, line.id)
                            else {
                              const result = updateTableOrderItemQuantity(selectedTable, line.id, line.quantity - 1)
                              if (!result.success) setError(result.error)
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
                            const result = updateTableOrderItemQuantity(selectedTable, line.id, line.quantity + 1)
                            if (!result.success) setError(result.error)
                          }}
                          className="rounded-lg border border-stone-200 bg-white p-2 hover:bg-stone-100"
                          aria-label={`Agregar una unidad de ${line.item}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <span className="min-w-24 text-right font-black">${line.total.toLocaleString('es-AR')}</span>
                        <button type="button" onClick={() => removeTableOrderItem(selectedTable, line.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" aria-label={`Quitar ${line.item} de la comanda`}>
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
              {products.length > 0 ? (
                <div className="space-y-4">
                  <label className="block text-sm font-medium">Producto
                    <select value={selectedProduct?.id ?? ''} onChange={(event) => setSelectedProductId(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm">
                      {products.map((product) => (
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
