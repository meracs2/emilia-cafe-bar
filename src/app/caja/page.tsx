'use client'

import Link from 'next/link'
import { ArrowLeft, Banknote, CreditCard, DollarSign, PiggyBank, TrendingUp, Wallet } from 'lucide-react'
import { useSalesStore, type PaymentMethod, type SalesSection } from '@/store/salesStore'
import { useShallow } from 'zustand/react/shallow'

const sectionLabels: Record<SalesSection, string> = {
  cafeteria: 'Cafetería',
  heladeria: 'Heladería',
  bar: 'Bar',
  inventario: 'Inventario',
  mesas: 'Mesas',
  almacen: 'Almacén',
  delivery: 'Delivery',
}

const paymentIcons: Record<PaymentMethod, typeof Wallet> = {
  Efectivo: Wallet,
  Tarjeta: CreditCard,
  Débito: CreditCard,
  Transferencia: Banknote,
  'Mercado Pago': PiggyBank,
}

export default function CajaPage() {
  const sales = useSalesStore((state) => state.sales)
  const totalsBySection = useSalesStore(useShallow((state) => state.getTotalsBySection()))
  const paymentTotals = useSalesStore(useShallow((state) => state.getPaymentTotals()))

  const totalGeneral = Object.values(totalsBySection).reduce((sum, value) => sum + value, 0)
  const totalPagos = Object.values(paymentTotals).reduce((sum, value) => sum + value, 0)

  return (
    <main className="min-h-screen bg-[#FAFAFA] p-4 text-stone-800 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-center justify-between rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-xl bg-[#EAF4DC] p-2.5 text-[#6B8E23] transition hover:bg-[#d8ecbe]">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Caja del día</h1>
              <p className="text-xs text-stone-500">Arqueo y consolidado general</p>
            </div>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-[24px] border border-stone-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Total general</span>
              <DollarSign className="h-4 w-4 text-[#6B8E23]" />
            </div>
            <p className="text-2xl font-black">${totalGeneral.toLocaleString('es-AR')}</p>
          </div>
          <div className="rounded-[24px] border border-stone-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Movimientos</span>
              <TrendingUp className="h-4 w-4 text-[#6B8E23]" />
            </div>
            <p className="text-2xl font-black">{sales.length}</p>
          </div>
          <div className="rounded-[24px] border border-stone-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Efectivo</span>
              <Wallet className="h-4 w-4 text-[#6B8E23]" />
            </div>
            <p className="text-2xl font-black">${paymentTotals.Efectivo.toLocaleString('es-AR')}</p>
          </div>
          <div className="rounded-[24px] border border-stone-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Tarjetas crédito y débito</span>
              <CreditCard className="h-4 w-4 text-[#6B8E23]" />
            </div>
            <p className="text-2xl font-black">${(paymentTotals.Tarjeta + paymentTotals.Débito).toLocaleString('es-AR')}</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Resumen por sección</h2>
              <span className="text-xs text-stone-500">Suma de ventas</span>
            </div>

            <div className="space-y-3">
              {Object.entries(sectionLabels).map(([key, label]) => {
                const sectionKey = key as SalesSection
                const amount = totalsBySection[sectionKey]

                return (
                  <div key={sectionKey} className="flex items-center justify-between rounded-2xl border border-stone-200 bg-[#FAFAF9] px-4 py-3">
                    <div>
                      <p className="font-semibold">{label}</p>
                      <p className="text-xs text-stone-500">{sales.filter((sale) => sale.section === sectionKey).length} movimientos</p>
                    </div>
                    <p className="text-lg font-black">${amount.toLocaleString('es-AR')}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Cobros por método</h2>
              <span className="text-xs text-stone-500">Total {totalPagos.toLocaleString('es-AR')}</span>
            </div>

            <div className="space-y-3">
              {(Object.keys(paymentTotals) as PaymentMethod[]).map((method) => {
                const Icon = paymentIcons[method]
                return (
                  <div key={method} className="flex items-center justify-between rounded-2xl border border-stone-200 bg-[#FAFAF9] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-[#EAF4DC] p-2 text-[#6B8E23]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{method}</span>
                    </div>
                    <span className="font-black">${paymentTotals[method].toLocaleString('es-AR')}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
