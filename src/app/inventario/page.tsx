'use client'

import { useState, useEffect, useMemo, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Edit3, PackagePlus, Plus, Save, Scale, Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CatalogProduct, SalesSection } from '@/store/salesStore'
import { useSalesStore } from '@/store/salesStore'

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
  isWeightBased: false,
}

export default function InventarioPage() {
  const supabase = useMemo(() => createClient(), [])
  const setCatalogProducts = useSalesStore((state) => state.setProducts)

  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('todos')

  const loadProducts = async () => {
    const { data, error: fetchErr } = await supabase.from('products').select('*')
    if (fetchErr) {
      console.error('Error al cargar productos de Supabase:', fetchErr.message)
    } else if (data) {
      const mappedProducts: CatalogProduct[] = data.map((item: any) => ({
        id: item.id,
        name: item.name ?? '',
        category: item.category ?? '',
        price: item.price ?? 0,
        stock: item.stock ?? 0,
        unit: item.unit ?? 'unidad',
        sections: item.sections ?? [],
        active: item.active ?? true,
        offerName: item.offerName ?? item.offer_name ?? '',
        offerPrice: item.offerPrice ?? item.offer_price ?? undefined,
        isWeightBased: item.isWeightBased ?? item.is_weight_based ?? false,
      }))
      setProducts(mappedProducts)
      setCatalogProducts(mappedProducts)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [setCatalogProducts, supabase])

  const stockTotal = products.reduce((sum, product) => sum + product.stock, 0)
  const lowStockCount = products.filter((product) => product.active && product.stock <= (product.isWeightBased ? 1 : 5)).length

  const filteredProducts = useMemo(() => {
    if (filterCategory === 'todos') return products
    return products.filter((product) => {
      const cat = product.category.toLowerCase()
      if (filterCategory === 'comida') return cat.includes('comida')
      if (filterCategory === 'bebida') return cat.includes('bebida')
      if (filterCategory === 'helado') return cat.includes('helado')
      if (filterCategory === 'otro') {
        return !cat.includes('comida') && !cat.includes('bebida') && !cat.includes('helado')
      }
      return true
    })
  }, [products, filterCategory])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = form.name.trim()
    const category = form.category.trim()

    if (!name || !category || !form.unit.trim() || form.sections.length === 0) {
      setError('Completá el nombre, la categoría, la unidad y al menos una sección de venta.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const productPayload: any = {
        name,
        category,
        price: Number(form.price),
        stock: Number(form.stock),
        unit: form.unit.trim(),
        sections: form.sections,
        active: form.active,
        offerName: form.offerName?.trim() || null,
        offerPrice: form.offerName?.trim() ? Number(form.offerPrice) : null,
        isWeightBased: form.isWeightBased ?? false,
        offer_name: form.offerName?.trim() || null,
        offer_price: form.offerName?.trim() ? Number(form.offerPrice) : null,
        is_weight_based: form.isWeightBased ?? false,
      }

      let resError = null

      if (editingId) {
        const { error: updateErr } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', editingId)
        resError = updateErr
      } else {
        const { error: insertErr } = await supabase
          .from('products')
          .insert([productPayload])
        resError = insertErr
      }

      if (resError) {
        const errorDetails = JSON.stringify(resError, null, 2)
        console.error('Detalle COMPLETO del error en Supabase:', errorDetails)
        setError(`Error de Supabase: ${resError.message || errorDetails} (Código: ${resError.code || 'N/A'})`)
        setLoading(false)
        return
      }

      resetForm()
      await loadProducts()
    } catch (submitError: any) {
      console.error('Error inesperado:', submitError)
      setError(`Error al guardar: ${submitError?.message || 'Inesperado'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickUpdate = async (id: string, patch: Partial<CatalogProduct>) => {
    const dbPatch: any = {}
    if (patch.active !== undefined) dbPatch.active = patch.active
    if (patch.stock !== undefined) dbPatch.stock = patch.stock
    if (patch.price !== undefined) dbPatch.price = patch.price
    if (patch.name !== undefined) dbPatch.name = patch.name
    if (patch.category !== undefined) dbPatch.category = patch.category
    if (patch.unit !== undefined) dbPatch.unit = patch.unit
    if (patch.sections !== undefined) dbPatch.sections = patch.sections

    if (patch.offerName !== undefined) {
      dbPatch.offerName = patch.offerName
      dbPatch.offer_name = patch.offerName
    }
    if (patch.offerPrice !== undefined) {
      dbPatch.offerPrice = patch.offerPrice
      dbPatch.offer_price = patch.offerPrice
    }
    if (patch.isWeightBased !== undefined) {
      dbPatch.isWeightBased = patch.isWeightBased
      dbPatch.is_weight_based = patch.isWeightBased
    }

    const { error: err } = await supabase
      .from('products')
      .update(dbPatch)
      .eq('id', id)

    if (err) {
      console.error('Error en quick update:', err)
      alert(`No se pudo actualizar: ${err.message}`)
      return
    }

    await loadProducts()
  }

  const handleAdjustStock = (product: CatalogProduct, delta: number) => {
    const newStock = Math.max(0, Number((product.stock + delta).toFixed(3)))
    handleQuickUpdate(product.id, { stock: newStock })
  }

  const handleDeleteProduct = async (product: CatalogProduct) => {
    const confirmed = window.confirm(`¿Eliminar "${product.name}" del catálogo?`)
    if (!confirmed) return

    const { error: deleteErr } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id)

    if (deleteErr) {
      alert(`Error al eliminar: ${deleteErr.message}`)
      return
    }

    await loadProducts()
    if (editingId === product.id) resetForm()
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
      offerPrice: product.offerPrice ?? undefined,
      isWeightBased: product.isWeightBased ?? false,
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

  return (
    <main className="min-h-screen bg-[#FAFAFA] p-4 text-stone-800 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex items-center gap-3 rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
          <Link href="/" className="rounded-xl bg-[#EDE9FE] p-2.5 text-[#6D28D9] transition hover:bg-[#ddd6fe]">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Inventario y catálogo</h1>
            <p className="text-xs text-stone-500">Administrá productos, precios, venta por peso / unidad y stock</p>
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-semibold text-stone-500">Productos activos</p>
            <p className="mt-2 text-2xl font-black">{products.filter((product) => product.active).length}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-semibold text-stone-500">Stock total acumulado</p>
            <p className="mt-2 text-2xl font-black">{stockTotal.toLocaleString('es-AR', { maximumFractionDigits: 3 })}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-semibold text-stone-500">Productos con stock bajo</p>
            <p className="mt-2 text-2xl font-black">{lowStockCount}</p>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(300px,0.8fr)_1.2fr]">
          <form onSubmit={handleSubmit} className="h-fit rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{editingId ? 'Editar producto' : 'Agregar producto'}</h2>
                <p className="mt-1 text-xs text-stone-500">Los cambios se guardan directamente en Supabase.</p>
              </div>
              {editingId ? (
                <button type="button" onClick={resetForm} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100">
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <PackagePlus className="h-5 w-5 text-[#6D28D9]" />
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium">
                Producto / gusto
                <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm" placeholder="Ej. Empanadas árabes" />
              </label>

              <label className="block text-sm font-medium">
                Categoría
                <input required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm" placeholder="Ej. Comida" />
              </label>

              <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3">
                <label className="flex items-center gap-2.5 text-sm font-semibold text-purple-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isWeightBased ?? false}
                    onChange={(event) => {
                      const isWeight = event.target.checked
                      setForm({
                        ...form,
                        isWeightBased: isWeight,
                        unit: isWeight ? 'kg' : 'unidad',
                      })
                    }}
                    className="h-4 w-4 rounded border-purple-300 text-[#6D28D9]"
                  />
                  <Scale className="h-4 w-4 text-[#6D28D9]" />
                  Producto vendido por peso (Kilo / Gramo)
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium">
                  {form.isWeightBased ? 'Precio por Kg / Gramo' : 'Precio de venta'}
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm" />
                </label>
                <label className="block text-sm font-medium">
                  Stock inicial
                  <input type="number" min="0" step={form.isWeightBased ? '0.001' : '1'} value={form.stock} onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm" />
                </label>
              </div>

              <label className="block text-sm font-medium">
                Unidad de medida
                {form.isWeightBased ? (
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm">
                    <option value="kg">Kilogramo (kg)</option>
                    <option value="g">Gramo (g)</option>
                  </select>
                ) : (
                  <input required value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm" placeholder="unidad, docena, pack…" />
                )}
              </label>

              <fieldset>
                <legend className="mb-2 text-sm font-medium">Disponible para vender en</legend>
                <div className="grid grid-cols-2 gap-2">
                  {sellSections.map((section) => (
                    <label key={section.id} className="flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-xs cursor-pointer">
                      <input type="checkbox" checked={form.sections.includes(section.id)} onChange={() => toggleSection(section.id)} />
                      {section.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
                Producto activo y disponible para venta
              </label>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                <p className="mb-2 text-sm font-semibold">Oferta opcional</p>
                <input value={form.offerName ?? ''} onChange={(event) => setForm({ ...form, offerName: event.target.value })} className="mb-2 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm" placeholder="Ej. Promo" />
                <input type="number" min="0" step="0.01" value={form.offerPrice ?? ''} onChange={(event) => setForm({ ...form, offerPrice: event.target.value === '' ? undefined : Number(event.target.value) })} className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm" placeholder="Precio promocional" />
              </div>
            </div>

            {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 font-semibold">{error}</p>}
            <button type="submit" disabled={loading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6D28D9] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#5B21B6] disabled:opacity-50">
              {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {loading ? 'Guardando en Supabase...' : editingId ? 'Guardar cambios' : 'Agregar al catálogo'}
            </button>
          </form>

          {/* Sección de productos compartidos con filtros, altura máxima y scroll interno */}
          <section className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm flex flex-col h-[700px] lg:h-[calc(100vh-14rem)]">
            <div className="mb-4 flex-shrink-0">
              <h2 className="text-lg font-bold">Productos compartidos</h2>
              <p className="mt-1 text-xs text-stone-500">Almacén y los sectores seleccionados consultan estas mismas existencias.</p>

              {/* Botones de filtros rápidos por categoría */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[
                  { id: 'todos', label: 'Todos' },
                  { id: 'comida', label: 'Comida' },
                  { id: 'bebida', label: 'Bebidas' },
                  { id: 'helado', label: 'Helados' },
                  { id: 'otro', label: 'Otros' },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setFilterCategory(filter.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      filterCategory === filter.id
                        ? 'bg-[#6D28D9] text-white shadow-sm'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 overflow-y-auto pr-2 flex-1">
              {filteredProducts.map((product) => {
                return (
                  <article key={product.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold">{product.name}</h3>
                          {product.isWeightBased && (
                            <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-800">
                              <Scale className="h-3 w-3" /> Por peso ({product.unit})
                            </span>
                          )}
                          {!product.active && <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-semibold text-stone-600">Inactivo</span>}
                          {product.offerName && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">{product.offerName}</span>}
                        </div>
                        <p className="text-xs text-stone-500">
                          {product.category} · ${product.price.toLocaleString('es-AR')}{product.isWeightBased ? ` / ${product.unit}` : ''} · {product.sections.map((id) => sellSections.find((section) => section.id === id)?.label).filter(Boolean).join(', ')}
                        </p>
                        {product.offerPrice != null && (
                          <p className="mt-1 text-xs font-semibold text-amber-800">
                            Oferta: ${product.offerPrice.toLocaleString('es-AR')}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => startEditing(product)} className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-stone-100">
                          <Edit3 className="h-3.5 w-3.5" /> Editar
                        </button>
                        <button onClick={() => handleQuickUpdate(product.id, { active: !product.active })} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-stone-100">
                          {product.active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button onClick={() => handleDeleteProduct(product)} className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">
                          <Trash2 className="h-3.5 w-3.5" /> Eliminar
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between border-t border-stone-200 pt-3 gap-2">
                      <p className={`text-sm font-semibold ${product.stock <= (product.isWeightBased ? 1 : 5) ? 'text-amber-700' : 'text-stone-600'}`}>
                        Stock: {product.stock.toLocaleString('es-AR', { maximumFractionDigits: 3 })} {product.unit}
                      </p>

                      <div className="flex gap-2">
                        <button onClick={() => handleAdjustStock(product, -1)} className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-bold hover:bg-stone-100">−</button>
                        <button onClick={() => handleAdjustStock(product, 1)} className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-bold hover:bg-stone-100"><Check className="h-3.5 w-3.5" />+1</button>
                      </div>
                    </div>
                  </article>
                )
              })}
              {filteredProducts.length === 0 && <p className="rounded-xl bg-stone-50 p-5 text-center text-sm text-stone-500">No hay productos en esta categoría.</p>}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}