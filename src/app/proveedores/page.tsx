'use client'

import { useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Plus, ReceiptText, Trash2, Truck, Wallet } from 'lucide-react'
import { useSupplierStore, type SupplierEntryType } from '@/store/supplierStore'
import { useShallow } from 'zustand/react/shallow'

const paymentMethods = ['Efectivo', 'Transferencia', 'Tarjeta', 'Mercado Pago', 'Otro']
const today = new Date().toISOString().slice(0, 10)

export default function ProveedoresPage() {
  const suppliers = useSupplierStore((state) => state.suppliers)
  const entries = useSupplierStore(useShallow((state) => state.entries))
  const addSupplier = useSupplierStore((state) => state.addSupplier)
  const updateSupplier = useSupplierStore((state) => state.updateSupplier)
  const removeSupplier = useSupplierStore((state) => state.removeSupplier)
  const addEntry = useSupplierStore((state) => state.addEntry)
  const removeEntry = useSupplierStore((state) => state.removeEntry)

  const [supplierName, setSupplierName] = useState('')
  const [supplierContact, setSupplierContact] = useState('')
  const [supplierNotes, setSupplierNotes] = useState('')
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null)
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [entryType, setEntryType] = useState<SupplierEntryType>('purchase')
  const [detail, setDetail] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today)
  const [reference, setReference] = useState('')
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0])
  const [error, setError] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('all')

  const totalPurchases = entries.reduce((sum, entry) => sum + (entry.type === 'purchase' ? entry.amount : 0), 0)
  const totalPayments = entries.reduce((sum, entry) => sum + (entry.type === 'payment' ? entry.amount : 0), 0)
  const balance = totalPurchases - totalPayments
  const filteredEntries = useMemo(
    () => supplierFilter === 'all' ? entries : entries.filter((entry) => entry.supplierId === supplierFilter),
    [entries, supplierFilter],
  )

  const resetSupplierForm = () => {
    setSupplierName('')
    setSupplierContact('')
    setSupplierNotes('')
    setEditingSupplierId(null)
  }

  const handleSupplierSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = supplierName.trim()
    if (!name) return

    if (editingSupplierId) {
      updateSupplier(editingSupplierId, {
        name,
        contact: supplierContact.trim(),
        notes: supplierNotes.trim(),
      })
    } else {
      addSupplier({
        name,
        contact: supplierContact.trim(),
        notes: supplierNotes.trim(),
      })
    }
    resetSupplierForm()
  }

  const handleEntrySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanAmount = Number(amount)
    if (!selectedSupplierId || !detail.trim() || !Number.isFinite(cleanAmount) || cleanAmount <= 0 || !date) {
      setError('Elegí un proveedor, completá el detalle y cargá un importe mayor que cero.')
      return
    }

    addEntry({
      supplierId: selectedSupplierId,
      type: entryType,
      detail: detail.trim(),
      amount: cleanAmount,
      date,
      reference: reference.trim(),
      paymentMethod,
    })
    setError('')
    setDetail('')
    setAmount('')
    setReference('')
  }

  const handleRemoveSupplier = (id: string, name: string) => {
    const hasEntries = entries.some((entry) => entry.supplierId === id)
    const message = hasEntries
      ? `Eliminar a ${name} también eliminará todos sus registros del libro. ¿Continuar?`
      : `¿Eliminar al proveedor ${name}?`
    if (window.confirm(message)) {
      removeSupplier(id)
      if (selectedSupplierId === id) setSelectedSupplierId('')
      if (editingSupplierId === id) resetSupplierForm()
    }
  }

  const supplierNameById = new Map(suppliers.map((supplier) => [supplier.id, supplier.name]))

  return (
    <main className="min-h-screen bg-[#FAFAFA] p-4 text-stone-800 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex items-center gap-3 rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
          <Link href="/" className="rounded-xl bg-orange-100 p-2.5 text-orange-700 transition hover:bg-orange-200" aria-label="Volver al inicio">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <Truck className="h-5 w-5 text-orange-700" />
              Libro de proveedores
            </h1>
            <p className="text-xs text-stone-500">Anotá compras y pagos manuales; este registro es independiente de la caja diaria.</p>
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <p className="flex items-center gap-2 text-xs font-semibold text-stone-500"><ReceiptText className="h-4 w-4" /> Compras registradas</p>
            <p className="mt-2 text-2xl font-black">${totalPurchases.toLocaleString('es-AR')}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <p className="flex items-center gap-2 text-xs font-semibold text-stone-500"><Wallet className="h-4 w-4" /> Pagos registrados</p>
            <p className="mt-2 text-2xl font-black">${totalPayments.toLocaleString('es-AR')}</p>
          </div>
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
            <p className="flex items-center gap-2 text-xs font-semibold text-orange-800"><BookOpen className="h-4 w-4" /> Saldo del libro</p>
            <p className="mt-2 text-2xl font-black text-orange-900">${balance.toLocaleString('es-AR')}</p>
            <p className="mt-1 text-[11px] text-orange-800">Compras menos pagos anotados</p>
          </div>
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-6">
            <form onSubmit={handleSupplierSubmit} className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-bold">{editingSupplierId ? 'Editar proveedor' : 'Agregar proveedor'}</h2>
              <div className="space-y-3">
                <label className="block text-sm font-medium">Nombre
                  <input required value={supplierName} onChange={(event) => setSupplierName(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm" placeholder="Nombre o razón social" />
                </label>
                <label className="block text-sm font-medium">Contacto
                  <input value={supplierContact} onChange={(event) => setSupplierContact(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm" placeholder="Teléfono, email…" />
                </label>
                <label className="block text-sm font-medium">Notas
                  <textarea value={supplierNotes} onChange={(event) => setSupplierNotes(event.target.value)} rows={2} className="mt-1 w-full resize-y rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm" placeholder="Datos útiles del proveedor" />
                </label>
              </div>
              <div className="mt-4 flex gap-2">
                <button type="submit" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-800">
                  <Plus className="h-4 w-4" /> {editingSupplierId ? 'Guardar cambios' : 'Guardar proveedor'}
                </button>
                {editingSupplierId && <button type="button" onClick={resetSupplierForm} className="rounded-xl border border-stone-200 px-4 py-3 text-sm font-semibold">Cancelar</button>}
              </div>
            </form>

            <form onSubmit={handleEntrySubmit} className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="mb-1 text-lg font-bold">Anotar movimiento</h2>
              <p className="mb-4 text-xs text-stone-500">Solo se agrega a este libro; no modifica caja ni stock.</p>
              <div className="space-y-3">
                <label className="block text-sm font-medium">Proveedor
                  <select required value={selectedSupplierId} onChange={(event) => setSelectedSupplierId(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm">
                    <option value="">Seleccionar proveedor</option>
                    {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium">Tipo
                    <select value={entryType} onChange={(event) => setEntryType(event.target.value as SupplierEntryType)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm">
                      <option value="purchase">Compra</option>
                      <option value="payment">Pago</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium">Fecha
                    <input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm" />
                  </label>
                </div>
                <label className="block text-sm font-medium">Detalle
                  <input required value={detail} onChange={(event) => setDetail(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm" placeholder={entryType === 'purchase' ? 'Mercadería, factura o concepto' : 'Pago total, seña, transferencia…'} />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium">Importe
                    <input required type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm" placeholder="0" />
                  </label>
                  <label className="block text-sm font-medium">Forma de pago
                    <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm">
                      {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
                    </select>
                  </label>
                </div>
                <label className="block text-sm font-medium">N.º de factura / referencia <span className="font-normal text-stone-400">(opcional)</span>
                  <input value={reference} onChange={(event) => setReference(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm" placeholder="Factura, recibo o comprobante" />
                </label>
              </div>
              {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <button type="submit" disabled={suppliers.length === 0} className="mt-4 w-full rounded-xl bg-stone-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-stone-900 disabled:cursor-not-allowed disabled:opacity-50">
                Guardar {entryType === 'purchase' ? 'compra' : 'pago'}
              </button>
              {suppliers.length === 0 && <p className="mt-2 text-xs text-stone-500">Primero agregá un proveedor.</p>}
            </form>
          </div>

          <section className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Historial de compras y pagos</h2>
                <p className="mt-1 text-xs text-stone-500">{filteredEntries.length} movimientos anotados</p>
              </div>
              <select aria-label="Filtrar por proveedor" value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)} className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm">
                <option value="all">Todos los proveedores</option>
                {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
              </select>
            </div>

            {suppliers.length > 0 && (
              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                {suppliers.map((supplier) => {
                  const supplierEntries = entries.filter((entry) => entry.supplierId === supplier.id)
                  const supplierBalance = supplierEntries.reduce((sum, entry) => sum + (entry.type === 'purchase' ? entry.amount : -entry.amount), 0)
                  return (
                    <article key={supplier.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold">{supplier.name}</h3>
                          {supplier.contact && <p className="text-xs text-stone-500">{supplier.contact}</p>}
                          {supplier.notes && <p className="mt-1 text-xs text-stone-500">{supplier.notes}</p>}
                        </div>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => { setEditingSupplierId(supplier.id); setSupplierName(supplier.name); setSupplierContact(supplier.contact); setSupplierNotes(supplier.notes) }} className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs font-semibold hover:bg-stone-100">Editar</button>
                          <button type="button" onClick={() => handleRemoveSupplier(supplier.id, supplier.name)} className="rounded-lg border border-red-200 bg-white p-1.5 text-red-700 hover:bg-red-50" aria-label={`Eliminar proveedor ${supplier.name}`}><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                      <p className="mt-3 border-t border-stone-200 pt-2 text-sm font-bold">Saldo: ${supplierBalance.toLocaleString('es-AR')}</p>
                    </article>
                  )
                })}
              </div>
            )}

            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <article key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${entry.type === 'purchase' ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {entry.type === 'purchase' ? 'COMPRA' : 'PAGO'}
                      </span>
                      <span className="font-semibold">{supplierNameById.get(entry.supplierId) ?? 'Proveedor eliminado'}</span>
                    </div>
                    <p className="mt-1 text-sm">{entry.detail}</p>
                    <p className="text-xs text-stone-500">
                      {entry.date} · {entry.paymentMethod}{entry.reference ? ` · Ref: ${entry.reference}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`font-black ${entry.type === 'payment' ? 'text-emerald-700' : 'text-stone-800'}`}>
                      {entry.type === 'payment' ? '−' : ''}${entry.amount.toLocaleString('es-AR')}
                    </p>
                    <button type="button" onClick={() => { if (window.confirm('¿Eliminar este movimiento del libro?')) removeEntry(entry.id) }} className="rounded-xl bg-stone-100 p-2 text-stone-600 transition hover:bg-red-50 hover:text-red-700" aria-label={`Eliminar movimiento ${entry.detail}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
              {filteredEntries.length === 0 && <p className="rounded-2xl bg-stone-50 p-6 text-center text-sm text-stone-500">Todavía no hay movimientos. Agregá un proveedor y anotá la primera compra o pago.</p>}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
