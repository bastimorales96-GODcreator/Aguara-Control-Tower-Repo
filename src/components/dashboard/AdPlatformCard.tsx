"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area } from "recharts"
import { cn, formatCurrency } from "@/lib/utils"

interface AdMetric {
  label: string
  value: number
  change?: number
  format?: "currency" | "ratio" | "number" | "percent"
}

interface AdPlatformCardProps {
  platform: "meta" | "google"
  metrics: AdMetric[]
  cvr?: number
  cvrChange?: number
  sparkData?: number[]
}

const MetaIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400">
    <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
  </svg>
)

const GoogleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-yellow-400">
    <path d="M12 11H22V13H12V11Z" fill="#4285F4"/>
    <path d="M17 6L22 11L17 16" stroke="#4285F4" strokeWidth="2" fill="none"/>
    <path d="M7 18C4.24 18 2 15.76 2 13C2 10.24 4.24 8 7 8C8.28 8 9.45 8.49 10.34 9.28L8.93 10.69C8.41 10.22 7.73 9.93 7 9.93C5.3 9.93 3.93 11.3 3.93 13C3.93 14.7 5.3 16.07 7 16.07C8.44 16.07 9.65 15.13 10.02 13.83H7V11.9H12.04C12.1 12.25 12.13 12.62 12.13 13C12.13 15.76 9.89 18 7 18Z" fill="#4285F4"/>
  </svg>
)

function formatMetricValue(value: number, format: AdMetric["format"] = "currency"): string {
  if (format === "currency") return formatCurrency(value)
  if (format === "ratio") return value.toFixed(2)
  if (format === "percent") return `${value.toFixed(2)}%`
  return value.toString()
}

export function AdPlatformCard({ platform, metrics, cvr, cvrChange, sparkData }: AdPlatformCardProps) {
  const defaultSparkData = Array(15).fill(0).map(() => Math.random() * 10)
  const data = (sparkData || defaultSparkData).map((v, i) => ({ v, i }))
  const color = platform === "meta" ? "#60a5fa" : "#facc15"
  const isEmpty = metrics.every(m => m.value === 0)

  return (
    <div className="bg-white border border-black/[0.08] rounded-xl p-4 hover:border-black/[0.10] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {platform === "meta" ? <MetaIcon /> : <GoogleIcon />}
          <span className="text-[11px] font-medium text-[#6b7280] uppercase tracking-wider">
            {platform === "meta" ? "Meta" : "Google Ads"}
          </span>
        </div>
        {/* CVR badge */}
        {cvr !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#9ca3af]">CVR</span>
            <span className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full border",
              isEmpty
                ? "bg-black/[0.04] border-black/[0.08] text-[#9ca3af]"
                : "bg-[#7c3aed]/10 border-[#7c3aed]/20 text-[#7c3aed]"
            )}>
              {isEmpty ? "—" : `${cvr.toFixed(2)}%`}
            </span>
            {cvrChange !== undefined && !isEmpty && (
              <span className={cn(
                "text-[10px] font-medium",
                cvrChange >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {cvrChange >= 0 ? "+" : ""}{cvrChange.toFixed(1)}%
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-3">
        {metrics.map((metric) => {
          const isPositive = (metric.change ?? 0) > 0
          const label = metric.label.toLowerCase()
          // For spend and cpa, up is bad; for roas, up is good
          const isBad = label.includes("inversión") || label.includes("cpa")
          const isGood = isBad ? !isPositive : isPositive

          return (
            <div key={metric.label}>
              <p className="text-[10px] text-[#9ca3af] mb-0.5">{metric.label}</p>
              <p className={cn("text-lg font-semibold", isEmpty ? "text-[#9ca3af]" : "text-[#0f0f12]")}>
                {formatMetricValue(metric.value, metric.format)}
              </p>
              {metric.change !== undefined && !isEmpty && (
                <div className={cn("flex items-center gap-0.5 text-[10px] font-medium", isGood ? "text-emerald-400" : "text-red-400")}>
                  {isPositive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                  <span>{metric.change > 0 ? "+" : ""}{metric.change.toFixed(2)}%</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mini chart */}
      <div className="h-8 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`ad-grad-${platform}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#ad-grad-${platform})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
