"use client"

import { ChevronDown, DollarSign, Plus, Pencil } from "lucide-react"
import { useState } from "react"
import { DateRangePicker, defaultDateRange } from "@/components/DateRangePicker"
import type { DateRange } from "@/components/DateRangePicker"
import { Toggle } from "@/components/Toggle"

const SectionIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.6" />
    <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.4" />
    <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.2" />
  </svg>
)

const shippingZones = [
  { zone: "Buenos Aires GBA", provider: "OCA", avgCost: 850 },
  { zone: "Interior del País", provider: "Andreani", avgCost: 1200 },
  { zone: "CABA", provider: "Correo Argentino", avgCost: 650 },
  { zone: "Patagonia", provider: "Vía Cargo", avgCost: 1800 },
]

export default function EnviosPage() {
  const [includeShipping, setIncludeShipping] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange)
  const [currency, setCurrency] = useState<"ARS" | "USD">("USD")

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#080d14]">
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#080d14]/90 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-white/40 text-sm">
          <span>Configuración</span>
          <span>/</span>
          <span className="text-white">Envíos</span>
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

      <div className="px-4 lg:px-6 py-4 lg:py-6 max-w-[800px] space-y-6">
        {/* Toggle */}
        <div className="bg-[#0f1825] border border-white/[0.07] rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white">Incluir costos de envío</h3>
              <p className="text-xs text-white/40 mt-0.5">Los costos de envío se descontarán de la ganancia neta de cada orden</p>
            </div>
            <Toggle checked={includeShipping} onChange={setIncludeShipping} label="Incluir costos de envío" />
          </div>
        </div>

        {/* Zones table */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-white/50">
              <SectionIcon />
              <h2 className="text-sm font-medium">Zonas de Envío</h2>
            </div>
            <button className="flex items-center gap-2 text-xs text-white font-medium bg-[#4f8ef7] hover:bg-[#4f8ef7]/90 rounded-lg px-3 py-1.5 transition-colors">
              <Plus size={12} />
              Agregar zona
            </button>
          </div>
          <div className="bg-[#0f1825] border border-white/[0.07] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium text-white/40 uppercase tracking-wider">Zona</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium text-white/40 uppercase tracking-wider">Proveedor</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-medium text-white/40 uppercase tracking-wider">Costo Promedio</th>
                  <th className="px-4 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {shippingZones.map((row, i) => (
                  <tr key={row.zone} className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i === shippingZones.length - 1 ? "border-b-0" : ""}`}>
                    <td className="px-4 py-3 text-sm text-white/90">{row.zone}</td>
                    <td className="px-4 py-3 text-sm text-white/60">{row.provider}</td>
                    <td className="px-4 py-3 text-sm text-white/70 text-right tabular-nums">
                      ARS ${row.avgCost.toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 rounded hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors">
                        <Pencil size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
