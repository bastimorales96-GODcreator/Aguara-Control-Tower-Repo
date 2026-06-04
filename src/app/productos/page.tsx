"use client"

import { useState } from "react"
import { ChevronDown, DollarSign, Lock, Star, CheckCircle2, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { DateRangePicker, defaultDateRange } from "@/components/DateRangePicker"
import type { DateRange } from "@/components/DateRangePicker"

const mockProducts = [
  { sku: "REM-OVR-BLA", name: "Remera Oversized Blanca", units: 243, price: 12900, cost: 5800, revenue: 3134700, netRevenue: 1458230, margin: 46.5, cpa: 38.20 },
  { sku: "PAN-CGO-VRD", name: "Pantalón Cargo Verde", units: 87, price: 22500, cost: 10200, revenue: 1957500, netRevenue: 934820, margin: 47.8, cpa: 42.10 },
  { sku: "BUZ-CNG-NGR", name: "Buzo Canguro Negro", units: 156, price: 16900, cost: 7600, revenue: 2636400, netRevenue: 1248300, margin: 47.3, cpa: 35.80 },
  { sku: "GOR-BRD-LOG", name: "Gorra Bordada Logo", units: 412, price: 5900, cost: 2100, revenue: 2430800, netRevenue: 1245600, margin: 51.2, cpa: 28.50 },
  { sku: "SHO-DEP-AZL", name: "Short Deportivo Azul", units: 198, price: 9900, cost: 4400, revenue: 1960200, netRevenue: 952800, margin: 48.6, cpa: 32.40 },
  { sku: "CAM-ROM-GRS", name: "Campera Rompevientos", units: 61, price: 34900, cost: 16500, revenue: 2128900, netRevenue: 987300, margin: 46.4, cpa: 55.70 },
]

function ProductsTable() {
  const [sortField, setSortField] = useState<string>("revenue")
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc")

  const sorted = [...mockProducts].sort((a, b) => {
    const av = a[sortField as keyof typeof a] as number
    const bv = b[sortField as keyof typeof b] as number
    return sortDir === "desc" ? bv - av : av - bv
  })

  function toggleSort(field: string) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortField(field); setSortDir("desc") }
  }

  const cols = [
    { label: "Producto", field: null },
    { label: "SKU", field: null },
    { label: "Unidades", field: "units" },
    { label: "Revenue", field: "revenue" },
    { label: "Revenue Neto", field: "netRevenue" },
    { label: "Margen", field: "margin" },
    { label: "CPA", field: "cpa" },
  ]

  return (
    <div className="bg-[#0f1825] border border-white/[0.07] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <h3 className="text-sm font-medium text-white">Análisis por Producto</h3>
        <span className="text-xs text-white/30">{mockProducts.length} productos</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {cols.map(({ label, field }) => (
                <th
                  key={label}
                  onClick={() => field && toggleSort(field)}
                  className={cn(
                    "px-5 py-3 text-left text-[11px] font-medium text-white/30 uppercase tracking-wider",
                    field && "cursor-pointer hover:text-white/50"
                  )}
                >
                  <span className="flex items-center gap-1">
                    {label}
                    {field && <ArrowUpDown size={9} className="opacity-40" />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {sorted.map((p) => (
              <tr key={p.sku} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3 text-white/80 font-medium text-xs">{p.name}</td>
                <td className="px-5 py-3 text-white/40 font-mono text-[11px]">{p.sku}</td>
                <td className="px-5 py-3 text-white/70 text-xs">{p.units.toLocaleString("es-AR")}</td>
                <td className="px-5 py-3 text-white/70 text-xs font-medium">
                  ${p.revenue.toLocaleString("es-AR")}
                </td>
                <td className="px-5 py-3 text-white/70 text-xs font-medium">
                  ${p.netRevenue.toLocaleString("es-AR")}
                </td>
                <td className="px-5 py-3 text-xs">
                  <span className={cn(
                    "font-semibold",
                    p.margin >= 50 ? "text-emerald-400" : p.margin >= 45 ? "text-yellow-400" : "text-red-400"
                  )}>
                    {p.margin.toFixed(1)}%
                  </span>
                </td>
                <td className="px-5 py-3 text-white/60 text-xs">${p.cpa.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PaywallOverlay() {
  return (
    <div className="px-6 py-6 max-w-[1200px]">
      <div className="relative">
        <div className="select-none pointer-events-none" style={{ filter: "blur(5px)", opacity: 0.35 }}>
          <ProductsTable />
        </div>
        {/* Fixed overlay so the card is always centered in the viewport regardless of table height */}
        <div className="fixed inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ top: 48 }}>
          <div className="bg-[#0f1825] border border-white/[0.10] rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl pointer-events-auto">
            <div className="w-12 h-12 rounded-xl bg-[#4f8ef7]/10 border border-[#4f8ef7]/20 flex items-center justify-center mx-auto mb-4">
              <Lock size={20} className="text-[#4f8ef7]" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Análisis de Productos</h2>
            <p className="text-sm text-white/50 mb-6 leading-relaxed">
              Esta función está disponible en el plan Avanzado. Desbloqueá el análisis completo por producto.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4f8ef7] hover:bg-[#4f8ef7]/90 text-white text-sm font-medium rounded-lg transition-colors mb-6"
            >
              <Star size={14} />
              Ver planes
            </Link>
            <div className="space-y-2 text-left">
              {["Revenue y margen por producto", "Top productos por ganancia neta", "Análisis de CPA por SKU", "Exportación a CSV"].map((f) => (
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

export default function ProductosPage() {
  const searchParams = useSearchParams()
  const isPreview = searchParams.get("preview") === "true"
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange)
  const [currency, setCurrency] = useState<"ARS" | "USD">("USD")

  return (
    <div className="min-h-screen bg-[#080d14]">
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-[#080d14]/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">Productos</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/20">
            Novedad
          </span>
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
          <ProductsTable />
        </div>
      ) : (
        <PaywallOverlay />
      )}
    </div>
  )
}
