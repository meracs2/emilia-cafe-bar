'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SalesSection = 'cafeteria' | 'heladeria' | 'bar' | 'inventario' | 'mesas' | 'almacen' | 'delivery'
export type PaymentMethod = 'Efectivo' | 'Tarjeta' | 'Débito' | 'Transferencia' | 'Mercado Pago'

export type PaymentAllocation = {
  method: PaymentMethod
  amount: number
}

export type SaleRecord = {
  id: string
  section: SalesSection
  item: string
  quantity: number
  total: number
  paymentMethod: PaymentMethod
  paymentAllocations?: PaymentAllocation[]
  ticketId?: string
  createdAt: string
  productId?: string
  stockQuantity?: number
}

export const countSaleTickets = (sales: SaleRecord[]) =>
  new Set(sales.map((sale) => sale.ticketId ?? sale.id)).size

export type SaleLineInput = {
  productId: string
  item: string
  quantity: number
  stockQuantity?: number
  total: number
}

export type MultiSaleInput = {
  section: SalesSection
  items: SaleLineInput[]
  paymentAllocations: PaymentAllocation[]
}

export type CatalogProduct = {
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

export type IceCreamPriceOption = {
  id: string
  label: string
  grams: number
  price: number
  offerName?: string
  offerPrice?: number
}

export type SaleInput = Omit<SaleRecord, 'id' | 'createdAt'> & {
  id?: string
  createdAt?: string
}

export type TableOrderLine = {
  id: string
  productId: string
  item: string
  quantity: number
  stockQuantity: number
  unitPrice: number
  total: number
}

export type TableOrder = {
  tableName: string
  openedAt: string | null
  lines: TableOrderLine[]
}

const initialSales: SaleRecord[] = []

const initialProducts: CatalogProduct[] = []

export const tableNames = ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5', 'Mesa 6', 'Mesa 7', 'Mesa 8', 'Mesa 9', 'Mesa 10']

const createEmptyTableOrders = (): Record<string, TableOrder> =>
  Object.fromEntries(tableNames.map((tableName) => [tableName, { tableName, openedAt: null, lines: [] }]))

const initialIceCreamPrices: IceCreamPriceOption[] = [
  { id: 'scoop-1', label: '1 bocha', grams: 100, price: 0 },
  { id: 'scoop-2', label: '2 bochas', grams: 200, price: 0 },
  { id: 'scoop-3', label: '3 bochas', grams: 300, price: 0 },
  { id: 'quarter-kilo', label: '1/4 kilo', grams: 250, price: 0 },
  { id: 'half-kilo', label: '1/2 kilo', grams: 500, price: 0 },
  { id: 'one-kilo', label: '1 kilo', grams: 1000, price: 0 },
]

type SalesState = {
  sales: SaleRecord[]
  products: CatalogProduct[]
  iceCreamPrices: IceCreamPriceOption[]
  tableOrders: Record<string, TableOrder>
  setProducts: (products: CatalogProduct[]) => void
  addProduct: (product: Omit<CatalogProduct, 'id'> & { id?: string }) => void
  updateProduct: (id: string, changes: Partial<Omit<CatalogProduct, 'id'>>) => void
  deleteProduct: (id: string) => void
  adjustStock: (id: string, amount: number) => void
  updateIceCreamPrice: (id: string, changes: Partial<Omit<IceCreamPriceOption, 'id'>>) => void
  addTableOrderItem: (tableName: string, productId: string, quantity: number) => { success: true } | { success: false; error: string }
  updateTableOrderItemQuantity: (tableName: string, lineId: string, quantity: number) => { success: true } | { success: false; error: string }
  removeTableOrderItem: (tableName: string, lineId: string) => void
  cancelTableOrder: (tableName: string) => void
  closeTableOrder: (tableName: string, payment: PaymentMethod | PaymentAllocation[]) => { success: true } | { success: false; error: string }
  addSale: (sale: SaleInput) => { success: true } | { success: false; error: string }
  addSales: (sale: MultiSaleInput) => { success: true } | { success: false; error: string }
  removeSale: (id: string) => void
  getSectionSales: (section: SalesSection) => SaleRecord[]
  getSectionTotal: (section: SalesSection) => number
  getTotalsBySection: () => Record<SalesSection, number>
  getPaymentTotals: () => Record<PaymentMethod, number>
}

const allSections: SalesSection[] = ['cafeteria', 'heladeria', 'bar', 'inventario', 'mesas', 'almacen', 'delivery']
const allPaymentMethods: PaymentMethod[] = ['Efectivo', 'Tarjeta', 'Débito', 'Transferencia', 'Mercado Pago']

const isValidPaymentAllocations = (total: number, allocations: PaymentAllocation[]) =>
  allocations.length > 0 &&
  allocations.every((allocation) =>
    allPaymentMethods.includes(allocation.method) &&
    Number.isFinite(allocation.amount) &&
    allocation.amount > 0,
  ) &&
  Math.round(allocations.reduce((sum, allocation) => sum + allocation.amount, 0) * 100) === Math.round(total * 100)

const allocatePayments = (
  items: { total: number }[],
  paymentAllocations: PaymentAllocation[],
): PaymentAllocation[][] => {
  const allocated = items.map((): PaymentAllocation[] => [])
  const remainingByItem = items.map((item) => Math.round(item.total * 100))

  for (const payment of paymentAllocations) {
    let centsRemaining = Math.round(payment.amount * 100)
    for (let index = 0; index < items.length && centsRemaining > 0; index += 1) {
      const centsForItem = Math.min(centsRemaining, remainingByItem[index])
      if (centsForItem > 0) {
        allocated[index].push({ method: payment.method, amount: centsForItem / 100 })
        remainingByItem[index] -= centsForItem
        centsRemaining -= centsForItem
      }
    }
  }

  return allocated
}

export const useSalesStore = create<SalesState>()(
  persist(
    (set, get) => ({
      sales: initialSales,
      products: initialProducts,
      iceCreamPrices: initialIceCreamPrices,
      tableOrders: createEmptyTableOrders(),
      setProducts: (products) => set({ products }),
      addProduct: (product) => {
        const record: CatalogProduct = {
          ...product,
          id: product.id ?? `product-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        }
        set((state) => ({ products: [...state.products, record] }))
      },
      updateProduct: (id, changes) => {
        set((state) => ({
          products: state.products.map((product) => product.id === id ? { ...product, ...changes } : product),
        }))
      },
      deleteProduct: (id) => {
        set((state) => ({ products: state.products.filter((product) => product.id !== id) }))
      },
      adjustStock: (id, amount) => {
        set((state) => ({
          products: state.products.map((product) => product.id === id
            ? { ...product, stock: Math.max(0, product.stock + amount) }
            : product),
        }))
      },
      updateIceCreamPrice: (id, changes) => {
        set((state) => ({
          iceCreamPrices: state.iceCreamPrices.map((option) => option.id === id ? { ...option, ...changes } : option),
        }))
      },
      addTableOrderItem: (tableName, productId, quantity) => {
        const state = get()
        const product = state.products.find((item) => item.id === productId)
        if (!tableNames.includes(tableName)) return { success: false, error: 'La mesa seleccionada no existe.' }
        if (!Number.isFinite(quantity) || quantity <= 0) return { success: false, error: 'Ingresá una cantidad válida.' }
        if (!product || !product.active || !product.sections.includes('mesas')) {
          return { success: false, error: 'El producto no está disponible para vender en Mesas.' }
        }
        if (product.stock < quantity) {
          return { success: false, error: `Stock insuficiente de ${product.name}. Disponible: ${product.stock} ${product.unit}.` }
        }

        const unitPrice = product.offerPrice ?? product.price
        const line: TableOrderLine = {
          id: `table-line-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          productId,
          item: product.name,
          quantity,
          stockQuantity: quantity,
          unitPrice,
          total: unitPrice * quantity,
        }
        set((current) => {
          const order = current.tableOrders[tableName] ?? { tableName, openedAt: null, lines: [] }
          return {
            tableOrders: {
              ...current.tableOrders,
              [tableName]: {
                ...order,
                openedAt: order.openedAt ?? new Date().toISOString(),
                lines: [...order.lines, line],
              },
            },
            products: current.products.map((item) => item.id === productId
              ? { ...item, stock: Math.max(0, item.stock - quantity) }
              : item),
          }
        })
        return { success: true }
      },
      addSales: (sale) => {
        const state = get()
        if (!sale.items.length) return { success: false, error: 'Agregá al menos un producto al ticket.' }
        if (sale.items.some((item) =>
          !Number.isFinite(item.quantity) || item.quantity <= 0 ||
          !Number.isFinite(item.total) || item.total < 0 ||
          !Number.isFinite(item.stockQuantity ?? item.quantity) || (item.stockQuantity ?? item.quantity) <= 0,
        )) {
          return { success: false, error: 'Las cantidades y los importes del ticket deben ser válidos.' }
        }

        const total = sale.items.reduce((sum, item) => sum + item.total, 0)
        if (!isValidPaymentAllocations(total, sale.paymentAllocations)) {
          return { success: false, error: 'Los importes de pago deben sumar exactamente el total del ticket.' }
        }

        const stockRequired = new Map<string, number>()
        for (const item of sale.items) {
          const product = state.products.find((candidate) => candidate.id === item.productId)
          if (!product) return { success: false, error: 'Uno de los productos ya no existe en el catálogo.' }
          if (!product.active || !product.sections.includes(sale.section)) {
            return { success: false, error: `El producto ${product.name} no está habilitado para venderse en esta sección.` }
          }
          stockRequired.set(item.productId, (stockRequired.get(item.productId) ?? 0) + (item.stockQuantity ?? item.quantity))
        }
        for (const [productId, required] of stockRequired) {
          const product = state.products.find((candidate) => candidate.id === productId)
          if (product && product.stock < required) {
            return { success: false, error: `Stock insuficiente de ${product.name}. Disponible: ${product.stock} ${product.unit}.` }
          }
        }

        const linePayments = allocatePayments(sale.items, sale.paymentAllocations)
        const ticketId = `ticket-${Date.now()}-${Math.random().toString(16).slice(2)}`
        const createdAt = new Date().toISOString()
        const records: SaleRecord[] = sale.items.map((item, index) => ({
          ...item,
          id: `sale-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          ticketId,
          section: sale.section,
          paymentMethod: linePayments[index][0]?.method ?? 'Efectivo',
          paymentAllocations: linePayments[index],
          createdAt,
        }))

        set((current) => ({
          sales: [...records, ...current.sales],
          products: current.products.map((product) => {
            const quantity = stockRequired.get(product.id)
            return quantity ? { ...product, stock: Math.max(0, product.stock - quantity) } : product
          }),
        }))
        return { success: true }
      },
      updateTableOrderItemQuantity: (tableName, lineId, quantity) => {
        if (!Number.isFinite(quantity) || quantity <= 0) return { success: false, error: 'La cantidad debe ser mayor a cero.' }
        const order = get().tableOrders[tableName]
        const line = order?.lines.find((item) => item.id === lineId)
        if (!line) return { success: false, error: 'El producto ya no está en esta comanda.' }
        const delta = quantity - line.quantity
        const product = get().products.find((item) => item.id === line.productId)
        if (delta > 0 && product && product.stock < delta) {
          return { success: false, error: `Stock insuficiente de ${product.name}. Disponible: ${product.stock} ${product.unit}.` }
        }
        set((state) => ({
          tableOrders: {
            ...state.tableOrders,
            [tableName]: {
              ...state.tableOrders[tableName],
              lines: state.tableOrders[tableName].lines.map((item) => item.id === lineId
                ? { ...item, quantity, stockQuantity: quantity, total: item.unitPrice * quantity }
                : item),
            },
          },
          products: product && delta !== 0
            ? state.products.map((item) => item.id === line.productId
              ? { ...item, stock: Math.max(0, item.stock - delta) }
              : item)
            : state.products,
        }))
        return { success: true }
      },
      removeTableOrderItem: (tableName, lineId) => {
        set((state) => {
          const order = state.tableOrders[tableName]
          const line = order?.lines.find((item) => item.id === lineId)
          if (!order || !line) return state
          const remainingLines = order.lines.filter((item) => item.id !== lineId)
          return {
            tableOrders: {
              ...state.tableOrders,
              [tableName]: {
                ...order,
                openedAt: remainingLines.length > 0 ? order.openedAt : null,
                lines: remainingLines,
              },
            },
            products: state.products.map((product) => product.id === line.productId
              ? { ...product, stock: product.stock + line.stockQuantity }
              : product),
          }
        })
      },
      cancelTableOrder: (tableName) => {
        set((state) => {
          const order = state.tableOrders[tableName]
          if (!order || order.lines.length === 0) return state
          const restored = new Map<string, number>()
          for (const line of order.lines) {
            restored.set(line.productId, (restored.get(line.productId) ?? 0) + line.stockQuantity)
          }
          return {
            tableOrders: {
              ...state.tableOrders,
              [tableName]: { tableName, openedAt: null, lines: [] },
            },
            products: state.products.map((product) => {
              const quantityToRestore = restored.get(product.id)
              return quantityToRestore ? { ...product, stock: product.stock + quantityToRestore } : product
            }),
          }
        })
      },
      closeTableOrder: (tableName, payment) => {
        const order = get().tableOrders[tableName]
        if (!order || order.lines.length === 0) return { success: false, error: 'La comanda no tiene productos para cobrar.' }
        const total = order.lines.reduce((sum, line) => sum + line.total, 0)
        const paymentAllocations = typeof payment === 'string' ? [{ method: payment, amount: total }] : payment
        if (!isValidPaymentAllocations(total, paymentAllocations)) {
          return { success: false, error: 'Los importes de pago deben sumar exactamente el total de la comanda.' }
        }
        const createdAt = new Date().toISOString()
        const linePayments = allocatePayments(order.lines, paymentAllocations)
        const ticketId = `ticket-${Date.now()}-${Math.random().toString(16).slice(2)}`
        const tableSales: SaleRecord[] = order.lines.map((line, index) => ({
          id: `sale-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          ticketId,
          section: 'mesas',
          productId: line.productId,
          item: `${tableName} · ${line.item}`,
          quantity: line.quantity,
          stockQuantity: line.stockQuantity,
          total: line.total,
          paymentMethod: linePayments[index][0]?.method ?? 'Efectivo',
          paymentAllocations: linePayments[index],
          createdAt,
        }))
        set((state) => ({
          sales: [...tableSales, ...state.sales],
          tableOrders: {
            ...state.tableOrders,
            [tableName]: { tableName, openedAt: null, lines: [] },
          },
        }))
        return { success: true }
      },
      addSale: (sale) => {
        const product = sale.productId ? get().products.find((item) => item.id === sale.productId) : undefined
        const stockAmount = sale.stockQuantity ?? sale.quantity
        if (!Number.isFinite(sale.quantity) || sale.quantity <= 0 || !Number.isFinite(sale.total) || sale.total < 0) {
          return { success: false, error: 'La cantidad y el total de la venta deben ser válidos.' }
        }
        if (sale.productId && !product) {
          return { success: false, error: 'El producto ya no existe en el catálogo.' }
        }
        if (product && (!product.active || !product.sections.includes(sale.section))) {
          return { success: false, error: 'El producto no está habilitado para venderse en esta sección.' }
        }
        if (sale.productId && (!Number.isFinite(stockAmount) || stockAmount <= 0)) {
          return { success: false, error: 'La cantidad a descontar del stock debe ser mayor a cero.' }
        }
        if (product && product.stock < stockAmount) {
          return { success: false, error: `Stock insuficiente de ${product.name}. Disponible: ${product.stock} ${product.unit}.` }
        }

        const record: SaleRecord = {
          ...sale,
          id: sale.id ?? `sale-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          createdAt: sale.createdAt ?? new Date().toISOString(),
        }

        set((state) => ({
          sales: [record, ...state.sales],
          products: sale.productId
            ? state.products.map((item) => item.id === sale.productId
              ? { ...item, stock: Math.max(0, item.stock - stockAmount) }
              : item)
            : state.products,
        }))
        return { success: true }
      },
      removeSale: (id) => {
        set((state) => {
          const removedSale = state.sales.find((sale) => sale.id === id)
          return {
            sales: state.sales.filter((sale) => sale.id !== id),
            products: removedSale?.productId
              ? state.products.map((product) => product.id === removedSale.productId
                ? { ...product, stock: product.stock + (removedSale.stockQuantity ?? removedSale.quantity) }
                : product)
              : state.products,
          }
        })
      },
      getSectionSales: (section) => get().sales.filter((sale) => sale.section === section),
      getSectionTotal: (section) =>
        get()
          .sales.filter((sale) => sale.section === section)
          .reduce((sum, sale) => sum + sale.total, 0),
      getTotalsBySection: () =>
        allSections.reduce<Record<SalesSection, number>>((acc, section) => {
          acc[section] = get().sales.filter((sale) => sale.section === section).reduce((sum, sale) => sum + sale.total, 0)
          return acc
        }, {
          cafeteria: 0,
          heladeria: 0,
          bar: 0,
          inventario: 0,
          mesas: 0,
          almacen: 0,
          delivery: 0,
        }),
      getPaymentTotals: () => {
        const totals: Record<PaymentMethod, number> = {
          Efectivo: 0,
          Tarjeta: 0,
          Débito: 0,
          Transferencia: 0,
          'Mercado Pago': 0,
        }

        for (const sale of get().sales) {
          if (sale.paymentAllocations?.length) {
            for (const allocation of sale.paymentAllocations) totals[allocation.method] += allocation.amount
          } else {
            totals[sale.paymentMethod] += sale.total
          }
        }

        return totals
      },
    }),
    {
      name: 'emilia-sales-store',
      version: 5,
      migrate: (persistedState) => {
        const persisted = persistedState as Partial<SalesState>
        return {
          sales: persisted.sales ?? initialSales,
          products: persisted.products ?? initialProducts,
          iceCreamPrices: persisted.iceCreamPrices ?? initialIceCreamPrices,
          tableOrders: createEmptyTableOrders(),
        }
      },
      partialize: (state) => ({
        sales: state.sales,
        products: state.products,
        iceCreamPrices: state.iceCreamPrices,
        tableOrders: state.tableOrders,
      }),
      skipHydration: true,
    },
  ),
)
