"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Store, Plus, CheckCircle2, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

export interface StoreOption {
  store_id: string
  name: string
  platform: string
  url: string
  ordersToday: number
}

const PLATFORM_COLORS: Record<string, string> = {
  shopify: "text-[#96bf48]",
  tiendanube: "text-[#7c3aed]",
  mercadolibre: "text-[#ffe600]",
}
const PLATFORM_LABELS: Record<string, string> = {
  shopify: "Shopify",
  tiendanube: "Tiendanube",
  mercadolibre: "MercadoLibre",
}

interface StoreSwitcherProps {
  /** Tiendas conectadas (reales, del backend). */
  stores: StoreOption[]
  /** store_id seleccionado, o "all" para la vista consolidada. */
  selected: string
  onSelect: (value: string) => void
}

export function StoreSwitcher({ stores, selected, onSelect }: StoreSwitcherProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  const totalToday = stores.reduce((sum, s) => sum + s.ordersToday, 0)
  const label =
    selected === "all"
      ? "Vista consolidada"
      : stores.find(s => s.store_id === selected)?.name ?? (stores[0]?.name ?? "Tienda")

  function select(value: string) {
    onSelect(value)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-[#374151] bg-black/[0.04] hover:bg-black/[0.06] border border-black/[0.08] rounded-lg px-3 h-8 transition-colors touch-manipulation"
      >
        <Store size={11} />
        <span className="font-medium text-[#0f0f12]">{label}</span>
        <ChevronDown size={10} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-72 bg-white border border-black/[0.10] rounded-xl shadow-2xl shadow-black/10 overflow-hidden z-50">
          <div className="px-3 py-2.5 border-b border-black/[0.08]">
            <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest">Mis tiendas</p>
          </div>

          <div className="divide-y divide-black/[0.06]">
            {stores.map((store) => (
              <button
                key={`${store.platform}:${store.store_id}`}
                onClick={() => select(store.store_id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/[0.04] transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-black/[0.05] border border-black/[0.08] flex items-center justify-center shrink-0">
                  <Globe size={12} className={PLATFORM_COLORS[store.platform] ?? "text-[#6b7280]"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[#0f0f12] truncate">{store.name}</p>
                    {store.store_id === selected && <CheckCircle2 size={11} className="text-[#7c3aed] shrink-0" />}
                  </div>
                  <p className="text-[10px] text-[#9ca3af]">
                    <span className={PLATFORM_COLORS[store.platform] ?? "text-[#6b7280]"}>
                      {PLATFORM_LABELS[store.platform] ?? store.platform}
                    </span>
                    {" · "}{store.ordersToday} órdenes hoy
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Vista consolidada — solo tiene sentido con más de una tienda */}
          {stores.length > 1 && (
            <div className="border-t border-black/[0.08]">
              <button
                onClick={() => select("all")}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/[0.04] transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center shrink-0">
                  <Store size={12} className="text-[#7c3aed]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#0f0f12]">Vista consolidada</p>
                  <p className="text-[10px] text-[#9ca3af]">
                    {totalToday} órdenes hoy · {stores.length} tiendas
                  </p>
                </div>
                {selected === "all" && <CheckCircle2 size={11} className="text-[#7c3aed] shrink-0" />}
              </button>
            </div>
          )}

          <div className="border-t border-black/[0.08] px-4 py-3">
            <a
              href="/config/integraciones"
              className="flex items-center gap-2 text-xs text-[#6b7280] hover:text-[#374151] transition-colors"
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
