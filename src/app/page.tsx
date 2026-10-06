'use client'

import { useState, useRef, useEffect } from 'react'
import { ShoppingBag, Clock, DollarSign, Package, Sparkles, ArrowRight, Coffee, IceCream, UtensilsCrossed, Store, Palette, ChevronDown, Heart, Sparkle, Users, Bike, Truck } from 'lucide-react'
import Link from 'next/link'

// ==========================================
// SISTEMA DE EMOCIONES (Gato Anime Chibi)
// ==========================================

type EmiEmotion = 'happy' | 'neutral' | 'surprised' | 'sad' | 'thinking'

const EyeExpressions = {
  happy: (
    <>
      <path d="M 40 54 Q 47 46 54 54" stroke="#1E1B24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 66 54 Q 73 46 80 54" stroke="#1E1B24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  neutral: (
    <>
      <ellipse cx="47" cy="52" rx="5" ry="7" fill="#1E1B24" />
      <ellipse cx="73" cy="52" rx="5" ry="7" fill="#1E1B24" />
      <circle cx="45" cy="49" r="2" fill="#FFFFFF" />
      <circle cx="71" cy="49" r="2" fill="#FFFFFF" />
    </>
  ),
  surprised: (
    <>
      <circle cx="47" cy="52" r="6.5" fill="#1E1B24" />
      <circle cx="73" cy="52" r="6.5" fill="#1E1B24" />
      <circle cx="49" cy="50" r="2.2" fill="#FFFFFF" />
      <circle cx="75" cy="50" r="2.2" fill="#FFFFFF" />
    </>
  ),
  sad: (
    <>
      <ellipse cx="47" cy="54" rx="5" ry="7" fill="#1E1B24" />
      <ellipse cx="73" cy="54" rx="5" ry="7" fill="#1E1B24" />
      <circle cx="45" cy="52" r="1.5" fill="#FFFFFF" />
      <circle cx="71" cy="52" r="1.5" fill="#FFFFFF" />
      <path d="M 39 46 Q 47 50 55 46" stroke="#1E1B24" strokeWidth="1.5" fill="none" />
      <path d="M 65 46 Q 73 50 81 46" stroke="#1E1B24" strokeWidth="1.5" fill="none" />
    </>
  ),
  thinking: (
    <>
      <line x1="41" y1="52" x2="53" y2="52" stroke="#1E1B24" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="67" y1="52" x2="79" y2="52" stroke="#1E1B24" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 48 42 Q 60 38 72 42" stroke="#1E1B24" strokeWidth="1.5" fill="none" />
    </>
  ),
}

const MouthExpressions = {
  happy: (
    <path d="M 54 64 Q 57 68 60 64 Q 63 68 66 64" stroke="#1E1B24" strokeWidth="2" fill="none" strokeLinecap="round" />
  ),
  neutral: (
    <path d="M 55 65 Q 60 68 65 65" stroke="#1E1B24" strokeWidth="2" fill="none" strokeLinecap="round" />
  ),
  surprised: (
    <circle cx="60" cy="66" r="3.5" fill="#1E1B24" />
  ),
  sad: (
    <path d="M 55 68 Q 60 63 65 68" stroke="#1E1B24" strokeWidth="2" fill="none" strokeLinecap="round" />
  ),
  thinking: (
    <ellipse cx="60" cy="66" rx="2.5" ry="1.5" fill="#1E1B24" />
  ),
}

