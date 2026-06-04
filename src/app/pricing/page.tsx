"use client"

import { useState, useRef } from "react"
import { CheckCircle2, Zap, Loader2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Stripe price IDs — fill these after creating prices in Stripe dashboard.
// Keys: plan → step index (1-8; step 0 = free, step 9 = custom)
// Example: STRIPE_PRICE_IDS.growth[2] = "price_1Xxx..."
const STRIPE_PRICE_IDS: Record<string, Record<number, string>> = {
  starter: {},
  growth:  {},
  pro:     {},
}

// ─── Slider steps (mismo que Escalafy) ──────────────────────────────────────
const STEPS = [
  { label: "50",    orders: 50 },
  { label: "300",   orders: 300 },
  { label: "900",   orders: 900 },
  { label: "2.5k",  orders: 2500 },
  { label: "5k",    orders: 5000 },
  { label: "10k",   orders: 10000 },
  { label: "25k",   orders: 25000 },
  { label: "50k",   orders: 50000 },
  { label: "100k",  orders: 100000 },
  { label: "+100k", orders: 999999 },
]

// ─── Price tables — Escalafy prices × 0.95 por escalón ──────────────────────
// Escalafy: Base  = [free,19,49,99,149,199,299,399,549,custom]
// Escalafy: Adv   = [free,30,75,150,225,300,450,600,825,custom]
// Aguara:   Starter = Base × 0.95 | Growth = Adv × 0.95 | Pro = Adv × 1.5 × 0.95
const PRICE_TABLE: Record<string, (number | null)[]> = {
  starter: [0,   18,  47,  94,  142, 189, 284, 379, 522,  null],
  growth:  [0,   29,  71,  143, 214, 285, 428, 570, 784,  null],
  pro:     [0,   43,  107, 214, 321, 428, 641, 855, 1176, null],
}

// ─── Plans ───────────────────────────────────────────────────────────────────
const PLAN_FEATURES = {
  starter: [
    "Dashboard de rendimiento",
    "Cálculo de costos y rentabilidad",
    "Integración Shopify / Tiendanube",
    "Pixel Meta Ads completo",
    "Google Ads integrado",
    "Maestro de productos",
  ],
  growth: [
    "Todo del plan Starter",
    "Control de Inventario",
    "Múltiples integraciones",
    "Cotización dólar automática",
    "Reporte Contable / Financiero",
    "Exportación CSV",
  ],
  pro: [
    "Todo del plan Growth",
    "True ROAS avanzado",
    "API access",
    "Soporte prioritario",
    "Success Manager dedicado",
    "Acceso anticipado a features",
  ],
}

// ─── Custom Slider ────────────────────────────────────────────────────────────
function PricingSlider({ value, onChange }: { value: number; onChange: (i: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null)

  function getIndexFromClick(e: React.MouseEvent) {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const idx = Math.round(pct * (STEPS.length - 1))
    onChange(idx)
  }

  const fillPct = (value / (STEPS.length - 1)) * 100

  return (
    <div className="px-2 pb-6">
      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-1.5 rounded-full bg-white/[0.08] cursor-pointer mb-4"
        onClick={getIndexFromClick}
      >
        {/* Fill */}
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-[#4f8ef7] transition-all duration-150"
          style={{ width: `${fillPct}%` }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-lg border-2 border-[#4f8ef7] transition-all duration-150 cursor-grab active:cursor-grabbing"
          style={{ left: `${fillPct}%` }}
        />
        {/* Step dots */}
        {STEPS.map((_, i) => (
          <button
            key={i}
            onClick={e => { e.stopPropagation(); onChange(i) }}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            style={{ left: `${(i / (STEPS.length - 1)) * 100}%` }}
          >
            <span className={cn(
              "block w-2 h-2 rounded-full transition-all duration-150",
              i <= value ? "bg-[#4f8ef7]" : "bg-white/[0.15]"
            )} />
          </button>
        ))}
      </div>

      {/* Labels */}
      <div className="flex justify-between">
        {STEPS.map((s, i) => (
          <button
            key={s.label}
            onClick={() => onChange(i)}
            className={cn(
              "text-[10px] font-medium transition-colors",
              i === value ? "text-[#4f8ef7] font-semibold" : "text-white/25 hover:text-white/50"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({
  name, planKey, step, price, highlight, tag, features, ordersLabel, isCustom, isFree,
}: {
  name: string
  planKey: string
  step: number
  price: number | null
  highlight: boolean
  tag?: string
  features: string[]
  ordersLabel: string
  isCustom?: boolean
  isFree?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const displayPrice = isFree ? "Gratis" : isCustom ? "Personalizado" : price !== null ? `$${price}` : "Gratis"

  async function handleSubscribe() {
    if (isCustom) {
      window.location.href = "mailto:hola@aguara.io?subject=Plan Pro personalizado"
      return
    }
    if (isFree) {
      window.location.href = "/signup"
      return
    }
    setLoading(true)
    const priceId = STRIPE_PRICE_IDS[planKey]?.[step] ?? null
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId, plan: planKey, step }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(false)
  }

  const buttonLabel = isCustom ? "Contactar ventas" : isFree ? "Empezar gratis" : "Suscribirse"

  return (
    <div className={cn(
      "relative bg-[#0f1825] rounded-2xl p-6 flex flex-col overflow-hidden transition-all duration-200",
      highlight
        ? "border border-[#4f8ef7]/40 ring-1 ring-[#4f8ef7]/15 shadow-lg shadow-[#4f8ef7]/5"
        : "border border-white/[0.07]"
    )}>
      {highlight && (
        <>
          <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#4f8ef7]/60 to-transparent" />
          {tag && (
            <div className="absolute top-4 right-4">
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/20">
                <Zap size={9} /> {tag}
              </span>
            </div>
          )}
        </>
      )}

      {/* Plan name */}
      <p className={cn(
        "text-xs font-semibold uppercase tracking-widest mb-4",
        highlight ? "text-[#4f8ef7]" : "text-white/40"
      )}>
        {name}
      </p>

      {/* Price */}
      <div className="mb-1">
        <div className="flex items-end gap-1">
          <span className={cn(
            "font-bold text-white tabular-nums",
            isCustom || isFree ? "text-2xl" : "text-4xl"
          )}>
            {displayPrice}
          </span>
          {!isCustom && !isFree && (
            <span className="text-sm text-white/40 mb-1.5">/mes</span>
          )}
        </div>
        <p className="text-xs text-white/30">{ordersLabel}</p>
      </div>

      {/* Features */}
      <div className="space-y-2 flex-1 my-5">
        {features.map((f, i) => (
          <div key={f} className="flex items-start gap-2.5">
            <CheckCircle2 size={13} className={cn(
              "shrink-0 mt-0.5",
              highlight ? "text-[#a3e635]" : "text-white/30"
            )} />
            <span className={cn("text-sm", i === 0 && name !== "Starter" ? "text-white/40" : "text-white/65")}>{f}</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubscribe}
        disabled={loading}
        className={cn(
          "w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2",
          highlight
            ? "bg-[#4f8ef7] hover:bg-[#4f8ef7]/90 text-white disabled:opacity-60"
            : "bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/60 disabled:opacity-60"
        )}
      >
        {loading && <Loader2 size={13} className="animate-spin" />}
        {buttonLabel}
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const [step, setStep] = useState(1) // default: 300 órdenes

  function handleStep(i: number) {
    setStep(i)
  }

  const current = STEPS[step]
  const isFree   = step === 0
  const isCustom = step === 9
  const ordersLabel = `Hasta ${current.label} órdenes/mes`

  const prices = { starter: PRICE_TABLE.starter[step], growth: PRICE_TABLE.growth[step], pro: PRICE_TABLE.pro[step] }

  // Suggested plan label
  const suggestedPlan = step === 0 ? "Free" : step <= 2 ? "Starter" : step <= 5 ? "Growth" : step === 9 ? "Personalizado" : "Pro"
  const suggestedPrice = step === 0 ? "Gratis" : step === 9 ? "Personalizado" : step <= 2 ? `$${prices.starter}` : step <= 5 ? `$${prices.growth}` : `$${prices.pro}`

  return (
    <div className="min-h-screen bg-[#080d14]">
      <header className="sticky top-0 z-40 flex items-center px-6 py-3 border-b border-white/[0.06] bg-[#080d14]/90 backdrop-blur-sm">
        <h1 className="text-sm font-medium text-white">Suscripción</h1>
      </header>

      <div className="px-6 py-10 max-w-[1100px] mx-auto space-y-8">

        {/* Heading */}
        <h1 className="text-3xl font-bold text-white text-center leading-tight">
          Elegí el plan que mejor se adapte<br />a tus necesidades
        </h1>

        {/* Slider card */}
        <div className="bg-[#0f1825] border border-white/[0.07] rounded-xl px-6 pt-6 pb-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-white/40 mb-0.5">Órdenes por mes</p>
              <p className="text-2xl font-bold text-white">{current.label}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/40 mb-0.5">Plan sugerido</p>
              <p className="text-sm font-semibold text-[#4f8ef7]">
                {suggestedPlan}{step !== 9 && step !== 0 ? ` · ${suggestedPrice}/mes` : ""}
              </p>
            </div>
          </div>
          <PricingSlider value={step} onChange={handleStep} />
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-3 gap-4">
          <PlanCard
            name="Starter" planKey="starter" step={step}
            price={prices.starter}
            highlight={false}
            ordersLabel={ordersLabel}
            features={PLAN_FEATURES.starter}
            isFree={isFree}
            isCustom={isCustom}
          />
          <PlanCard
            name="Growth" planKey="growth" step={step}
            price={prices.growth}
            highlight={true}
            tag="Popular"
            ordersLabel={ordersLabel}
            features={PLAN_FEATURES.growth}
            isFree={isFree}
            isCustom={isCustom}
          />
          <PlanCard
            name="Pro" planKey="pro" step={step}
            price={prices.pro}
            highlight={false}
            ordersLabel={ordersLabel}
            features={PLAN_FEATURES.pro}
            isFree={isFree}
            isCustom={isCustom}
          />
        </div>

        {/* Free plan note */}
        <div className="bg-[#0f1825] border border-white/[0.07] rounded-xl px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">¿Recién empezás?</p>
            <p className="text-xs text-white/40 mt-0.5">Aguara tiene un plan gratuito para hasta 50 órdenes/mes, sin tarjeta de crédito.</p>
          </div>
          <span className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/40">
            Plan actual — Gratis
          </span>
        </div>

        {/* Preview banner */}
        <div className="bg-[#0f1825] border border-[#a3e635]/20 rounded-xl p-5 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-white mb-0.5">¿Querés ver cómo se ven las funciones del plan Avanzado?</p>
            <p className="text-xs text-white/40">Explorá Productos e Inventario con datos de ejemplo.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href="/productos?preview=true" className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/60 hover:text-white/90 hover:bg-white/[0.10] transition-colors">
              Ver Productos
            </Link>
            <Link href="/inventario?preview=true" className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/60 hover:text-white/90 hover:bg-white/[0.10] transition-colors">
              Ver Inventario
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-white/25">
          ¿Preguntas? Escribinos a{" "}
          <a href="mailto:hola@aguara.io" className="text-[#4f8ef7] hover:underline">hola@aguara.io</a>
        </p>
      </div>
    </div>
  )
}
