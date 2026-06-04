"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Store, Plus, CheckCircle2, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

interface StoreOption {
  id: string
  name: string
  platform: "shopify" | "tiendanube"
  domain: string
  ordersToday: number
  active: boolean
}

// Mock stores — in production fetched from Supabase
const MOCK_STORES: StoreOption[] = [
  { id: "1", name: "VHome", platform: "shopify", domain: "vhome.myshopify.com", ordersToday: 47, active: true },
  { id: "2", name: "Mi Segunda Tienda", platform: "tiendanube", domain: "misegunda.tiendanube.com", ordersToday: 12, active: false },
]

const PLATFORM_COLORS: Record<string, string> = {
  shopify: "text-[#96bf48]",
  tiendanube: "text-[#4f8ef7]",
}
const PLATFORM_LABELS: Record<string, string> = {
  shopify: "Shopify",
  tiendanube: "Tiendanube",
}

interface StoreSwitcherProps {
  /** The currently active store name from real API, shown as label when no multi-store */
  currentStoreName?: string
}

export function StoreSwitcher({ currentStoreName }: StoreSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [stores, setStores] = useState<StoreOption[]>(MOCK_STORES)
  const [activeId, setActiveId] = useState("1")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  const activeStore = stores.find(s => s.id === activeId) ?? stores[0]

  function selectStore(id: string) {
    setActiveId(id)
    setStores(prev => prev.map(s => ({ ...s, active: s.id === id })))
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-white/60 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg px-3 py-1.5 transition-colors"
      >
        <Store size={11} />
        <span className="font-medium text-white/80">{currentStoreName ?? activeStore.name}</span>
        <ChevronDown size={10} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-72 bg-[#0f1825] border border-white/[0.10] rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
          <div className="px-3 py-2.5 border-b border-white/[0.06]">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Mis tiendas</p>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => selectStore(store.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
                  <Globe size={12} className={PLATFORM_COLORS[store.platform]} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">{store.name}</p>
                    {store.id === activeId && <CheckCircle2 size={11} className="text-[#4f8ef7] shrink-0" />}
                  </div>
                  <p className="text-[10px] text-white/30">
                    <span className={PLATFORM_COLORS[store.platform]}>{PLATFORM_LABELS[store.platform]}</span>
                    {" · "}{store.ordersToday} órdenes hoy
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Aggregated view */}
          <div className="border-t border-white/[0.06]">
            <button
              onClick={() => { setActiveId("all"); setOpen(false) }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-[#4f8ef7]/10 border border-[#4f8ef7]/20 flex items-center justify-center shrink-0">
                <Store size={12} className="text-[#4f8ef7]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Vista consolidada</p>
                <p className="text-[10px] text-white/30">
                  {stores.reduce((sum, s) => sum + s.ordersToday, 0)} órdenes totales · {stores.length} tiendas
                </p>
              </div>
              {activeId === "all" && <CheckCircle2 size={11} className="text-[#4f8ef7] shrink-0" />}
            </button>
          </div>

          {/* Add store */}
          <div className="border-t border-white/[0.06] px-4 py-3">
            <a
              href="/config/integraciones"
              className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              <Plus size={11} />
              Conectar nueva tienda
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