function ChibiNekoEmi({ emotion = 'neutral', isDark }: { emotion?: EmiEmotion, isDark: boolean }) {
  return (
    <div className="relative group shrink-0">
      <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-[#FF85A1] via-[#FFB3C1] to-[#FFF0F3] p-1.5 shadow-md flex items-center justify-center overflow-hidden">
        <div className="w-full h-full bg-[#1E1B24] rounded-[22px] overflow-hidden relative flex items-center justify-center">
          
          <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-lg scale-110 translate-y-1 transition-all duration-300">
            <circle cx="60" cy="62" r="55" fill="#FFE8EC" />
            <path d="M 10 100 Q 60 75 110 100 Z" fill="#FF85A1" opacity="0.3" />
            
            {/* Orejas de Gato Anime */}
            <path d="M 32 36 L 20 10 L 45 24 Z" fill="#6B3E1F" />
            <path d="M 30 32 L 24 14 L 41 24 Z" fill="#FFB3C1" />
            <path d="M 88 36 L 100 10 L 75 24 Z" fill="#6B3E1F" />
            <path d="M 90 32 L 96 14 L 79 24 Z" fill="#FFB3C1" />

            {/* Cuerpo y Remera */}
            <path d="M 30 110 C 30 85 90 85 90 110 Z" fill="#0F172A" />
            <path d="M 45 88 L 75 88 L 60 105 Z" fill="#FFFFFF" />
            <circle cx="60" cy="92" r="3.5" fill="#FF85A1" />

            {/* Cabeza / Pelo */}
            <circle cx="60" cy="64" r="36" fill="#6B3E1F" />
            <ellipse cx="60" cy="65" rx="27" ry="25" fill="#FFEDDF" />

            {/* Flequillo Anime */}
            <path d="M 35 48 Q 60 30 85 48 Q 90 62 83 75 Q 72 56 60 54 Q 48 56 37 75 Q 30 62 35 48 Z" fill="#6B3E1F" />
            <path d="M 42 45 Q 60 30 78 45 Q 69 36 60 36 Q 51 36 42 45 Z" fill="#8B5CF6" opacity="0.2" />

            <circle cx="60" cy="38" r="4.5" fill="#FF85A1" />
            <circle cx="60" cy="38" r="1.5" fill="#FFFFFF" />

            {/* Sonrojos */}
            <ellipse cx="38" cy="71" rx="4.5" ry="2" fill="#FF85A1" opacity="0.6" />
            <ellipse cx="82" cy="71" rx="4.5" ry="2" fill="#FF85A1" opacity="0.6" />

            {/* Bigotes */}
            <line x1="33" y1="68" x2="26" y2="66" stroke="#C27803" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
            <line x1="33" y1="71" x2="25" y2="72" stroke="#C27803" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
            <line x1="87" y1="68" x2="94" y2="66" stroke="#C27803" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
            <line x1="87" y1="71" x2="95" y2="72" stroke="#C27803" strokeWidth="1" strokeLinecap="round" opacity="0.4" />

            {/* Ojos y Boca dinámicos */}
            {EyeExpressions[emotion]}
            {MouthExpressions[emotion]}
            
          </svg>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('cafeteria')
  const [theme, setTheme] = useState<'minimal-light' | 'minimal-dark' | 'normal-light' | 'normal-dark'>('normal-light')
  const [isThemeOpen, setIsThemeOpen] = useState(false)
  
  const [emiEmotion, setEmiEmotion] = useState<EmiEmotion>('happy')
  const [emiMessage, setEmiMessage] = useState('¡Miau! Hola amo, listos para organizar los pedidos y proveedores 📦✨')
  const [fadeAnim, setFadeAnim] = useState(true)
  
  const dropdownRef = useRef<HTMLDivElement>(null)

  const emiDialogs: { text: string, emotion: EmiEmotion }[] = [
    { text: '¡Miau! Acuérdate de registrar bien cada cobro o me pongo triste 😿', emotion: 'sad' },
    { text: '¡El aroma a café recién molido está increíble hoy! ☕✨', emotion: 'happy' },
    { text: '¿Controlando las facturas de proveedores? ¡Yo te ayudo con las cuentas!', emotion: 'happy' },
    { text: '¡A trabajar duro para que Emilia sea la mejor del barrio! 🚀', emotion: 'happy' },
    { text: '¡Cuidado con los pedidos de helado que se derriten rápido! 🍦', emotion: 'surprised' },
    { text: 'Hmm... déjame pensar qué mercadería hace falta reponer.', emotion: 'thinking' },
    { text: '¡Hola de nuevo, amo! ¿Qué sección revisamos ahora?', emotion: 'neutral' }
  ]

  const triggerRandomTalk = () => {
    setFadeAnim(false)
    setTimeout(() => {
      const randomDialog = emiDialogs[Math.floor(Math.random() * emiDialogs.length)]
      setEmiMessage(randomDialog.text)
      setEmiEmotion(randomDialog.emotion)
      setFadeAnim(true)
    }, 150)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      triggerRandomTalk()
    }, 9000)
    return () => clearInterval(interval)
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

  // 9 MÓDULOS CON RUTAS DIRECTAS EN src/app/
  const modules = [
    { 
      id: 'cafeteria',
      title: 'Cafetería', 
      subtitle: 'Cafés y Medialunas',
      desc: 'Gestión específica de barra de café y pastelería.', 
      href: '/cafeteria', 
      icon: <Coffee className="w-5 h-5 text-[#8C1D40]" />,
      badge: 'Venta',
      normalBgDark: 'bg-[#FFCCD5]/25 hover:bg-[#FFCCD5]/35 border-[#FF85A1]/40',
      normalBgLight: 'bg-[#FFCCD5] hover:bg-[#ffb3c1] border-[#FF85A1]/50',
      textColorDark: 'text-[#FF85A1]',
      textColorLight: 'text-[#8C1D40]'
    },
    { 
      id: 'heladeria',
      title: 'Heladería', 
      subtitle: 'Potes, Bochas y Kilos',
      desc: 'Grilla táctil para despacho de helados y sabores.', 
      href: '/heladeria', 
      icon: <IceCream className="w-5 h-5 text-[#D97706]" />,
      badge: 'Venta',
      normalBgDark: 'bg-[#FEF3C7]/25 hover:bg-[#FEF3C7]/35 border-[#F59E0B]/40',
      normalBgLight: 'bg-[#FEF3C7] hover:bg-[#fde68a] border-[#F59E0B]/50',
      textColorDark: 'text-[#FBBF24]',
      textColorLight: 'text-[#B45309]'
    },
    { 
      id: 'bar',
      title: 'Bar / Comidas', 
      subtitle: 'Tragos, Platos y Bebidas',
      desc: 'Control de comandas de cocina y tragos del bar.', 
      href: '/bar', 
      icon: <UtensilsCrossed className="w-5 h-5 text-[#0D9488]" />,
      badge: 'Venta',
      normalBgDark: 'bg-[#CCFBF1]/25 hover:bg-[#CCFBF1]/35 border-[#14B8A6]/40',
      normalBgLight: 'bg-[#CCFBF1] hover:bg-[#99f6e4] border-[#14B8A6]/50',
      textColorDark: 'text-[#5EEAD4]',
      textColorLight: 'text-[#0F766E]'
    },
    { 
      id: 'almacen',
      title: 'Almacén / Kiosko', 
      subtitle: 'Gaseosas y Golosinas',
      desc: 'Venta por unidad de productos en góndola o heladera.', 
      href: '/almacen', 
      icon: <Store className="w-5 h-5 text-[#7C3AED]" />,
      badge: 'Venta',
      normalBgDark: 'bg-[#EDE9FE]/25 hover:bg-[#EDE9FE]/35 border-[#8B5CF6]/40',
      normalBgLight: 'bg-[#EDE9FE] hover:bg-[#ddd6fe] border-[#8B5CF6]/50',
      textColorDark: 'text-[#C4B5FD]',
      textColorLight: 'text-[#6D28D9]'
    },
    { 
      id: 'delivery',
      title: 'Pickers & Envíos', 
      subtitle: 'PedidosYa, Rappi y Uber',
      desc: 'Anotación manual de pedidos por plataformas y envíos rápidos.', 
      href: '/delivery', 
      icon: <Bike className="w-5 h-5 text-[#6B8E23]" />,
      badge: 'Delivery',
      normalBgDark: 'bg-[#EAF4DC]/25 hover:bg-[#EAF4DC]/35 border-[#6B8E23]/40',
      normalBgLight: 'bg-[#EAF4DC] hover:bg-[#d8ecbe] border-[#6B8E23]/40',
      textColorDark: 'text-[#C5E1A5]',
      textColorLight: 'text-[#4A6B15]'
    },
    { 
      id: 'mesas',
      title: 'Control de Mesas', 
      subtitle: 'Salón y Ocupación',
      desc: 'Seguimiento de mesas activas e identificación rápida.', 
      href: '/mesas', 
      icon: <Users className="w-5 h-5 text-[#2563EB]" />,
      badge: 'Salón',
      normalBgDark: 'bg-[#DBEAFE]/25 hover:bg-[#DBEAFE]/35 border-[#3B82F6]/40',
      normalBgLight: 'bg-[#DBEAFE] hover:bg-[#bfdbfe] border-[#3B82F6]/50',
      textColorDark: 'text-[#93C5FD]',
      textColorLight: 'text-[#1D4ED8]'
    },
    { 
      id: 'proveedores',
      title: 'Proveedores', 
      subtitle: 'Control de Compras',
      desc: 'Registro de ingresos de mercadería, facturas y distribuidores.', 
      href: '/proveedores', 
      icon: <Truck className="w-5 h-5 text-[#EA580C]" />,
      badge: 'Compras',
      normalBgDark: 'bg-[#FFEDD5]/25 hover:bg-[#FFEDD5]/35 border-[#F97316]/40',
      normalBgLight: 'bg-[#FFEDD5] hover:bg-[#fed7aa] border-[#F97316]/50',
      textColorDark: 'text-[#FDBA74]',
      textColorLight: 'text-[#C2410C]'
    },
    { 
      id: 'caja',
      title: 'Caja del Día', 
      subtitle: 'Arqueo Automático',
      desc: 'Suma centralizada de las secciones de venta y cierres.', 
      href: '/caja', 
      icon: <DollarSign className="w-5 h-5 text-[#059669]" />,
      badge: 'Control',
      normalBgDark: 'bg-[#D1FAE5]/25 hover:bg-[#D1FAE5]/35 border-[#10B981]/40',
      normalBgLight: 'bg-[#D1FAE5] hover:bg-[#a7f3d0] border-[#10B981]/50',
      textColorDark: 'text-[#6EE7B7]',
      textColorLight: 'text-[#047857]'
    },
    { 
      id: 'inventario',
      title: 'Stock General', 
      subtitle: 'Insumos y Depósito',
      desc: 'Control detallado de stock de mercadería.', 
      href: '/inventario', 
      icon: <Package className="w-5 h-5 text-[#475569]" />,
      badge: 'Depósito',
      normalBgDark: 'bg-stone-800/50 hover:bg-stone-800 border-stone-700',
      normalBgLight: 'bg-[#F1F5F9] hover:bg-[#e2e8f0] border-[#64748B]/50',
      textColorDark: 'text-stone-300',
      textColorLight: 'text-[#334155]'
    },
  ]

  const currentModule = modules.find(m => m.id === activeTab) || modules[0]

  const isDark = theme.includes('dark')
  const isMinimal = theme.includes('minimal')

  const themeOptions = [
    { id: 'minimal-light', label: 'Minimal (Light)' },
    { id: 'minimal-dark', label: 'Minimal (Dark)' },
    { id: 'normal-light', label: 'Normal (Light)' },
    { id: 'normal-dark', label: 'Normal (Dark)' },
  ] as const

  return (
    <main className={`min-h-screen font-sans p-4 md:p-8 flex flex-col justify-between transition-colors duration-300 ${
      isDark ? 'bg-stone-950 text-stone-100' : 'bg-[#FAFAFA] text-stone-800'
    }`}>
      <div className="max-w-5xl mx-auto w-full">
        
        {/* Header */}
        <header className={`flex flex-col sm:flex-row items-center justify-between px-6 py-4 rounded-2xl shadow-2xs border mb-6 gap-4 transition-colors duration-300 ${
          isDark ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-stone-200/80 text-stone-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-stone-800 text-[#6B8E23]' : 'bg-[#EAF4DC] text-[#6B8E23]'}`}>
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
                Emilia Café & Bar <span className={`text-xs font-normal ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>| POS System</span>
              </h1>
              <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Panel de Control Unificado</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsThemeOpen(!isThemeOpen)}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-2xs ${
                  isDark 
                    ? 'bg-stone-800 text-[#FFCCD5] border border-stone-700 hover:bg-stone-750' 
                    : 'bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-[#6B8E23]" />
                <span>Theme: {themeOptions.find(t => t.id === theme)?.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isThemeOpen ? 'rotate-180' : ''}`} />
              </button>

              {isThemeOpen && (
                <div className={`absolute right-0 mt-2 w-44 rounded-2xl shadow-xl border py-1.5 z-50 ${
                  isDark ? 'bg-stone-900 border-stone-800 text-stone-200' : 'bg-white border-stone-200 text-stone-800'
                }`}>
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setTheme(opt.id)
                        setIsThemeOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                        theme === opt.id 
                          ? (isDark ? 'bg-stone-800 text-[#6B8E23] font-bold' : 'bg-[#EAF4DC]/50 text-[#6B8E23] font-bold') 
                          : (isDark ? 'hover:bg-stone-800/60' : 'hover:bg-stone-50')
                      }`}
                    >
                      <span>{opt.label}</span>
                      {theme === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-[#6B8E23]"></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
              isDark ? 'bg-stone-800 text-[#FFCCD5]' : 'bg-[#FFCCD5]/50 text-[#8C1D40]'
            }`}>
              <Sparkles className="w-3 h-3" />
              9 Módulos
            </span>
          </div>
        </header>

        {/* CONTENEDOR MÓDULOS */}
        {isMinimal ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {modules.map((mod) => {
                const isSelected = activeTab === mod.id
                return (
                  <button
                    key={mod.id}
                    onClick={() => setActiveTab(mod.id)}
                    className={`text-left p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between h-28 cursor-pointer ${
                      isSelected 
                        ? (isDark ? 'bg-stone-800 border-[#6B8E23] ring-1 ring-[#6B8E23]/30' : 'bg-[#EAF4DC]/60 border-[#6B8E23] ring-1 ring-[#6B8E23]/20')
                        : (isDark ? 'bg-stone-900 border-stone-800 hover:bg-stone-850' : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50')
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl ${isSelected ? (isDark ? 'bg-stone-900' : 'bg-white shadow-2xs') : (isDark ? 'bg-stone-800' : 'bg-stone-100')}`}>
                        {mod.icon}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-[#FFCCD5] text-[#8C1D40]' : (isDark ? 'bg-stone-800 text-stone-400' : 'bg-stone-100 text-stone-600')}`}>
                        {mod.badge}
                      </span>
                    </div>
                    <div>
                      <h3 className={`text-xs font-bold tracking-tight ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>{mod.title}</h3>
                      <p className={`text-[10px] truncate ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>{mod.subtitle}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className={`border rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-colors ${
              isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200/80'
            }`}>
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B8E23] bg-[#EAF4DC]/20 px-2.5 py-0.5 rounded-md">
                  Módulo Seleccionado
                </span>
                <h2 className={`text-xl font-bold mt-2 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>{currentModule.title}</h2>
                <p className={`text-xs max-w-lg leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>{currentModule.desc}</p>
              </div>

              <Link
                href={currentModule.href}
                className="bg-[#6B8E23] hover:bg-[#55731B] text-white text-xs font-bold px-6 py-3 rounded-2xl shadow-xs transition flex items-center gap-2 shrink-0"
              >
                <span>Abrir {currentModule.title}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {modules.map((mod) => {
              const bgClass = isDark ? mod.normalBgDark : mod.normalBgLight
              const textClass = isDark ? mod.textColorDark : mod.textColorLight

              return (
                <Link
                  key={mod.id}
                  href={mod.href}
                  className={`${bgClass} border-2 p-5 rounded-3xl shadow-sm transition-all duration-300 hover:scale-[1.03] hover:shadow-md flex flex-col justify-between h-40 group`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-2xl shadow-2xs group-hover:rotate-6 transition-transform ${isDark ? 'bg-stone-900/60' : 'bg-white'}`}>
                      {mod.icon}
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-2xs ${
                      isDark ? 'bg-stone-900 text-stone-200 border border-stone-800' : 'bg-white/85 text-stone-900'
                    }`}>
                      {mod.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className={`text-base font-extrabold ${textClass} tracking-tight`}>{mod.title}</h3>
                    <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-stone-300/80' : 'text-stone-800/80'}`}>{mod.subtitle}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* ================= SECCIÓN DE EMI GATITA AUTOMÁTICA ================= */}
        <div className={`mt-6 p-5 rounded-3xl border flex flex-col sm:flex-row items-center gap-6 transition-colors shadow-sm ${
          isDark ? 'bg-stone-900/90 border-stone-800' : 'bg-white border-stone-200/90'
        }`}>
          <ChibiNekoEmi emotion={emiEmotion} isDark={isDark} />

          <div className="flex-1 text-center sm:text-left w-full">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-black tracking-tight ${isDark ? 'text-pink-400' : 'text-[#8C1D40]'}`}>
                  Emi 🐾
                </span>
                <span className="text-[10px] bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-pink-200 dark:border-pink-900">
                  <Sparkle className="w-3 h-3" /> Neko Assistant (En vivo)
                </span>
              </div>
              
              <button
                onClick={triggerRandomTalk}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  isDark 
                    ? 'bg-stone-800 hover:bg-stone-750 text-pink-300 border border-stone-700' 
                    : 'bg-pink-50 hover:bg-pink-100 text-[#8C1D40] border border-pink-200'
                }`}
              >
                <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500 animate-pulse" />
                <span>¡Forzar cambio ya!</span>
              </button>
            </div>
            
            <div className={`p-4 rounded-2xl border transition-colors ${
              isDark ? 'bg-stone-950/50 border-stone-800' : 'bg-stone-50 border-stone-200/60'
            }`}>
              <p className={`text-xs sm:text-sm leading-relaxed font-medium transition-opacity duration-200 ${
                fadeAnim ? 'opacity-100' : 'opacity-0'
              } ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                &ldquo;{emiMessage}&rdquo;
              </p>
            </div>
          </div>
        </div>

      </div>

      <footer className="text-center text-xs opacity-50 mt-8">
        Emilia POS &bull; Hecho a pulmón con código puro ⚡
      </footer>
    </main>
  )
}