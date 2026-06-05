/**
 * AguaraLogo — the official "A" wordmark icon
 *
 * The icon is a stylised letter A split vertically:
 *   - Left leg  : blue gradient (#1D4ED8 → #3B82F6)
 *   - Right leg : white (dark bg) / navy (light bg)
 *   - Centre dot: accent lime (#a3e635)
 *
 * Usage:
 *   <AguaraLogo size={32} />                       — default (dark bg)
 *   <AguaraLogo size={32} variant="light" />       — on light bg
 */

import React from "react"

interface AguaraLogoProps {
  /** Icon height & width in px */
  size?: number
  /** "dark"  = right leg white  (default — on dark backgrounds)
   *  "light" = right leg navy   (on light backgrounds) */
  variant?: "dark" | "light"
  className?: string
}

export function AguaraLogo({ size = 32, variant = "dark", className }: AguaraLogoProps) {
  const id = `aguara-grad-${size}-${variant}`
  const rightColor = variant === "light" ? "#0F172A" : "#FFFFFF"

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 38 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Aguara"
    >
      <defs>
        <linearGradient id={id} x1="9.5" y1="44" x2="19" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>

      {/* Left leg — blue gradient */}
      <path
        d="M19 2 C14 2 9.5 5.5 7.5 10.5 L0.5 43 L10 43 L19 18 L19 8 C19 8 19 2 19 2 Z"
        fill={`url(#${id})`}
      />

      {/* Right leg — white / navy */}
      <path
        d="M19 2 C24 2 28.5 5.5 30.5 10.5 L37.5 43 L28 43 L19 18 L19 8 C19 8 19 2 19 2 Z"
        fill={rightColor}
        opacity={variant === "dark" ? 0.92 : 1}
      />

      {/* Centre dot — lime accent */}
      <circle cx="19" cy="33" r="4" fill="#a3e635" />
    </svg>
  )
}

/**
 * AguaraWordmark — icon + "Aguara" text + subtitle
 * Matches the exact layout used in login / signup pages.
 */
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
        <div
          className="font-bold leading-none"
          style={{ color: textColor, fontSize: Math.round(size * 0.39) }}
        >
          Aguara
        </div>
        <div
          className="uppercase tracking-widest leading-none mt-0.5"
          style={{
            color: subtitleColor,
            fontSize: Math.round(size * 0.25),
            letterSpacing: "0.12em",
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  )
}
