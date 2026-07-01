"use client"

import { useState } from "react"
import { ChevronDown, DollarSign, Settings2 } from "lucide-react"
import Link from "next/link"
import { CampaignsTable } from "@/components/pixel/CampaignsTable"
import { mockMetaCampaigns, mockMetaSummary } from "@/lib/mock-data"
import { DateRangePicker, defaultDateRange } from "@/components/DateRangePicker"
import type { DateRange } from "@/components/DateRangePicker"

const SectionIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.6" />
    <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.4" />
    <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.2" />
  </svg>
)

interface MetricChipProps {
  label: string
  value: string
  change: number
}

function MetricChip({ label, value, change }: MetricChipProps) {
  const positive = change >= 0
  return (
    <div className="flex-1 min-w-[120px] bg-white border border-black/[0.08] rounded-xl px-4 py-3">
      <p className="text-[11px] text-[#6b7280] mb-1">{label}</p>
      <p className="text-lg font-semibold text-[#0f0f12] tabular-nums">{value}</p>
      <span
        className={`inline-block mt-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${
          positive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
        }`}
      >
        {positive ? "+" : ""}
        {change.toFixed(1)}%
      </span>
    </div>
  )
}

export default function MetaPixelPage() {
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange)
  const [currency, setCurrency] = useState<"ARS" | "USD">("USD")
  const summary = mockMetaSummary
  const fmtARS = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n * 1247.5)

  const totalImpressions = mockMetaCampaigns.reduce((a, c) => a + (c.impressions ?? 0), 0)
  const totalClicks = mockMetaCampaigns.reduce((a, c) => a + (c.clicks ?? 0), 0)
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

  return (
    <div className="min-h-dvh overflow-x-hidden bg-white">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-black/[0.08] bg-white/90 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-medium text-[#0f0f12]">Pixel</h1>
          {/* Platform tabs */}
          <div className="flex items-center gap-1 bg-black/[0.04] rounded-lg p-0.5">
            <Link
              href="/pixel/meta"
              className="px-3 py-1 rounded-md text-xs font-medium bg-[#f3e8ff] text-[#0f0f12] transition-colors"
            >
              Meta
            </Link>
            <Link
              href="/pixel/google"
              className="px-3 py-1 rounded-md text-xs font-medium text-[#6b7280] hover:text-[#0f0f12] transition-colors"
            >
              Google Ads
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button
            onClick={() => setCurrency(c => c === "ARS" ? "USD" : "ARS")}
            className="flex items-center gap-1.5 text-xs text-[#374151] bg-black/[0.04] hover:bg-black/[0.06] border border-black/[0.08] rounded-lg px-3 py-1.5 transition-colors"
          >
            <DollarSign size={12} />
            <span>{currency}</span>
            <ChevronDown size={10} />
          </button>
        </div>
      </header>

      <div className="px-4 lg:px-6 py-4 lg:py-6 space-y-6 max-w-[1400px]">
        {/* Metrics panel */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[#6b7280]">
              <SectionIcon />
              <h2 className="text-sm font-medium">Métricas de Campaña</h2>
            </div>
            <button className="p-1.5 rounded hover:bg-black/[0.05] text-[#9ca3af] hover:text-[#374151] transition-colors" title="Configurar métricas">
              <Settings2 size={13} />
            </button>
          </div>
          <div className="flex gap-3 flex-wrap">
            <MetricChip
              label="Inversión"
              value={`ARS ${(summary.spend * 1247.5 / 1000).toFixed(0)}K`}
              change={summary.spendChange}
            />
            <MetricChip
              label="ROAS"
              value={summary.roas.toFixed(2) + "x"}
              change={summary.roasChange}
            />
            <MetricChip
              label="CPA"
              value={`ARS ${(summary.cpa * 1247.5).toFixed(0)}`}
              change={summary.cpaChange}
            />
            <MetricChip
              label="Impresiones"
              value={totalImpressions.toLocaleString("es-AR")}
              change={8.4}
            />
            <MetricChip
              label="Clics"
              value={totalClicks.toLocaleString("es-AR")}
              change={3.2}
            />
            <MetricChip
              label="CTR"
              value={avgCtr.toFixed(2) + "%"}
              change={-1.1}
            />
          </div>
        </section>

        {/* Campaigns table */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[#6b7280]">
              <SectionIcon />
              <h2 className="text-sm font-medium">Campañas</h2>
            </div>
            <span className="text-xs text-[#9ca3af]">{mockMetaCampaigns.length} campañas · Haz clic para expandir</span>
          </div>
          <CampaignsTable campaigns={mockMetaCampaigns} />
        </section>
      </div>
    </div>
  )
}
