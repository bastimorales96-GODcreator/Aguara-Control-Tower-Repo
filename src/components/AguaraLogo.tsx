/**
 * AguaraLogo — brand icon
 *
 * Stylised "A" split vertically:
 *   Left leg  → blue gradient
 *   Right leg → white (on dark) / navy (on light)
 *   Lime dot  → crossbar accent
 *
 * Usage:
 *   <AguaraLogo size={32} />
 *   <AguaraLogo size={32} variant="light" />
 */

import React from "react"

interface AguaraLogoProps {
  size?: number
  variant?: "dark" | "light"
  className?: string
}

export function AguaraLogo({ size = 32, variant = "dark", className }: AguaraLogoProps) {
  const gid = `ag-${variant}`
  const rightColor = variant === "light" ? "#0F172A" : "#FFFFFF"

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Aguara"
    >
      <defs>
        <linearGradient id={gid} x1="7" y1="28" x2="16" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E40AF" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
      </defs>

      {/* Rounded background */}
      <rect width="32" height="32" rx="7" fill="#1D4ED8" fillOpacity="0.12" />

      {/* Left leg — blue gradient */}
      <path d="M16 5 L5 27 L10.5 27 L16 14.5 Z" fill={`url(#${gid})`} />

      {/* Right leg — white / navy */}
      <path d="M16 5 L27 27 L21.5 27 L16 14.5 Z" fill={rightColor} opacity={variant === "dark" ? 0.9 : 1} />

      {/* Lime dot — crossbar accent */}
      <circle cx="16" cy="22" r="2.5" fill="#a3e635" />
    </svg>
  )
}

interface AguaraWordmarkProps {
  size?: number
  variant?: "dark" | "light"
  subtitle?: string
}

export function AguaraWordmark({
  size = 36,
  variant = "dark",
  subtitle = "Business Control Tower",
}: AguaraWordmarkProps) {
  const textColor = variant === "light" ? "#0F172A" : "#FFFFFF"
  const subtitleColor = variant === "light" ? "rgba(15,23,42,0.4)" : "rgba(255,255,255,0.4)"

  return (
    <div className="flex items-center gap-3">
      <AguaraLogo size={size} variant={variant} />
      <div>
        <div className="font-bold leading-none" style={{ color: textColor, fontSize: Math.round(size * 0.39) }}>
          Aguara
        </div>
        <div
          className="uppercase tracking-widest leading-none mt-0.5"
          style={{ color: subtitleColor, fontSize: Math.round(size * 0.25), letterSpacing: "0.12em" }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  )
}
