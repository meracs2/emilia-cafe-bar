'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { useSalesStore, type CatalogProduct, type PaymentAllocation, type PaymentMethod, type SaleLineInput, type SalesSection } from '@/store/salesStore'

export const paymentMethods: PaymentMethod[] = ['Efectivo', 'Tarjeta', 'Débito', 'Transferencia', 'Mercado Pago']

export type SaleProductOption = {
  id: string
  productId: string
  item: string
  label: string
  unitPrice: number
  stockPerUnit: number
}

export type PaymentSplitPlan = {
  methods: PaymentMethod[]
  primaryMethod: PaymentMethod
  amounts: Partial<Record<PaymentMethod, number>>
}

export const initialPaymentSplitPlan = (): PaymentSplitPlan => ({
  methods: ['Efectivo'],
  primaryMethod: 'Efectivo',
  amounts: {},
})

export const resolvePaymentSplit = (total: number, plan: PaymentSplitPlan): PaymentAllocation[] | null => {
  if (!plan.methods.includes(plan.primaryMethod)) return null
  const otherTotal = plan.methods
    .filter((method) => method !== plan.primaryMethod)
    .reduce((sum, method) => sum + (plan.amounts[method] ?? 0), 0)
  const primaryAmount = Math.round((total - otherTotal) * 100) / 100
  if (primaryAmount < 0 || !Number.isFinite(primaryAmount)) return null

  return plan.methods
    .map((method) => ({
      method,
      amount: method === plan.primaryMethod ? primaryAmount : plan.amounts[method] ?? 0,
    }))
    .filter((allocation) => allocation.amount > 0)
}

type PaymentSplitEditorProps = {
  total: number
  plan: PaymentSplitPlan
  onChange: (plan: PaymentSplitPlan) => void
}

export function PaymentSplitEditor({ total, plan, onChange }: PaymentSplitEditorProps) {
  const resolved = resolvePaymentSplit(total, plan)
  const primaryAmount = resolved?.find((allocation) => allocation.method === plan.primaryMethod)?.amount ?? total

  const toggleMethod = (method: PaymentMethod, enabled: boolean) => {
    if (enabled) {
      onChange({
        ...plan,
        methods: [...plan.methods, method],
        amounts: { ...plan.amounts, [method]: 0 },
      })
      return
    }

    const methods = plan.methods.filter((item) => item !== method)
    const primaryMethod = plan.primaryMethod === method ? methods[0] : plan.primaryMethod
    if (methods.length === 0 || !primaryMethod) return
    const amounts = { ...plan.amounts }
    delete amounts[method]
    onChange({ ...plan, methods, primaryMethod, amounts })
  }

  const updateAmount = (method: PaymentMethod, value: number) => {
    const otherMethodsTotal = plan.methods
      .filter((item) => item !== plan.primaryMethod && item !== method)
      .reduce((sum, item) => sum + (plan.amounts[item] ?? 0), 0)
    const maxAmount = Math.max(0, total - otherMethodsTotal)
    onChange({ ...plan, amounts: { ...plan.amounts, [method]: Math.min(maxAmount, Math.max(0, value)) } })
  }

  return (
    <fieldset className="space-y-2 rounded-2xl border border-stone-200 p-3">
      <legend className="px-1 text-sm font-semibold">Medios de pago</legend>
      <p className="text-xs text-stone-500">Elegí los medios y distribuí el importe. El medio marcado completa el saldo restante.</p>
      {paymentMethods.map((method) => {
        const enabled = plan.methods.includes(method)
        const isPrimary = plan.primaryMethod === method
        return (
          <div key={method} className="grid grid-cols-[auto_1fr_auto_minmax(90px,120px)] items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => toggleMethod(method, event.target.checked)}
              aria-label={`Incluir ${method}`}
            />
            <span>{method}</span>
            {enabled && (
              <>
                <label className="flex items-center gap-1 text-xs text-stone-500">
                  <input
                    type="radio"
                    name="primary-payment-method"
                    checked={isPrimary}
                    onChange={() => onChange({ ...plan, primaryMethod: method })}
                    aria-label={`Completar saldo con ${method}`}
                  />
                  Saldo
                </label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400">$</span>
                  <input
                    type="number"
                    min="0"
                    max={total}
                    step="0.01"
                    value={isPrimary ? primaryAmount : plan.amounts[method] ?? 0}
                    disabled={isPrimary}
                    onChange={(event) => updateAmount(method, Number(event.target.value))}
                    aria-label={`Importe con ${method}`}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-6 pr-2 text-right text-sm disabled:opacity-70"
                  />
                </div>
              </>
            )}
          </div>
        )
      })}
      {resolved === null && <p role="alert" className="text-xs text-red-700">Revisá los importes: no pueden superar el total.</p>}
    </fieldset>
  )
}

