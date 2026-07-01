"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { AguaraLogo } from "@/components/AguaraLogo"
import {
  LayoutDashboard, BarChart2, Package, Settings, Layers, DollarSign,
  Truck, Percent, Link2, CreditCard, ChevronDown, ChevronRight,
  MessageSquare, Globe, LogOut, BookOpen, Camera, Bell, Users,
  Menu, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

// ─── Platform icons ───────────────────────────────────────────────────────────
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
  label: string; href: string; icon: React.ReactNode; badge?: string
}

const navItems: NavItem[] = [
  { label: "Dashboard",             href: "/",                    icon: <LayoutDashboard size={16} /> },
  { label: "Productos",             href: "/productos",           icon: <BarChart2 size={16} />, badge: "Novedad" },
  { label: "Inventario",            href: "/inventario",          icon: <Package size={16} /> },
  { label: "Contable / Financiero", href: "/reportes/financiero", icon: <BookOpen size={16} /> },
  { label: "Daily Snapshot",        href: "/reportes/snapshot",   icon: <Camera size={16} /> },
  { label: "Clientes",              href: "/clientes",            icon: <Users size={16} /> },
  { label: "Alertas",               href: "/alertas",             icon: <Bell size={16} />, badge: "New" },
]
const pixelItems: NavItem[] = [
  { label: "Meta",       href: "/pixel/meta",   icon: <MetaIcon /> },
  { label: "Google Ads", href: "/pixel/google", icon: <GoogleAdsIcon /> },
]
const configChildren: NavItem[] = [
  { label: "Integraciones",      href: "/config/integraciones", icon: <Link2 size={14} /> },
  { label: "Productos",          href: "/config/productos",     icon: <Package size={14} /> },
  { label: "Envíos",             href: "/config/envios",        icon: <Truck size={14} /> },
  { label: "Comisiones",         href: "/config/comisiones",    icon: <Percent size={14} /> },
  { label: "Costos Adicionales", href: "/config/costos",        icon: <CreditCard size={14} /> },
  { label: "Cotización Dólar",   href: "/config/cotizacion",    icon: <DollarSign size={14} /> },
]

// Bottom nav máximo 5 ítems con icono + label (obligatorio)
const bottomNavItems = [
  { label: "Dashboard", href: "/",        Icon: LayoutDashboard },
  { label: "Alertas",   href: "/alertas", Icon: Bell,            dot: true },
  { label: "Clientes",  href: "/clientes",Icon: Users },
  { label: "Config",    href: "/config/integraciones", Icon: Settings },
]

// ─── NavLink ───────────────────────────────────────────────────────────────────
function NavLink({ item, isActive, onClick }: {
  item: NavItem; isActive: boolean; onClick?: () => void
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      // Touch target ≥ 48px en mobile (py-3), compacto en desktop (py-1.5)
      className={cn(
        "flex items-center gap-2.5 px-2 py-3 lg:py-1.5 rounded-md text-sm",
        "min-h-[48px] lg:min-h-0 touch-manipulation transition-colors",
        isActive
          ? "bg-[#f3e8ff] text-[#7c3aed]"
          : "text-[#6b7280] hover:text-[#0f0f12] hover:bg-black/[0.04] active:bg-black/[0.06]"
      )}
    >
      <span className="opacity-70 shrink-0">{item.icon}</span>
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#7c3aed]/15 text-[#7c3aed] font-medium">
          {item.badge}
        </span>
      )}
    </Link>
  )
}

