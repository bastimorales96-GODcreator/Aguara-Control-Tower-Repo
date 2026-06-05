"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { AguaraLogo } from "@/components/AguaraLogo"
import {
  LayoutDashboard,
  BarChart2,
  Package,
  Settings,
  Layers,
  DollarSign,
  Truck,
  Percent,
  Link2,
  CreditCard,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Globe,
  LogOut,
  BookOpen,
  Camera,
  Bell,
  Users,
  Store,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

const MetaIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
  </svg>
)

const GoogleAdsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 12.97L6.06 5.96C6.82 4.63 8.5 4.18 9.82 4.95L17.77 9.45L13.72 16.46L5.77 11.96C4.45 11.19 4 9.51 4.76 8.18" opacity="0.6"/>
    <path d="M14.5 21C12.84 21 11.5 19.66 11.5 18C11.5 16.34 12.84 15 14.5 15C16.16 15 17.5 16.34 17.5 18C17.5 19.66 16.16 21 14.5 21Z"/>
    <path d="M21.99 11.03L17.94 18.04C17.18 19.37 15.5 19.82 14.18 19.05L6.23 14.55L10.28 7.54L18.23 12.04C19.55 12.81 20 14.49 19.24 15.82" opacity="0.6"/>
  </svg>
)

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string
  children?: NavItem[]
}

const navItems: NavItem[] = [
  {
    label: "Reportes",
    href: "#",
    icon: null,
  },
  {
    label: "Dashboard",
    href: "/",
    icon: <LayoutDashboard size={16} />,
  },
  {
    label: "Productos",
    href: "/productos",
    icon: <BarChart2 size={16} />,
    badge: "Novedad",
  },
  {
    label: "Inventario",
    href: "/inventario",
    icon: <Package size={16} />,
  },
  {
    label: "Contable / Financiero",
    href: "/reportes/financiero",
    icon: <BookOpen size={16} />,
  },
  {
    label: "Daily Snapshot",
    href: "/reportes/snapshot",
    icon: <Camera size={16} />,
  },
  {
    label: "Clientes",
    href: "/clientes",
    icon: <Users size={16} />,
  },
  {
    label: "Alertas",
    href: "/alertas",
    icon: <Bell size={16} />,
    badge: "New",
  },
]

const pixelItems: NavItem[] = [
  { label: "Meta", href: "/pixel/meta", icon: <MetaIcon /> },
  { label: "Google Ads", href: "/pixel/google", icon: <GoogleAdsIcon /> },
]

const configChildren: NavItem[] = [
  { label: "Integraciones", href: "/config/integraciones", icon: <Link2 size={14} /> },
  { label: "Productos", href: "/config/productos", icon: <Package size={14} /> },
  { label: "Envíos", href: "/config/envios", icon: <Truck size={14} /> },
  { label: "Comisiones", href: "/config/comisiones", icon: <Percent size={14} /> },
  { label: "Costos Adicionales", href: "/config/costos", icon: <CreditCard size={14} /> },
  { label: "Cotización Dólar", href: "/config/cotizacion", icon: <DollarSign size={14} /> },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [configOpen, setConfigOpen] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuario"
  const displayInitial = displayName[0].toUpperCase()

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-[#0a1020] border-r border-white/[0.06] flex flex-col z-50">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2">
          <AguaraLogo size={24} variant="dark" />
          <div>
            <p className="font-bold text-white text-[13px] leading-none tracking-tight">Aguara</p>
            <p className="text-[9px] text-white/30 tracking-wider uppercase leading-none mt-0.5">Control Tower</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {/* Reportes */}
        <p className="px-2 pt-1 pb-2 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
          Reportes
        </p>
        <div className="space-y-0.5 mb-4">
          {navItems.slice(1).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors",
                isActive(item.href)
                  ? "bg-white/[0.08] text-white"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
              )}
            >
              <span className="opacity-70">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-[#4f8ef7]/20 text-[#4f8ef7] font-medium">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Pixel */}
        <p className="px-2 pt-1 pb-2 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
          Pixel
        </p>
        <div className="space-y-0.5 mb-4">
          {pixelItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors",
                isActive(item.href)
                  ? "bg-white/[0.08] text-white"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
              )}
            >
              <span className="opacity-70">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Ajustes */}
        <p className="px-2 pt-1 pb-2 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
          Ajustes
        </p>
        <div className="space-y-0.5">
          <button
            onClick={() => setConfigOpen(!configOpen)}
            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-colors"
          >
            <Settings size={16} className="opacity-70" />
            <span>Configuración</span>
            <span className="ml-auto">
              {configOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </span>
          </button>
          {configOpen && (
            <div className="ml-2 pl-2 border-l border-white/[0.06] space-y-0.5">
              {configChildren.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] transition-colors",
                    isActive(item.href)
                      ? "bg-white/[0.08] text-white"
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                  )}
                >
                  <span className="opacity-60">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}
          <Link
            href="/pricing"
            className={cn(
              "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors",
              isActive("/pricing")
                ? "bg-white/[0.08] text-white"
                : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
            )}
          >
            <Layers size={16} className="opacity-70" />
            <span>Suscripción</span>
          </Link>
        </div>

        {/* Help */}
        <div className="mt-4 space-y-0.5">
          <p className="px-2 pt-1 pb-2 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
            Ayuda
          </p>
          <button className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors">
            <MessageSquare size={16} className="opacity-70" />
            <span>Contáctanos</span>
          </button>
          <button className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors">
            <Globe size={16} className="opacity-70" />
            <span>Idioma</span>
            <ChevronRight size={12} className="ml-auto" />
          </button>
        </div>
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-white/[0.06] space-y-1">
        <div className="flex items-center gap-2.5 px-1.5 py-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4f8ef7] to-[#a3e635] flex items-center justify-center text-xs font-bold text-[#080d14] shrink-0">
            {displayInitial}
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm text-white/80 font-medium truncate">{displayName}</p>
            <p className="text-[10px] text-white/30 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-white/30 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors"
        >
          <LogOut size={13} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
