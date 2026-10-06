'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Edit3, PackagePlus, Plus, Save, Trash2, X } from 'lucide-react'
import { useSalesStore, type CatalogProduct, type SalesSection } from '@/store/salesStore'

const sellSections: { id: SalesSection; label: string }[] = [
  { id: 'cafeteria', label: 'Cafetería' },
  { id: 'heladeria', label: 'Heladería' },
  { id: 'bar', label: 'Bar' },
  { id: 'almacen', label: 'Almacén / kiosco' },
  { id: 'mesas', label: 'Mesas' },
  { id: 'delivery', label: 'Delivery' },
]

type ProductForm = Omit<CatalogProduct, 'id'>

const emptyForm: ProductForm = {
  name: '',
  category: '',
  price: 0,
  stock: 0,
  unit: 'unidad',
  sections: [],
  active: true,
  offerName: '',
  offerPrice: undefined,
}

export default function InventarioPage() {
  const products = useSalesStore((state) => state.products)
  const addProduct = useSalesStore((state) => state.addProduct)
  const updateProduct = useSalesStore((state) => state.updateProduct)
  const deleteProduct = useSalesStore((state) => state.deleteProduct)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [error, setError] = useState('')

  const stockTotal = products.reduce((sum, product) => sum + product.stock, 0)
  const lowStockCount = products.filter((product) => product.active && product.stock <= 5).length

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = form.name.trim()
    const category = form.category.trim()
    if (!name || !category || !form.unit.trim() || form.sections.length === 0) {
      setError('Completá el nombre, la categoría, la unidad y al menos una sección de venta.')
      return
    }
    if (!Number.isFinite(form.price) || form.price < 0 || !Number.isFinite(form.stock) || form.stock < 0) {
      setError('El precio y el stock deben ser números iguales o mayores a cero.')
      return
    }
    if (form.offerName?.trim() && (!Number.isFinite(form.offerPrice) || (form.offerPrice ?? -1) < 0)) {
      setError('Ingresá un precio válido para la oferta.')
      return
    }

    const product = {
      ...form,
      name,
      category,
      unit: form.unit.trim(),
      offerName: form.offerName?.trim() || undefined,
      offerPrice: form.offerName?.trim() ? form.offerPrice : undefined,
    }
    if (editingId) {
      updateProduct(editingId, product)
    } else {
      addProduct(product)
    }
    resetForm()
  }

  const startEditing = (product: CatalogProduct) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      unit: product.unit,
      sections: product.sections,
      active: product.active,
      offerName: product.offerName ?? '',
      offerPrice: product.offerPrice,
    })
    setError('')
  }

  const toggleSection = (section: SalesSection) => {
    setForm((current) => ({
      ...current,
      sections: current.sections.includes(section)
        ? current.sections.filter((item) => item !== section)
        : [...current.sections, section],
    }))
  }

  const handleDeleteProduct = (product: CatalogProduct) => {
    const confirmed = window.confirm(
      `¿Eliminar "${product.name}" del catálogo? Los movimientos de caja ya registrados se conservarán.`,
    )
    if (confirmed) {
      deleteProduct(product.id)
      if (editingId === product.id) resetForm()
    }
  }

  const shownProducts = products

  return (
    <main className="min-h-screen bg-[#FAFAFA] p-4 text-stone-800 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex items-center gap-3 rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
          <Link href="/" className="rounded-xl bg-[#EDE9FE] p-2.5 text-[#6D28D9] transition hover:bg-[#ddd6fe]" aria-label="Volver al inicio">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Inventario y catálogo</h1>
            <p className="text-xs text-stone-500">Administrá productos, precios, ofertas y disponibilidad de cada sector</p>
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-semibold text-stone-500">Productos activos</p>
            <p className="mt-2 text-2xl font-black">{products.filter((product) => product.active).length}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-semibold text-stone-500">Unidades / cantidad total</p>
            <p className="mt-2 text-2xl font-black">{stockTotal.toLocaleString('es-AR')}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-semibold text-stone-500">Productos con stock bajo (5 o menos)</p>
            <p className="mt-2 text-2xl font-black">{lowStockCount}</p>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(300px,0.8fr)_1.2fr]">
          <form onSubmit={handleSubmit} className="h-fit rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{editingId ? 'Editar producto' : 'Agregar producto'}</h2>
                <p className="mt-1 text-xs text-stone-500">Los cambios se reflejan en los módulos que lo venden.</p>
              </div>
              {editingId ? <button type="button" onClick={resetForm} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100" aria-label="Cancelar edición"><X className="h-4 w-4" /></button> : <PackagePlus className="h-5 w-5 text-[#6D28D9]" />}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium">Producto / gusto
                <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm" placeholder="Ej. Sandwich de jamón y queso" />
              </label>
              <label className="block text-sm font-medium">Categoría
                <input required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm" placeholder="Ej. Menú del día, Bebidas, Gustos de helado" />
                <span className="mt-1 block text-xs font-normal text-stone-500">En Bar usá “Menú del día” o “Bebidas” para ordenar la carta. Para vender helado por bocha o kilo, usá “Gustos de helado” y unidad “g”.</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium">Precio de venta
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm" />
                </label>
                <label className="block text-sm font-medium">Stock inicial
                  <input type="number" min="0" step="0.01" value={form.stock} onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm" />
                </label>
              </div>
              <label className="block text-sm font-medium">Unidad de stock
                <input required value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm" placeholder="unidad, kg, g, litro…" />
              </label>

              <fieldset>
                <legend className="mb-2 text-sm font-medium">Disponible para vender en</legend>
                <div className="grid grid-cols-2 gap-2">
                  {sellSections.map((section) => (
                    <label key={section.id} className="flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-xs">
                      <input type="checkbox" checked={form.sections.includes(section.id)} onChange={() => toggleSection(section.id)} />
                      {section.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
                Producto activo y disponible para venta
              </label>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                <p className="mb-2 text-sm font-semibold">Oferta opcional</p>
                <input value={form.offerName ?? ''} onChange={(event) => setForm({ ...form, offerName: event.target.value })} className="mb-2 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm" placeholder="Ej. Promo desayuno" />
                <input type="number" min="0" step="0.01" value={form.offerPrice ?? ''} onChange={(event) => setForm({ ...form, offerPrice: event.target.value === '' ? undefined : Number(event.target.value) })} className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm" placeholder="Precio promocional" />
              </div>
            </div>

            {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button type="submit" className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6D28D9] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#5B21B6]">
              {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingId ? 'Guardar cambios' : 'Agregar al catálogo'}
            </button>
          </form>

          <section className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-bold">Productos compartidos</h2>
              <p className="mt-1 text-xs text-stone-500">Almacén y los sectores seleccionados consultan estas mismas existencias.</p>
            </div>
            <div className="space-y-3">
              {shownProducts.map((product) => (
                <article key={product.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{product.name}</h3>
                        {!product.active && <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-semibold text-stone-600">Inactivo</span>}
                        {product.offerName && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">{product.offerName}</span>}
                      </div>
                      <p className="text-xs text-stone-500">{product.category} · ${product.price.toLocaleString('es-AR')} · {product.sections.map((id) => sellSections.find((section) => section.id === id)?.label).filter(Boolean).join(', ')}</p>
                      {product.offerPrice !== undefined && <p className="mt-1 text-xs font-semibold text-amber-800">Oferta: ${product.offerPrice.toLocaleString('es-AR')}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => startEditing(product)} className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-stone-100">
                        <Edit3 className="h-3.5 w-3.5" /> Editar
                      </button>
                      <button onClick={() => updateProduct(product.id, { active: !product.active })} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-stone-100">
                        {product.active ? 'Desactivar' : 'Activar'}
                      </button>
                      <button onClick={() => handleDeleteProduct(product)} className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" /> Eliminar
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-stone-200 pt-3">
                    <p className={`text-sm font-semibold ${product.stock <= 5 ? 'text-amber-700' : 'text-stone-600'}`}>
                      Stock: {product.stock.toLocaleString('es-AR')} {product.unit}
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => updateProduct(product.id, { stock: Math.max(0, product.stock - 1) })} className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-bold" aria-label={`Quitar una unidad de ${product.name}`}>−</button>
                      <button onClick={() => updateProduct(product.id, { stock: product.stock + 1 })} className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-bold" aria-label={`Agregar una unidad de ${product.name}`}><Check className="h-3.5 w-3.5" />+1</button>
                    </div>
                  </div>
                </article>
              ))}
              {shownProducts.length === 0 && <p className="rounded-xl bg-stone-50 p-5 text-center text-sm text-stone-500">Todavía no hay productos activos en el catálogo.</p>}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
