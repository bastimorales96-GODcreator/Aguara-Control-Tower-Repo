"use client"

import { useState, useRef, useEffect } from "react"
import { CheckCircle2, Zap, Loader2, LayoutDashboard, Package, Archive, TrendingUp, Settings, Play, Pause, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const STRIPE_PRICE_IDS: Record<string, Record<number, string>> = {
  starter: {},
  growth:  {},
  pro:     {},
}

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

const PRICE_TABLE: Record<string, (number | null)[]> = {
  starter: [0,   18,  47,  94,  142, 189, 284, 379, 522,  null],
  growth:  [0,   29,  71,  143, 214, 285, 428, 570, 784,  null],
  pro:     [0,   43,  107, 214, 321, 428, 641, 855, 1176, null],
}

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

// ─── Platform Demo Screens ────────────────────────────────────────────────────

function DashboardScreen() {
  return (
    <div className="p-3 space-y-2 h-full overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#0f0f12]">Dashboard</span>
        <span className="text-[9px] text-[#9ca3af] bg-[#faf8ff] border border-black/[0.06] px-2 py-0.5 rounded-md">Jun 2025</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: "Facturación", value: "$3.2M",  change: "↑ 18%",   color: "text-emerald-400" },
          { label: "ROAS",        value: "4.8×",   change: "↑ 0.6",   color: "text-[#7c3aed]" },
          { label: "CPA",         value: "$38",    change: "↓ 12%",   color: "text-emerald-400" },
          { label: "Margen",      value: "47.3%",  change: "↑ 2.1pp", color: "text-[#a3e635]" },
        ].map(k => (
          <div key={k.label} className="bg-[#faf8ff] border border-black/[0.06] rounded-lg p-2">
            <p className="text-[8px] text-[#6b7280] mb-0.5">{k.label}</p>
            <p className="text-[13px] font-bold text-[#0f0f12] leading-tight">{k.value}</p>
            <p className={cn("text-[8px] font-medium mt-0.5", k.color)}>{k.change}</p>
          </div>
        ))}
      </div>
      <div className="bg-[#faf8ff] border border-black/[0.06] rounded-lg p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[9px] text-[#6b7280]">Facturación — últimos 7 días</p>
          <p className="text-[9px] text-[#7c3aed] font-semibold">$3.2M</p>
        </div>
        <svg viewBox="0 0 300 52" className="w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="dg1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[16, 32].map(y => (
            <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="black" strokeOpacity="0.06" strokeWidth="1" />
          ))}
          <path d="M0,46 C20,42 40,40 60,34 C80,28 100,26 130,20 C155,15 175,12 210,16 C240,20 265,13 300,6 L300,52 L0,52 Z" fill="url(#dg1)" />
          <path d="M0,46 C20,42 40,40 60,34 C80,28 100,26 130,20 C155,15 175,12 210,16 C240,20 265,13 300,6"
            fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="300" cy="6" r="2.5" fill="#7c3aed" />
          <circle cx="300" cy="6" r="5" fill="#7c3aed" fillOpacity="0.22" />
        </svg>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: "Órdenes",     value: "1,247",  sub: "↑ 8%",  color: "text-emerald-400" },
          { label: "Ticket Prom.", value: "$2,890", sub: "↑ 3%",  color: "text-emerald-400" },
          { label: "Ganancia",    value: "$487k",  sub: "↑ 21%", color: "text-[#a3e635]" },
        ].map(c => (
          <div key={c.label} className="bg-[#faf8ff] border border-black/[0.06] rounded-lg p-2">
            <p className="text-[8px] text-[#6b7280]">{c.label}</p>
            <p className="text-[12px] font-bold text-[#0f0f12]">{c.value}</p>
            <p className={cn("text-[8px] font-medium mt-0.5", c.color)}>{c.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductosScreen() {
  const rows = [
    { name: "Remera Oversized Blanca", sku: "REM-OVR-BLA", units: 243, revenue: "$3.1M", margin: 46.5, mColor: "text-yellow-400" },
    { name: "Gorra Bordada Logo",       sku: "GOR-BRD-LOG", units: 412, revenue: "$2.4M", margin: 51.2, mColor: "text-emerald-400" },
    { name: "Buzo Canguro Negro",       sku: "BUZ-CNG-NGR", units: 156, revenue: "$2.6M", margin: 47.3, mColor: "text-yellow-400" },
    { name: "Pantalón Cargo Verde",     sku: "PAN-CGO-VRD", units: 87,  revenue: "$1.9M", margin: 47.8, mColor: "text-yellow-400" },
    { name: "Short Deportivo Azul",     sku: "SHO-DEP-AZL", units: 198, revenue: "$1.9M", margin: 48.6, mColor: "text-yellow-400" },
  ]
  return (
    <div className="p-3 space-y-2 h-full overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-[#0f0f12]">Productos</span>
          <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/20">Novedad</span>
        </div>
        <span className="text-[9px] text-[#9ca3af] bg-[#faf8ff] border border-black/[0.06] px-2 py-0.5 rounded-md">Jun 2025</span>
      </div>
      <div className="bg-[#faf8ff] border border-black/[0.06] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-black/[0.06]">
          <p className="text-[9px] font-medium text-[#374151]">Análisis por Producto</p>
          <p className="text-[8px] text-[#9ca3af]">6 productos</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/[0.06]">
              {["Producto", "SKU", "Uds.", "Revenue", "Margen"].map(h => (
                <th key={h} className="px-2.5 py-1 text-left text-[8px] font-medium text-[#9ca3af] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.sku} className="border-b border-black/[0.06] last:border-0">
                <td className="px-2.5 py-1.5 text-[9px] text-[#374151] font-medium max-w-[90px] truncate">{r.name}</td>
                <td className="px-2.5 py-1.5 text-[8px] text-[#9ca3af] font-mono">{r.sku}</td>
                <td className="px-2.5 py-1.5 text-[9px] text-[#6b7280]">{r.units}</td>
                <td className="px-2.5 py-1.5 text-[9px] text-[#374151] font-medium">{r.revenue}</td>
                <td className={cn("px-2.5 py-1.5 text-[9px] font-semibold", r.mColor)}>{r.margin}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function InventarioScreen() {
  const rows = [
    { name: "Remera Oversized",  variant: "M / Blanca",  stock: 48, level: "Alto",    lClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", rowClass: "" },
    { name: "Pantalón Cargo",    variant: "L / Verde",   stock: 12, level: "Bajo",    lClass: "bg-orange-500/15 text-orange-400 border-orange-500/20",   rowClass: "" },
    { name: "Short Deportivo",   variant: "S / Azul",    stock: 7,  level: "Crítico", lClass: "bg-red-500/15 text-red-400 border-red-500/20",           rowClass: "bg-red-500/[0.03]" },
    { name: "Buzo Canguro",      variant: "XL / Negro",  stock: 31, level: "Medio",   lClass: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",  rowClass: "" },
    { name: "Rem. Oversized",    variant: "L / Blanca",  stock: 3,  level: "Crítico", lClass: "bg-red-500/15 text-red-400 border-red-500/20",           rowClass: "bg-red-500/[0.03]" },
  ]
  return (
    <div className="p-3 space-y-2 h-full overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#0f0f12]">Inventario</span>
        <div className="flex items-center gap-1 text-[9px] text-red-400">
          <AlertTriangle size={9} />
          <span>2 críticos</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: "SKUs activos",    value: "8",    alert: false },
          { label: "Valor en stock",  value: "$1.5M", alert: false },
          { label: "Alertas críticas", value: "2",   alert: true },
        ].map(c => (
          <div key={c.label} className="bg-[#faf8ff] border border-black/[0.06] rounded-lg p-2">
            <p className="text-[8px] text-[#6b7280]">{c.label}</p>
            <p className={cn("text-[15px] font-bold leading-tight mt-0.5", c.alert ? "text-red-400" : "text-[#0f0f12]")}>{c.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-[#faf8ff] border border-black/[0.06] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/[0.06]">
              {["Producto", "Variante", "Stock", "Nivel"].map(h => (
                <th key={h} className="px-2.5 py-1 text-left text-[8px] font-medium text-[#9ca3af] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.variant} className={cn("border-b border-black/[0.06] last:border-0", r.rowClass)}>
                <td className="px-2.5 py-1.5 text-[9px] text-[#374151] font-medium">{r.name}</td>
                <td className="px-2.5 py-1.5 text-[8px] text-[#6b7280]">{r.variant}</td>
                <td className={cn("px-2.5 py-1.5 text-[10px] font-semibold", r.stock <= 10 ? "text-red-400" : "text-[#374151]")}>{r.stock}</td>
                <td className="px-2.5 py-1.5">
                  <span className={cn("text-[8px] font-medium px-1.5 py-0.5 rounded border", r.lClass)}>{r.level}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Platform Demo Container ──────────────────────────────────────────────────
function PlatformDemo() {
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(true)

  const screens = [
    { id: "dashboard",  label: "Dashboard",  comp: <DashboardScreen /> },
    { id: "productos",  label: "Productos",  comp: <ProductosScreen /> },
    { id: "inventario", label: "Inventario", comp: <InventarioScreen /> },
  ]

  const sidebarNav = [
    { id: "dashboard",  label: "Dashboard",  Icon: LayoutDashboard },
    { id: "productos",  label: "Productos",  Icon: Package },
    { id: "inventario", label: "Inventario", Icon: Archive },
    { id: "metricas",   label: "Métricas",   Icon: TrendingUp },
    { id: "config",     label: "Config",     Icon: Settings },
  ]

  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => setActive(a => (a + 1) % screens.length), 3800)
    return () => clearInterval(t)
  }, [playing, screens.length])

  const activeId = screens[active].id

  return (
    <div className="space-y-3">
      {/* Browser frame */}
      <div className="rounded-2xl overflow-hidden border border-black/[0.10] shadow-[0_0_80px_rgba(124,58,237,0.07),0_20px_60px_rgba(0,0,0,0.1)]">
        {/* Browser chrome */}
        <div className="flex items-center gap-3 px-4 h-9 bg-[#faf7ff] border-b border-black/[0.08]">
          <div className="flex gap-1.5 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]/80" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-white border border-black/[0.06] rounded-md px-4 py-0.5 text-[10px] text-[#9ca3af] font-mono w-52 text-center">
              app.aguara.io/{activeId}
            </div>
          </div>
          <div className="w-14 shrink-0" />
        </div>

        {/* App shell */}
        <div className="flex bg-white" style={{ height: 330 }}>
          {/* Sidebar */}
          <div className="w-40 bg-white border-r border-black/[0.06] flex flex-col shrink-0">
            <div className="flex items-center gap-2.5 px-3 py-3 border-b border-black/[0.06]">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-white text-[10px] shrink-0 relative"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4c1d95)" }}
              >
                A
                <span
                  className="absolute bottom-1 right-0.5 w-1 h-1.5 bg-[#a3e635]"
                  style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
                />
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#0f0f12] leading-none">Aguara</div>
                <div className="text-[7px] text-[#9ca3af] uppercase tracking-widest mt-0.5">Control Tower</div>
              </div>
            </div>
            <nav className="flex-1 px-1.5 py-2 space-y-0.5">
              {sidebarNav.map(({ id, label, Icon }) => {
                const idx = screens.findIndex(s => s.id === id)
                return (
                  <button
                    key={id}
                    onClick={() => { if (idx >= 0) { setActive(idx); setPlaying(false) } }}
                    className={cn(
                      "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] transition-colors text-left",
                      id === activeId
                        ? "bg-[#7c3aed]/10 text-[#7c3aed]"
                        : "text-[#9ca3af] hover:text-[#374151] hover:bg-black/[0.04]",
                      idx < 0 && "cursor-default"
                    )}
                  >
                    <Icon size={11} />
                    {label}
                  </button>
                )
              })}
            </nav>
            <div className="border-t border-black/[0.06] px-1.5 pb-2 pt-2">
              <div className="flex items-center gap-2 px-2.5 py-1.5">
                <div className="w-5 h-5 rounded-full bg-[#7c3aed]/20 flex items-center justify-center text-[8px] text-[#7c3aed] font-bold shrink-0">
                  B
                </div>
                <span className="text-[9px] text-[#9ca3af] truncate">Basti</span>
              </div>
            </div>
          </div>

          {/* Screen content */}
          <div className="flex-1 overflow-hidden relative">
            {screens.map((s, i) => (
              <div
                key={s.id}
                className="absolute inset-0 transition-all duration-500"
                style={{
                  opacity: i === active ? 1 : 0,
                  transform: i === active
                    ? "translateX(0) scale(1)"
                    : i < active
                      ? "translateX(-10px) scale(0.99)"
                      : "translateX(10px) scale(0.99)",
                  pointerEvents: i === active ? "auto" : "none",
                }}
              >
                {s.comp}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setPlaying(p => !p)}
          className="text-[#9ca3af] hover:text-[#374151] transition-colors"
          aria-label={playing ? "Pausar" : "Reproducir"}
        >
          {playing ? <Pause size={11} /> : <Play size={11} />}
        </button>

        <div className="flex items-center gap-1.5">
          {screens.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { setActive(i); setPlaying(false) }}
              className={cn(
                "text-[10px] px-2.5 py-0.5 rounded-full transition-all duration-200 border",
                i === active
                  ? "bg-[#7c3aed]/12 text-[#7c3aed] border-[#7c3aed]/25"
                  : "text-[#9ca3af] border-transparent hover:text-[#374151]"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-14 h-px bg-black/[0.08] rounded-full overflow-hidden">
          {playing && (
            <div
              key={`${active}-${playing}`}
              className="h-full bg-[#7c3aed]/60 rounded-full"
              style={{ animation: "demoProgress 3.8s linear forwards" }}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes demoProgress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  )
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
      <div
        ref={trackRef}
        className="relative h-1.5 rounded-full bg-black/[0.08] cursor-pointer mb-4"
        onClick={getIndexFromClick}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-[#7c3aed] transition-all duration-150"
          style={{ width: `${fillPct}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-lg border-2 border-[#7c3aed] transition-all duration-150 cursor-grab active:cursor-grabbing"
          style={{ left: `${fillPct}%` }}
        />
        {STEPS.map((_, i) => (
          <button
            key={i}
            onClick={e => { e.stopPropagation(); onChange(i) }}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            style={{ left: `${(i / (STEPS.length - 1)) * 100}%` }}
          >
            <span className={cn(
              "block w-2 h-2 rounded-full transition-all duration-150",
              i <= value ? "bg-[#7c3aed]" : "bg-black/[0.15]"
            )} />
          </button>
        ))}
      </div>
      <div className="flex justify-between">
        {STEPS.map((s, i) => (
          <button
            key={s.label}
            onClick={() => onChange(i)}
            className={cn(
              "text-[10px] font-medium transition-colors",
              i === value ? "text-[#7c3aed] font-semibold" : "text-[#9ca3af] hover:text-[#374151]"
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
      "relative bg-white rounded-2xl p-6 flex flex-col overflow-hidden transition-all duration-200",
      highlight
        ? "border border-[#7c3aed]/40 ring-1 ring-[#7c3aed]/15 shadow-lg shadow-[#7c3aed]/5"
        : "border border-black/[0.08]"
    )}>
      {highlight && (
        <>
          <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7c3aed]/60 to-transparent" />
          {tag && (
            <div className="absolute top-4 right-4">
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/20">
                <Zap size={9} /> {tag}
              </span>
            </div>
          )}
        </>
      )}

      <p className={cn(
        "text-xs font-semibold uppercase tracking-widest mb-4",
        highlight ? "text-[#7c3aed]" : "text-[#6b7280]"
      )}>
        {name}
      </p>

      <div className="mb-1">
        <div className="flex items-end gap-1">
          <span className={cn(
            "font-bold text-[#0f0f12] tabular-nums",
            isCustom || isFree ? "text-2xl" : "text-4xl"
          )}>
            {displayPrice}
          </span>
          {!isCustom && !isFree && (
            <span className="text-sm text-[#6b7280] mb-1.5">/mes</span>
          )}
        </div>
        <p className="text-xs text-[#9ca3af]">{ordersLabel}</p>
      </div>

      <div className="space-y-2 flex-1 my-5">
        {features.map((f, i) => (
          <div key={f} className="flex items-start gap-2.5">
            <CheckCircle2 size={13} className={cn(
              "shrink-0 mt-0.5",
              // Todos los planes usan checkmark — verde para highlight, violeta para los demás
              highlight ? "text-[#a3e635]" : "text-[#7c3aed]"
            )} />
            <span className={cn(
              "text-sm",
              // La primera feature de Growth/Pro es "Todo del plan X" → texto más tenue
              i === 0 && name !== "Starter" ? "text-[#6b7280] italic" : "text-[#374151]"
            )}>{f}</span>
          </div>
        ))}
      </div>

      {/* h-12 → touch target ≥ 48dp */}
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className={cn(
          "w-full h-12 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98]",
          highlight
            ? "bg-[#7c3aed] hover:bg-[#6d28d9] text-white disabled:opacity-60 shadow-lg shadow-[#7c3aed]/15"
            : "bg-black/[0.04] hover:bg-black/[0.06] border border-black/[0.08] text-[#374151] disabled:opacity-60"
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
  const [step, setStep] = useState(1)

  const current   = STEPS[step]
  const isFree    = step === 0
  const isCustom  = step === 9
  const ordersLabel = `Hasta ${current.label} órdenes/mes`
  const prices    = { starter: PRICE_TABLE.starter[step], growth: PRICE_TABLE.growth[step], pro: PRICE_TABLE.pro[step] }
  const suggestedPlan  = step === 0 ? "Free" : step <= 2 ? "Starter" : step <= 5 ? "Growth" : step === 9 ? "Personalizado" : "Pro"
  const suggestedPrice = step === 0 ? "Gratis" : step === 9 ? "Personalizado" : step <= 2 ? `$${prices.starter}` : step <= 5 ? `$${prices.growth}` : `$${prices.pro}`

  return (
    <div className="min-h-dvh bg-white overflow-x-hidden pb-24 lg:pb-0">
      <header className="sticky top-0 z-40 flex items-center px-4 py-2 border-b border-black/[0.08] bg-white/90 backdrop-blur-sm">
        <h1 className="text-sm font-medium text-[#0f0f12]">Suscripción</h1>
      </header>

      {/* px-4 mobile, px-6 desktop — higiene cognitiva */}
      <div className="px-4 lg:px-6 py-6 lg:py-10 max-w-[1100px] mx-auto space-y-6 lg:space-y-8">

        {/* Heading */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-[#0f0f12] leading-tight">
            Elegí el plan que mejor se adapte<br />a tus necesidades
          </h1>
          <p className="text-sm text-[#6b7280]">Controlá tu negocio desde un solo lugar.</p>
        </div>

        {/* ─── Platform Demo ─── */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 justify-center mb-1">
            <div className="h-px flex-1 bg-black/[0.06]" />
            <span className="text-[11px] text-[#9ca3af] uppercase tracking-widest font-medium">Vista previa de la plataforma</span>
            <div className="h-px flex-1 bg-black/[0.06]" />
          </div>
          <PlatformDemo />
        </div>

        {/* Slider card */}
        <div className="bg-white border border-black/[0.08] rounded-xl px-6 pt-6 pb-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-[#6b7280] mb-0.5">Órdenes por mes</p>
              <p className="text-2xl font-bold text-[#0f0f12]">{current.label}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#6b7280] mb-0.5">Plan sugerido</p>
              <p className="text-sm font-semibold text-[#7c3aed]">
                {suggestedPlan}{step !== 9 && step !== 0 ? ` · ${suggestedPrice}/mes` : ""}
              </p>
            </div>
          </div>
          <PricingSlider value={step} onChange={setStep} />
        </div>

        {/* Plan cards: 1 col mobile → 3 en md */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PlanCard
            name="Starter" planKey="starter" step={step}
            price={prices.starter} highlight={false}
            ordersLabel={ordersLabel} features={PLAN_FEATURES.starter}
            isFree={isFree} isCustom={isCustom}
          />
          <PlanCard
            name="Growth" planKey="growth" step={step}
            price={prices.growth} highlight={true} tag="Popular"
            ordersLabel={ordersLabel} features={PLAN_FEATURES.growth}
            isFree={isFree} isCustom={isCustom}
          />
          <PlanCard
            name="Pro" planKey="pro" step={step}
            price={prices.pro} highlight={false}
            ordersLabel={ordersLabel} features={PLAN_FEATURES.pro}
            isFree={isFree} isCustom={isCustom}
          />
        </div>

        {/* Free plan note */}
        <div className="bg-white border border-black/[0.08] rounded-xl px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#0f0f12]">¿Recién empezás?</p>
            <p className="text-xs text-[#6b7280] mt-0.5">Aguara tiene un plan gratuito para hasta 50 órdenes/mes, sin tarjeta de crédito.</p>
          </div>
          <span className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-black/[0.04] border border-black/[0.08] text-[#6b7280]">
            Plan actual — Gratis
          </span>
        </div>

        {/* Preview banner */}
        <div className="bg-white border border-[#a3e635]/20 rounded-xl p-5 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-[#0f0f12] mb-0.5">¿Querés ver cómo se ven las funciones del plan Avanzado?</p>
            <p className="text-xs text-[#6b7280]">Explorá Productos e Inventario con datos de ejemplo.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href="/productos?preview=true" className="text-xs px-3 py-1.5 rounded-lg bg-black/[0.05] border border-black/[0.08] text-[#374151] hover:text-[#0f0f12] hover:bg-black/[0.08] transition-colors">
              Ver Productos
            </Link>
            <Link href="/inventario?preview=true" className="text-xs px-3 py-1.5 rounded-lg bg-black/[0.05] border border-black/[0.08] text-[#374151] hover:text-[#0f0f12] hover:bg-black/[0.08] transition-colors">
              Ver Inventario
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-[#9ca3af]">
          ¿Preguntas? Escribinos a{" "}
          <a href="mailto:hola@aguara.io" className="text-[#7c3aed] hover:underline">hola@aguara.io</a>
        </p>
      </div>

      {/* ── CTA Sticky Mobile — plan sugerido siempre al alcance del pulgar ── */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-white via-white/95 to-transparent"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-[#6b7280]">Plan sugerido:</span>
          <span className="text-xs font-semibold text-[#7c3aed]">{suggestedPlan}</span>
          {step !== 0 && step !== 9 && <span className="text-xs text-[#9ca3af]">· {suggestedPrice}/mes</span>}
        </div>
        <button
          onClick={() => {
            const planKey = step === 0 || step === 9 ? "starter"
              : step <= 2 ? "starter"
              : step <= 5 ? "growth" : "pro"
            window.location.href = step === 0 ? "/signup" : "#"
          }}
          className="w-full h-14 flex items-center justify-center bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-base font-semibold rounded-xl transition-colors shadow-lg shadow-[#7c3aed]/20 touch-manipulation active:scale-[0.98]"
        >
          {step === 0 ? "Empezar gratis" : step === 9 ? "Contactar ventas" : `Suscribirse a ${suggestedPlan}`}
        </button>
      </div>
    </div>
  )
}
