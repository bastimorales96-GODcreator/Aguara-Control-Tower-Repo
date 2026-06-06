"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { AguaraLogo } from "@/components/AguaraLogo"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError("Email o contraseña incorrectos. Verificá tus datos e intentá de nuevo.")
      setLoading(false)
    } else {
      router.push("/")
      router.refresh()
    }
  }

  const SubmitButton = ({ fullHeight = false }: { fullHeight?: boolean }) => (
    <button
      type="submit"
      disabled={loading}
      className={`w-full flex items-center justify-center bg-[#4f8ef7] hover:bg-[#4f8ef7]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors touch-manipulation active:scale-[0.98] shadow-lg shadow-[#4f8ef7]/15 ${
        fullHeight ? "h-14 text-base" : "h-12 text-sm rounded-lg"
      }`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Ingresando...
        </span>
      ) : "Ingresar"}
    </button>
  )

  return (
    // min-h-dvh más fiable que 100vh en iOS. pb-32 reserva espacio para sticky CTA
    <div className="min-h-dvh bg-[#080d14] flex flex-col items-center justify-center px-4 overflow-x-hidden pb-32 lg:pb-0">
      {/* Dot grid decorativo */}
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <AguaraLogo size={36} variant="dark" />
          <div>
            <div className="text-sm font-bold text-white leading-none">Aguara</div>
            <div className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">Business Control Tower</div>
          </div>
        </div>

        {/* Card: p-6 móvil (no exceso de whitespace), p-8 desktop */}
        <div className="bg-[#0f1825] border border-white/[0.07] rounded-2xl p-6 lg:p-8">
          <h1 className="text-xl font-bold text-white mb-1">Bienvenido</h1>
          <p className="text-sm text-white/40 mb-6">Ingresá a tu cuenta para continuar</p>

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              {/* Label SIEMPRE visible (nunca solo placeholder) */}
              <label htmlFor="login-email" className="block text-xs font-medium text-white/50 mb-1.5">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vos@empresa.com"
                required
                // inputMode="email" → teclado correcto en mobile
                // autoComplete → relleno nativo del navegador
                // text-base (16px) → evita auto-zoom iOS
                // h-12 → touch target ≥ 48dp
                inputMode="email"
                autoComplete="email"
                className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 text-base text-white placeholder:text-white/20 focus:outline-none focus:border-[#4f8ef7]/60 focus:bg-white/[0.06] transition-all touch-manipulation"
              />
            </div>

            {/* Contraseña con show/hide */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-medium text-white/50">
                  Contraseña
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-[#4f8ef7] hover:text-[#4f8ef7]/80 transition-colors touch-manipulation"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 pr-12 text-base text-white placeholder:text-white/20 focus:outline-none focus:border-[#4f8ef7]/60 focus:bg-white/[0.06] transition-all touch-manipulation"
                />
                {/* Show/hide: touch target 48×48px */}
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-0 top-0 w-12 h-12 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors touch-manipulation"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error: causa explícita + cómo solucionarlo */}
            {error && (
              <div role="alert" className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-3">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* CTA solo en desktop (en mobile va sticky al fondo) */}
            <div className="hidden lg:block mt-2">
              <SubmitButton />
            </div>
          </form>

          <div className="mt-5 text-center text-xs text-white/30">
            ¿No tenés cuenta?{" "}
            <Link href="/signup" className="text-[#4f8ef7] hover:underline touch-manipulation">
              Registrate
            </Link>
          </div>
        </div>

        <p className="text-center text-[10px] text-white/20 mt-6">
          © 2026 Aguara · <a href="mailto:hola@aguara.io" className="hover:text-white/40">hola@aguara.io</a>
        </p>
      </div>

      {/* ── CTA Sticky Mobile — siempre al alcance del pulgar ─────────── */}
      {/* fixed bottom-0 w-full z-50 — regla #3 del brief */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-[#080d14] via-[#080d14]/95 to-transparent"
           style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <form onSubmit={handleLogin}>
          <SubmitButton fullHeight />
        </form>
      </div>
    </div>
  )
}
