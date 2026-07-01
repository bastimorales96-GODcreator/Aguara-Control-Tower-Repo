"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  CheckCircle2, Store, ArrowRight, Zap, BarChart2, ShoppingBag,
  ExternalLink, ChevronRight
} from "lucide-react"
import { AguaraLogo } from "@/components/AguaraLogo"
import { cn } from "@/lib/utils"

// ─── Step types ───────────────────────────────────────────────────────────────
type Step = "welcome" | "connect" | "done"

// ─── Shopify sub-step ────────────────────────────────────────────────────────
function ShopifyInput() {
  const [shop, setShop] = useState("")
  return (
    <div className="flex items-center bg-white border border-black/[0.10] rounded-xl overflow-hidden">
      <input
        type="text"
        value={shop}
        onChange={e => setShop(e.target.value)}
        placeholder="tu-tienda"
        autoComplete="off"
        className="flex-1 bg-transparent text-base text-[#0f0f12] px-4 h-12 outline-none placeholder:text-[#9ca3af] touch-manipulation"
      />
      <span className="text-xs text-[#9ca3af] pr-2 shrink-0">.myshopify.com</span>
      <a
        href={shop ? `/api/auth/shopify/connect?shop=${shop}` : "#"}
        className={cn(
          "flex items-center gap-1.5 text-xs px-4 h-12 font-semibold transition-colors shrink-0",
          shop ? "bg-[#7c3aed] text-white hover:bg-[#6d28d9]" : "bg-black/[0.04] text-[#9ca3af] pointer-events-none"
        )}
      >
        Conectar <ArrowRight size={12} />
      </a>
    </div>
  )
}