// ─── Nav interior (reutilizado en sidebar desktop + drawer mobile) ────────────
function NavContent({ onItemClick, isActive, configOpen, setConfigOpen }: {
  onItemClick?: () => void
  isActive: (href: string) => boolean
  configOpen: boolean
  setConfigOpen: (v: boolean) => void
}) {
  return (
    <>
      <p className="px-2 pt-1 pb-2 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">Reportes</p>
      <div className="space-y-0.5 mb-4">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} isActive={isActive(item.href)} onClick={onItemClick} />
        ))}
      </div>

      <p className="px-2 pt-1 pb-2 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">Pixel</p>
      <div className="space-y-0.5 mb-4">
        {pixelItems.map((item) => (
          <NavLink key={item.href} item={item} isActive={isActive(item.href)} onClick={onItemClick} />
        ))}
      </div>

      <p className="px-2 pt-1 pb-2 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">Ajustes</p>
      <div className="space-y-0.5">
        <button
          onClick={() => setConfigOpen(!configOpen)}
          className="w-full flex items-center gap-2.5 px-2 py-3 lg:py-1.5 min-h-[48px] lg:min-h-0 rounded-md text-sm text-[#6b7280] hover:text-[#0f0f12] hover:bg-black/[0.04] active:bg-black/[0.06] transition-colors touch-manipulation"
        >
          <Settings size={16} className="opacity-70" />
          <span className="flex-1 text-left">Configuración</span>
          {configOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        {configOpen && (
          <div className="ml-2 pl-2 border-l border-black/[0.08] space-y-0.5">
            {configChildren.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onItemClick}
                className={cn(
                  "flex items-center gap-2 px-2 py-2.5 lg:py-1.5 min-h-[44px] lg:min-h-0 rounded-md text-[13px] transition-colors touch-manipulation",
                  isActive(item.href)
                    ? "bg-[#f3e8ff] text-[#7c3aed]"
                    : "text-[#6b7280] hover:text-[#0f0f12] hover:bg-black/[0.04]"
                )}
              >
                <span className="opacity-60 shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}
        <Link
          href="/pricing"
          onClick={onItemClick}
          className={cn(
            "flex items-center gap-2.5 px-2 py-3 lg:py-1.5 min-h-[48px] lg:min-h-0 rounded-md text-sm transition-colors touch-manipulation",
            isActive("/pricing") ? "bg-[#f3e8ff] text-[#7c3aed]" : "text-[#6b7280] hover:text-[#0f0f12] hover:bg-black/[0.04]"
          )}
        >
          <Layers size={16} className="opacity-70" />
          <span>Suscripción</span>
        </Link>
      </div>

      <div className="mt-4 space-y-0.5">
        <p className="px-2 pt-1 pb-2 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">Ayuda</p>
        <button className="w-full flex items-center gap-2.5 px-2 py-3 lg:py-1.5 min-h-[48px] lg:min-h-0 rounded-md text-sm text-[#6b7280] hover:text-[#0f0f12] hover:bg-black/[0.04] transition-colors touch-manipulation">
          <MessageSquare size={16} className="opacity-70" />
          <span>Contáctanos</span>
        </button>
        <button className="w-full flex items-center gap-2.5 px-2 py-3 lg:py-1.5 min-h-[48px] lg:min-h-0 rounded-md text-sm text-[#6b7280] hover:text-[#0f0f12] hover:bg-black/[0.04] transition-colors touch-manipulation">
          <Globe size={16} className="opacity-70" />
          <span>Idioma</span>
          <ChevronRight size={12} className="ml-auto" />
        </button>
      </div>
    </>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [configOpen, setConfigOpen] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  // Cerrar drawer al navegar
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuario"
  const displayInitial = displayName[0].toUpperCase()
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href)

  const UserPanel = () => (
    <div className="px-3 py-3 border-t border-black/[0.08] space-y-1">
      <div className="flex items-center gap-2.5 px-1.5 py-1">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#a3e635] flex items-center justify-center text-xs font-bold text-white shrink-0">
          {displayInitial}
        </div>
        <div className="text-left flex-1 min-w-0">
          <p className="text-sm text-[#0f0f12] font-medium truncate">{displayName}</p>
          <p className="text-[10px] text-[#9ca3af] truncate">{user?.email}</p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-2 px-2 py-2 min-h-[44px] rounded-md text-[13px] text-[#6b7280] hover:text-red-600 hover:bg-red-500/[0.08] transition-colors touch-manipulation"
      >
        <LogOut size={13} />
        <span>Cerrar sesión</span>
      </button>
    </div>
  )

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[220px] bg-[#faf7ff] border-r border-black/[0.08] flex-col z-50">
        <div className="px-4 py-4 border-b border-black/[0.08]">
          <Link href="/" className="flex items-center gap-2">
            <AguaraLogo size={24} variant="light" />
            <div>
              <p className="font-bold text-[#0f0f12] text-[13px] leading-none tracking-tight">Aguara</p>
              <p className="text-[9px] text-[#9ca3af] tracking-wider uppercase leading-none mt-0.5">Control Tower</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <NavContent isActive={isActive} configOpen={configOpen} setConfigOpen={setConfigOpen} />
        </nav>
        <UserPanel />
      </aside>

      {/* ── Mobile Top Bar ──────────────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[#faf7ff]/95 backdrop-blur-sm border-b border-black/[0.08] flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <AguaraLogo size={22} variant="light" />
          <p className="font-bold text-[#0f0f12] text-[13px] leading-none tracking-tight">Aguara</p>
        </Link>
        {/* Hamburger: touch target 48×48px */}
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir menú"
          className="w-12 h-12 flex items-center justify-center rounded-lg text-[#6b7280] hover:text-[#0f0f12] hover:bg-black/[0.06] active:bg-black/[0.08] transition-colors touch-manipulation"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* ── Mobile Drawer Backdrop ──────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile Drawer Panel ─────────────────────────────────────────── */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 bottom-0 z-[51] w-[280px] bg-[#faf7ff] border-r border-black/[0.08] flex flex-col",
          "transition-transform duration-300 ease-out will-change-transform",
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Menú de navegación"
        aria-hidden={!drawerOpen}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-black/[0.08]">
          <Link href="/" className="flex items-center gap-2" onClick={() => setDrawerOpen(false)}>
            <AguaraLogo size={24} variant="light" />
            <div>
              <p className="font-bold text-[#0f0f12] text-[13px] leading-none tracking-tight">Aguara</p>
              <p className="text-[9px] text-[#9ca3af] tracking-wider uppercase leading-none mt-0.5">Control Tower</p>
            </div>
          </Link>
          {/* Cerrar: touch target 48×48px */}
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Cerrar menú"
            className="w-12 h-12 flex items-center justify-center rounded-lg text-[#6b7280] hover:text-[#0f0f12] hover:bg-black/[0.06] transition-colors touch-manipulation"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <NavContent
            onItemClick={() => setDrawerOpen(false)}
            isActive={isActive}
            configOpen={configOpen}
            setConfigOpen={setConfigOpen}
          />
        </nav>
        <UserPanel />
      </aside>

      {/* ── Mobile Bottom Navigation (max 5 items, siempre icono + label) ─ */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#faf7ff]/95 backdrop-blur-sm border-t border-black/[0.08] flex items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom)", height: "calc(4rem + env(safe-area-inset-bottom))" }}
        aria-label="Navegación principal"
      >
        {bottomNavItems.map(({ label, href, Icon, dot }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 touch-manipulation transition-all",
                active ? "text-[#7c3aed]" : "text-[#6b7280] active:scale-95"
              )}
            >
              <div className="relative">
                <Icon size={20} />
                {dot && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#7c3aed] border border-[#faf7ff]" />}
              </div>
              <span className={cn("text-[10px]", active ? "font-semibold" : "font-medium")}>{label}</span>
            </Link>
          )
        })}
        {/* Botón "Más" abre el drawer */}
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Ver menú completo"
          className="flex-1 flex flex-col items-center justify-center gap-1 text-[#6b7280] active:scale-95 touch-manipulation transition-all"
        >
          <Menu size={20} />
          <span className="text-[10px] font-medium">Más</span>
        </button>
      </nav>

      {/* ── Spacer mobile top bar ───────────────────────────────────────── */}
      <div className="lg:hidden h-14 shrink-0" aria-hidden="true" />
    </>
  )
}
