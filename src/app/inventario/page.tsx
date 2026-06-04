"use client"

export const dynamic = "force-dynamic"

import { Suspense } from "react"
import { ChevronDown, DollarSign, Lock, Star, CheckCircle2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { DateRangePicker, defaultDateRange } from "@/components/DateRangePicker"
import type { DateRange } from "@/components/DateRangePicker"

const mockInventory = [
  { sku: "REM-OVR-BLA-M", name: "Remera Oversized Blanca", variant: "M / Blanca", stock: 48, level: "alto", value: 278400, threshold: 10 },
  { sku: "PAN-CGO-VRD-L", name: "Pantalón Cargo Verde", variant: "L / Verde", stock: 12, level: "bajo", value: 122400, threshold: 15 },
  { sku: "BUZ-CNG-NGR-XL", name: "Buzo Canguro Negro", variant: "XL / Negro", stock: 31, level: "medio", value: 235600, threshold: 20 },
  { sku: "GOR-BRD-LOG-U", name: "Gorra Bordada Logo", variant: "Único", stock: 124, level: "alto", value: 260400, threshold: 10 },
  { sku: "SHO-DEP-AZL-S", name: "Short Deportivo Azul", variant: "S / Azul", stock: 7, level: "critico", value: 30800, threshold: 15 },
  { sku: "CAM-ROM-GRS-M", name: "Campera Rompevientos", variant: "M / Gris", stock: 19, level: "medio", value: 313500, threshold: 20 },
  { sku: "REM-OVR-BLA-L", name: "Remera Oversized Blanca", variant: "L / Blanca", stock: 3, level: "critico", value: 17400, threshold: 10 },
  { sku: "PAN-CGO-VRD-M", name: "Pantalón Cargo Verde", variant: "M / Verde", stock: 28, level: "medio", value: 285600, threshold: 15 },
]

const levelConfig = {
  alto:    { label: "Alto",     className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  medio:   { label: "Medio",    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
  bajo:    { label: "Bajo",     className: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
  critico: { label: "Crítico",  className: "bg-red-500/15 text-red-400 border-red-500/20" },
}

function InventoryTable() {
  const totalValue = mockInventory.reduce((s, p) => s + p.value, 0)
  const criticalCount = mockInventory.filter(p => p.level === "critico").length

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "SKUs activos", value: mockInventory.length.toString() },
          { label: "Valor total en stock", value: `$${totalValue.toLocaleString("es-AR")}` },
          { label: "Alertas críticas", value: criticalCount.toString(), alert: criticalCount > 0 },
        ].map((s) => (
          <div key={s.label} className="bg-[#0f1825] border border-white/[0.07] rounded-xl px-5 py-4">
            <p className="text-xs text-white/40 mb-1">{s.label}</p>
            <p className={cn("text-2xl font-semibold", s.alert ? "text-red-400" : "text-white")}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#0f1825] border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-medium text-white">Stock por Variante</h3>
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertTriangle size={12} />
              <span>{criticalCount} variantes sin stock suficiente</span>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Producto", "Variante", "SKU", "Stock", "Nivel", "Valor en stock"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-medium text-white/30 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {mockInventory.map((p) => (
                <tr key={p.sku} className={cn(
                  "hover:bg-white/[0.02] transition-colors",
                  p.level === "critico" && "bg-red-500/[0.03]"
                )}>
                  <td className="px-5 py-3 text-white/80 text-xs font-medium">{p.name}</td>
                  <td className="px-5 py-3 text-white/50 text-xs">{p.variant}</td>
                  <td className="px-5 py-3 text-white/30 font-mono text-[11px]">{p.sku}</td>
                  <td className="px-5 py-3">
                    <span className={cn("text-sm font-semibold", p.stock <= p.threshold ? "text-red-400" : "text-white/80")}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-md border",
                      levelConfig[p.level as keyof typeof levelConfig].className
                    )}>
                      {levelConfig[p.level as keyof typeof levelConfig].label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-white/60 text-xs">${p.value.toLocaleString("es-AR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PaywallOverlay() {
  return (
    <div className="px-6 py-6 max-w-[1200px]">
      <div className="relative">
        <div className="select-none pointer-events-none" style={{ filter: "blur(5px)", opacity: 0.35 }}>
          <InventoryTable />
        </div>
        <div className="fixed inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ top: 48 }}>
          <div className="bg-[#0f1825] border border-white/[0.10] rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl pointer-events-auto">
            <div className="w-12 h-12 rounded-xl bg-[#4f8ef7]/10 border border-[#4f8ef7]/20 flex items-center justify-center mx-auto mb-4">
              <Lock size={20} className="text-[#4f8ef7]" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Control de Inventario</h2>
            <p className="text-sm text-white/50 mb-6 leading-relaxed">
              Esta función está disponible en el plan Avanzado. Controlá tu stock en tiempo real desde Aguara.
            </p>
            <Link href="/pricing" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4f8ef7] hover:bg-[#4f8ef7]/90 text-white text-sm font-medium rounded-lg transition-colors mb-6">
              <Star size={14} />
              Ver planes
            </Link>
            <div className="space-y-2 text-left">
              {["Stock en tiempo real por variante", "Alertas de stock bajo", "Valor total del inventario", "Historial de movimientos"].map((f) => (
                <div key={f} className="flex items-center gap-2.5">
                  <CheckCircle2 size={13} className="text-[#a3e635] shrink-0" />
                  <span className="text-xs text-white/60">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InventarioPageContent() {
  const searchParams = useSearchParams()
  const isPreview = searchParams.get("preview") === "true"
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange)
  const [currency, setCurrency] = useState<"ARS" | "USD">("USD")

  return (
    <div className="min-h-screen bg-[#080d14]">
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-[#080d14]/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">Inventario</span>
          {isPreview && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
              Modo Preview
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button
            onClick={() => setCurrency(c => c === "ARS" ? "USD" : "ARS")}
            className="flex items-center gap-1.5 text-xs text-white/60 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg px-3 py-1.5 transition-colors"
          >
            <DollarSign size={12} />
            <span>{currency}</span>
            <ChevronDown size={10} />
          </button>
        </div>
      </header>

      {isPreview ? (
        <div className="px-6 py-6 max-w-[1200px]">
          <InventoryTable />
        </div>
      ) : (
        <PaywallOverlay />
      )}
    </div>
  )
}

export default function InventarioPage() {
  return (
    <Suspense fallback={null}>
      <InventarioPageContent />
    </Suspense>
  )
}