type SalesCheckoutProps = {
  section: SalesSection
  products: CatalogProduct[]
  isDark: boolean
  onClose: () => void
  title?: string
  itemPrefix?: string
  children?: ReactNode
  canSubmit?: boolean
  validationMessage?: string
  options?: SaleProductOption[]
}

type CartEntry = {
  option: SaleProductOption
  quantity: number
}

export default function SalesCheckout({
  section,
  products,
  isDark,
  onClose,
  title = 'Registrar venta',
  itemPrefix = '',
  children,
  canSubmit = true,
  validationMessage,
  options,
}: SalesCheckoutProps) {
  const addSales = useSalesStore((state) => state.addSales)
  const saleOptions = options ?? products.map((product) => ({
    id: product.id,
    productId: product.id,
    item: product.name,
    label: `${product.name} · $${(product.offerPrice ?? product.price).toLocaleString('es-AR')} · stock ${product.stock} ${product.unit}`,
    unitPrice: product.offerPrice ?? product.price,
    stockPerUnit: 1,
  }))
  const [selectedOptionId, setSelectedOptionId] = useState(saleOptions[0]?.id ?? '')
  const [quantity, setQuantity] = useState('1')
  const [cart, setCart] = useState<CartEntry[]>([])
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>({})
  const [paymentPlan, setPaymentPlan] = useState<PaymentSplitPlan>(initialPaymentSplitPlan)
  const [error, setError] = useState('')

  const selectedOption = saleOptions.find((option) => option.id === selectedOptionId) ?? saleOptions[0]
  const total = cart.reduce((sum, entry) => sum + entry.option.unitPrice * entry.quantity, 0)

  const getAvailableStock = (option: SaleProductOption) => {
    const product = products.find((item) => item.id === option.productId)
    const inCart = cart
      .filter((entry) => entry.option.productId === option.productId)
      .reduce((sum, entry) => sum + entry.option.stockPerUnit * entry.quantity, 0)
    return (product?.stock ?? 0) - inCart
  }

  const addToCart = () => {
    const count = Number(quantity)
    if (!selectedOption || !Number.isFinite(count) || count <= 0) {
      setError('Elegí un producto e ingresá una cantidad válida.')
      return
    }
    if (selectedOption.stockPerUnit * count > getAvailableStock(selectedOption)) {
      const product = products.find((item) => item.id === selectedOption.productId)
      setError(`Stock insuficiente de ${product?.name ?? selectedOption.item}.`)
      return
    }

    setCart((current) => {
      const existing = current.find((entry) => entry.option.id === selectedOption.id)
      if (existing) {
        return current.map((entry) => entry.option.id === selectedOption.id
          ? { ...entry, quantity: entry.quantity + count }
          : entry)
      }
      return [...current, { option: selectedOption, quantity: count }]
    })
    setQuantity('1')
    setError('')
  }

  const removeFromCart = (optionId: string) =>
    setCart((current) => current.filter((entry) => entry.option.id !== optionId))

  const updateCartQuantity = (optionId: string, nextQuantity: number) => {
    const entry = cart.find((item) => item.option.id === optionId)
    if (!entry || !Number.isFinite(nextQuantity) || nextQuantity <= 0) {
      return
    }
    const product = products.find((item) => item.id === entry.option.productId)
    const otherUsage = cart
      .filter((item) => item.option.productId === entry.option.productId && item.option.id !== optionId)
      .reduce((sum, item) => sum + item.option.stockPerUnit * item.quantity, 0)
    if (product && otherUsage + entry.option.stockPerUnit * nextQuantity > product.stock) {
      setError(`Stock insuficiente de ${product.name}.`)
      return
    }
    setCart((current) => current.map((entry) =>
      entry.option.id === optionId ? { ...entry, quantity: nextQuantity } : entry,
    ))
    setError('')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) {
      setError(validationMessage ?? 'Completá los datos requeridos.')
      return
    }
    if (cart.length === 0) {
      setError('Agregá al menos un producto al ticket.')
      return
    }

    const paymentAllocations = resolvePaymentSplit(total, paymentPlan)
    if (!paymentAllocations?.length) {
      setError('Distribuí el total entre los medios de pago seleccionados.')
      return
    }

    const items: SaleLineInput[] = cart.map(({ option, quantity: count }) => ({
      productId: option.productId,
      item: `${itemPrefix}${option.item}`,
      quantity: count,
      stockQuantity: option.stockPerUnit * count,
      total: option.unitPrice * count,
    }))
    const result = addSales({ section, items, paymentAllocations })
    if (!result.success) {
      setError(result.error)
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
      <div className={`max-h-full w-full max-w-2xl overflow-y-auto rounded-[28px] border p-5 ${isDark ? 'border-stone-800 bg-stone-900 text-stone-100' : 'border-stone-200 bg-white text-stone-800'}`}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Podés combinar productos y dividir el pago.</p>
          </div>
          <button type="button" onClick={onClose} className={`rounded-xl p-2 text-sm ${isDark ? 'bg-stone-800 text-stone-200' : 'bg-stone-100 text-stone-600'}`} aria-label="Cerrar registro de venta">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {children}
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_100px_auto]">
            <label className="text-sm font-medium">
              Producto
              <select value={selectedOption?.id ?? ''} onChange={(event) => setSelectedOptionId(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-800">
                {saleOptions.map((option) => (
                  <option key={option.id} value={option.id} disabled={getAvailableStock(option) < option.stockPerUnit}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Cantidad
              <input type="number" min="0.01" step="0.01" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-800" />
            </label>
            <button type="button" onClick={addToCart} disabled={!selectedOption} className="self-end rounded-xl bg-stone-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              Agregar
            </button>
          </div>

          {cart.length > 0 ? (
            <div className="space-y-2 rounded-2xl border border-stone-200 p-3">
              {cart.map(({ option, quantity: count }) => (
                <div key={option.id} className="grid grid-cols-[minmax(0,1fr)_90px_auto] items-center gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{option.item}</p>
                    <p className="text-xs text-stone-500">${option.unitPrice.toLocaleString('es-AR')} c/u</p>
                  </div>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={quantityDrafts[option.id] ?? count}
                    onChange={(event) => setQuantityDrafts((current) => ({ ...current, [option.id]: event.target.value }))}
                    onBlur={() => {
                      const draft = quantityDrafts[option.id]
                      if (draft !== undefined) {
                        if (draft.trim()) updateCartQuantity(option.id, Number(draft))
                        setQuantityDrafts((current) => {
                          const next = { ...current }
                          delete next[option.id]
                          return next
                        })
                      }
                    }}
                    aria-label={`Cantidad de ${option.item}`}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2 py-1.5 text-center text-stone-800"
                  />
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap font-bold">${(option.unitPrice * count).toLocaleString('es-AR')}</span>
                    <button type="button" onClick={() => removeFromCart(option.id)} className="rounded-lg px-2 py-1 text-red-700 hover:bg-red-50" aria-label={`Quitar ${option.item}`}>×</button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between border-t border-stone-200 pt-2 font-black">
                <span>Total</span>
                <span>${total.toLocaleString('es-AR')}</span>
              </div>
            </div>
          ) : (
            <p className="rounded-xl bg-stone-50 p-4 text-center text-sm text-stone-500">
              {saleOptions.length === 0 ? 'No hay productos activos para esta sección. Cargalos desde Inventario.' : 'Todavía no hay productos en el ticket.'}
            </p>
          )}

          <PaymentSplitEditor total={total} plan={paymentPlan} onChange={setPaymentPlan} />
          {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {validationMessage && !canSubmit && <p className="text-xs text-amber-700">{validationMessage}</p>}
          <button type="submit" disabled={cart.length === 0 || !canSubmit} className="w-full rounded-xl bg-[#8C1D40] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#6F1632] disabled:cursor-not-allowed disabled:opacity-50">
            Cobrar ${total.toLocaleString('es-AR')} y registrar venta
          </button>
        </form>
      </div>
    </div>
  )
}