// ─── Platform card ────────────────────────────────────────────────────────────
function PlatformCard({
  name, description, logoBg, children, comingSoon
}: {
  name: string; description: string; logoBg: string; children: React.ReactNode; comingSoon?: boolean
}) {
  return (
    <div className={cn(
      "bg-white border border-black/[0.08] rounded-2xl p-5 space-y-4",
      comingSoon && "opacity-50"
    )}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: logoBg }}>
          <ShoppingBag size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[#0f0f12]">{name}</p>
            {comingSoon && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/[0.05] text-[#9ca3af] border border-black/[0.08]">
                Próximamente
              </span>
            )}
          </div>
          <p className="text-xs text-[#6b7280]">{description}</p>
        </div>
      </div>
      {!comingSoon && children}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("welcome")

  // Si ya tiene tienda conectada → redirigir al dashboard
  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient()
      supabase.from("store_connections").select("id").limit(1).then(({ data }) => {
        if (data && data.length > 0) router.replace("/")
      })
    })
  }, [router])

  // Features shown on welcome step
  const features = [
    { icon: BarChart2, label: "KPIs en tiempo real", sub: "Ventas, ROAS, CPA y márgenes al instante" },
    { icon: Zap,       label: "Insights con IA",     sub: "Detectamos oportunidades y alertas automáticamente" },
    { icon: Store,     label: "Multi-tienda",         sub: "Manejá varias tiendas desde un solo panel" },
  ]

  return (
    <div className="min-h-dvh bg-white flex flex-col items-center justify-center px-4 py-8 overflow-x-hidden">
      {/* Dot grid */}
      <div
        className="fixed inset-0 pointer-events-none" aria-hidden="true"
        style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
      />

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <AguaraLogo size={36} variant="light" />
          <div>
            <div className="text-sm font-bold text-[#0f0f12] leading-none">Aguara</div>
            <div className="text-[9px] text-[#6b7280] uppercase tracking-widest mt-0.5">Business Control Tower</div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(["welcome", "connect", "done"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
                step === s           ? "bg-[#7c3aed] text-white"
                : ["welcome","connect","done"].indexOf(step) > i ? "bg-emerald-500 text-white"
                : "bg-black/[0.08] text-[#9ca3af]"
              )}>
                {["welcome","connect","done"].indexOf(step) > i ? <CheckCircle2 size={12} /> : i + 1}
              </div>
              {i < 2 && <div className={cn("h-px w-8", step !== "welcome" && i === 0 ? "bg-emerald-500" : "bg-black/[0.08]")} />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Welcome ── */}
        {step === "welcome" && (
          <div className="bg-white border border-black/[0.08] rounded-2xl p-6 lg:p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[#0f0f12] mb-2">¡Bienvenido a Aguara! 🎉</h1>
              <p className="text-sm text-[#6b7280] leading-relaxed">
                Tu panel de control para e-commerce. En 2 minutos tenés todo conectado.
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {features.map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-start gap-3 bg-[#faf8ff] border border-black/[0.06] rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={14} className="text-[#7c3aed]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#0f0f12]">{label}</p>
                    <p className="text-xs text-[#6b7280]">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep("connect")}
              className="w-full h-14 flex items-center justify-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-base font-semibold rounded-xl transition-colors touch-manipulation active:scale-[0.98] shadow-lg shadow-[#7c3aed]/20"
            >
              Empezar <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* ── Step 2: Connect store ── */}
        {step === "connect" && (
          <div className="bg-white border border-black/[0.08] rounded-2xl p-6 lg:p-8">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-[#0f0f12] mb-1">Conectá tu tienda</h1>
              <p className="text-sm text-[#6b7280]">
                Seleccioná tu plataforma para sincronizar órdenes, productos y clientes.
              </p>
            </div>

            <div className="space-y-4">
              {/* Shopify */}
              <PlatformCard
                name="Shopify"
                description="Conectá tu tienda Shopify para ver ventas y métricas."
                logoBg="#96bf48"
              >
                <ShopifyInput />
              </PlatformCard>

              {/* Tiendanube */}
              <PlatformCard
                name="Tiendanube"
                description="Sincronizá órdenes, productos e inventario en tiempo real."
                logoBg="#00b140"
              >
                <a
                  href="/api/auth/tiendanube/connect"
                  className="w-full h-12 flex items-center justify-center gap-2 bg-[#00b140] hover:bg-[#00b140]/90 text-white text-sm font-semibold rounded-xl transition-colors touch-manipulation"
                >
                  Conectar Tiendanube <ExternalLink size={13} />
                </a>
              </PlatformCard>

              {/* MercadoLibre */}
              <PlatformCard
                name="MercadoLibre"
                description="Integrá tus ventas de MercadoLibre al dashboard."
                logoBg="#ffe600"
                comingSoon
              >
                <></>
              </PlatformCard>
            </div>

            {/* Skip */}
            <button
              onClick={() => setStep("done")}
              className="w-full mt-4 text-xs text-[#9ca3af] hover:text-[#6b7280] transition-colors py-2 touch-manipulation"
            >
              Saltar por ahora, conectar más tarde →
            </button>
          </div>
        )}

        {/* ── Step 3: Done ── */}
        {step === "done" && (
          <div className="bg-white border border-black/[0.08] rounded-2xl p-6 lg:p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={36} className="text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-[#0f0f12] mb-2">¡Todo listo!</h1>
            <p className="text-sm text-[#6b7280] mb-8 leading-relaxed max-w-sm mx-auto">
              Tu cuenta está configurada. Podés conectar tu tienda en cualquier momento desde Configuración → Integraciones.
            </p>

            <button
              onClick={() => router.push("/")}
              className="w-full h-14 flex items-center justify-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-base font-semibold rounded-xl transition-colors touch-manipulation active:scale-[0.98] shadow-lg shadow-[#7c3aed]/20 mb-3"
            >
              Ir al Dashboard <ChevronRight size={18} />
            </button>

            <Link
              href="/config/integraciones"
              className="text-xs text-[#9ca3af] hover:text-[#6b7280] transition-colors touch-manipulation"
            >
              Conectar tienda ahora →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
