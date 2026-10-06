'use client'

import Link from 'next/link'
import { ShoppingBag, Clock, DollarSign, Package, Home } from 'lucide-react'

export default function QuickMenu({ current }: { current: 'pos' | 'historial' | 'caja' | 'inventario' | 'home' }) {
  const navItems = [
    { id: 'home', label: 'Inicio', href: '/', icon: <Home className="w-4 h-4" /> },
    { id: 'pos', label: 'POS', href: '/pos', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'historial', label: 'Pedidos', href: '/historial', icon: <Clock className="w-4 h-4" /> },
    { id: 'caja', label: 'Caja', href: '/caja', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'inventario', label: 'Stock', href: '/inventario', icon: <Package className="w-4 h-4" /> },
  ]

  return (
    <aside className="bg-white border-b border-stone-200 py-3 px-6 shadow-xs sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        
        {/* Logo o título pequeño de la app */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#556B2F]"></span>
          <span className="font-bold text-stone-900 tracking-tight text-sm">Emilia <span className="text-[#556B2F]">Café & Bar</span></span>
        </div>

        {/* Botones de navegación rápida */}
        <nav className="flex items-center gap-1.5 bg-[#F4F7F2] p-1.5 rounded-xl border border-[#556B2F]/15">
          {navItems.map((item) => {
            const isActive = current === item.id
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#556B2F] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Badge operativo */}
        <div className="text-[10px] font-medium bg-[#FDE8EC] text-[#B83B5E] px-2.5 py-1 rounded-md">
          Puerto: 8000
        </div>
      </div>
    </aside>
  )
}