"use client"

import React, { useState } from "react"
import { ChevronRight } from "lucide-react"
import type { Campaign } from "@/types"
import { cn } from "@/lib/utils"

function fmt(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)
}

function fmtSmall(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(n)
}

function pct(n: number) {
  return n.toFixed(2) + "%"
}

function StatusDot({ status }: { status: "active" | "paused" }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={cn(
          "inline-block w-1.5 h-1.5 rounded-full",
          status === "active" ? "bg-emerald-400" : "bg-yellow-400"
        )}
      />
      <span className={cn("text-xs", status === "active" ? "text-emerald-400" : "text-yellow-400")}>
        {status === "active" ? "Activo" : "Pausado"}
      </span>
    </span>
  )
}

const COL_HEADER = "px-3 py-2.5 text-left text-[11px] font-medium text-[#6b7280] uppercase tracking-wider whitespace-nowrap"
const CELL = "px-3 py-2.5 text-[13px] text-[#374151] whitespace-nowrap tabular-nums"

export function CampaignsTable({ campaigns }: { campaigns: Campaign[] }) {
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set())
  const [expandedAdsets, setExpandedAdsets] = useState<Set<string>>(new Set())

  const toggleCampaign = (id: string) => {
    setExpandedCampaigns((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAdset = (id: string) => {
    setExpandedAdsets((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-black/[0.08] bg-white">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b border-black/[0.08]">
            <th className={cn(COL_HEADER, "w-full")}>Nombre</th>
            <th className={COL_HEADER}>Estado</th>
            <th className={COL_HEADER}>Presupuesto</th>
            <th className={COL_HEADER}>Inversión</th>
            <th className={COL_HEADER}>Revenue</th>
            <th className={COL_HEADER}>ROAS</th>
            <th className={COL_HEADER}>CPA</th>
            <th className={COL_HEADER}>Clics</th>
            <th className={COL_HEADER}>CTR</th>
            <th className={cn(COL_HEADER, "w-8")}></th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => {
            const campExpanded = expandedCampaigns.has(campaign.id)
            return (
              <React.Fragment key={campaign.id}>
                {/* Campaign row */}
                <tr
                  onClick={() => toggleCampaign(campaign.id)}
                  className="border-b border-black/[0.06] hover:bg-black/[0.04] cursor-pointer transition-colors"
                >
                  <td className={cn(CELL, "font-medium text-[#0f0f12]")}>
                    <span className="truncate block max-w-[280px]">{campaign.name}</span>
                  </td>
                  <td className={CELL}>
                    <StatusDot status={campaign.status} />
                  </td>
                  <td className={CELL}>
                    {campaign.budget ? (
                      <span className="text-[#6b7280]">
                        {fmt(campaign.budget)}/{campaign.budgetType === "daily" ? "día" : "total"}
                      </span>
                    ) : (
                      <span className="text-[#9ca3af]">—</span>
                    )}
                  </td>
                  <td className={CELL}>{fmt(campaign.spend)}</td>
                  <td className={CELL}>{fmt(campaign.revenue)}</td>
                  <td className={cn(CELL, "text-[#7c3aed]")}>{campaign.roas?.toFixed(2) ?? "—"}</td>
                  <td className={CELL}>{campaign.cpa ? fmtSmall(campaign.cpa) : "—"}</td>
                  <td className={CELL}>{campaign.clicks?.toLocaleString("es-AR") ?? "—"}</td>
                  <td className={CELL}>{campaign.ctr ? pct(campaign.ctr) : "—"}</td>
                  <td className={CELL}>
                    <ChevronRight
                      size={14}
                      className={cn(
                        "text-[#9ca3af] transition-transform duration-200",
                        campExpanded && "rotate-90"
                      )}
                    />
                  </td>
                </tr>

                {/* AdSet rows */}
                {campExpanded &&
                  campaign.adSets?.map((adset) => {
                    const adsetExpanded = expandedAdsets.has(adset.id)
                    const hasAds = adset.ads && adset.ads.length > 0
                    return (
                      <React.Fragment key={adset.id}>
                        <tr
                          onClick={() => hasAds && toggleAdset(adset.id)}
                          className={cn(
                            "border-b border-black/[0.04] bg-[#faf8ff] hover:bg-black/[0.04] transition-colors",
                            hasAds && "cursor-pointer"
                          )}
                        >
                          <td className={cn(CELL, "pl-8")}>
                            <span className="truncate block max-w-[240px] text-[#374151]">{adset.name}</span>
                          </td>
                          <td className={CELL}>
                            <StatusDot status={adset.status} />
                          </td>
                          <td className={cn(CELL, "text-[#9ca3af]")}>—</td>
                          <td className={CELL}>{fmt(adset.spend)}</td>
                          <td className={CELL}>{fmt(adset.revenue)}</td>
                          <td className={cn(CELL, "text-[#7c3aed]/80")}>{adset.roas?.toFixed(2) ?? "—"}</td>
                          <td className={CELL}>{adset.cpa ? fmtSmall(adset.cpa) : "—"}</td>
                          <td className={CELL}>{adset.clicks?.toLocaleString("es-AR") ?? "—"}</td>
                          <td className={CELL}>{adset.ctr ? pct(adset.ctr) : "—"}</td>
                          <td className={CELL}>
                            {hasAds && (
                              <ChevronRight
                                size={13}
                                className={cn(
                                  "text-[#9ca3af] transition-transform duration-200",
                                  adsetExpanded && "rotate-90"
                                )}
                              />
                            )}
                          </td>
                        </tr>

                        {/* Ad rows */}
                        {adsetExpanded &&
                          adset.ads?.map((ad) => (
                            <tr
                              key={ad.id}
                              className="border-b border-black/[0.04] bg-[#faf8ff] hover:bg-black/[0.04] transition-colors"
                            >
                              <td className={cn(CELL, "pl-16")}>
                                <span className="truncate block max-w-[200px] text-[#6b7280]">{ad.name}</span>
                              </td>
                              <td className={CELL}>
                                <StatusDot status={ad.status} />
                              </td>
                              <td className={cn(CELL, "text-[#9ca3af]")}>—</td>
                              <td className={CELL}>{fmt(ad.spend)}</td>
                              <td className={CELL}>{fmt(ad.revenue)}</td>
                              <td className={cn(CELL, "text-[#6b7280]")}>
                                {ad.spend > 0 ? (ad.revenue / ad.spend).toFixed(2) : "—"}
                              </td>
                              <td className={cn(CELL, "text-[#6b7280]")}>—</td>
                              <td className={CELL}>{ad.clicks.toLocaleString("es-AR")}</td>
                              <td className={CELL}>{pct(ad.ctr)}</td>
                              <td className={CELL}></td>
                            </tr>
                          ))}
                      </React.Fragment>
                    )
                  })}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
