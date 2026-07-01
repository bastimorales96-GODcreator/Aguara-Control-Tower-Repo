"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, AlertCircle, Mail, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { AguaraLogo } from "@/components/AguaraLogo"

export default function SignupPage() {
  const [name, setName]         = useState("")
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState("")
  const [success, setSuccess]   = useState(false)
  const [loading, setLoading]   = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        // Al confirmar email → va al onboarding para conectar tienda
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    })
    if (error) {
      setError(error.message === "User already registered"
        ? "Este email ya tiene una cuenta. ¿Querés ingresar?"
        : "No pudimos crear tu cuenta. Intentá de nuevo o contactanos.")
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  const SubmitButton = ({ fullHeight = false }: { fullHeight?: boolean }) => (
    <button
      type="submit"
      disabled={loading}
      className={`w-full flex items-center justify-center bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors touch-manipulation active:scale-[0.98] shadow-lg shadow-[#7c3aed]/15 ${
        fullHeight ? "h-14 text-base" : "h-12 text-sm rounded-lg"
      }`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Creando cuenta...
        </span>
      ) : "Crear cuenta gratis"}
    </button>
  )

  if (success) {
    return (
      <div className="min-h-dvh bg-white flex flex-col items-center justify-center px-4 overflow-x-hidden">
        <div
          className="fixed inset-0 pointer-events-none" aria-hidden="true"
          style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        />
        <div className="relative w-full max-w-sm">
          <div className="bg-white border border-black/[0.08] rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#7c3aed]/15 flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-[#7c3aed]" />
            </div>
            <h1 className="text-lg font-bold text-[#0f0f12] mb-2">Revisá tu email</h1>
            <p className="text-sm text-[#6b7280] mb-6 leading-relaxed">
              Te enviamos un link de confirmación a{" "}
              <strong className="text-[#0f0f12] break-all">{email}</strong>.
              {" "}Hacé click en el link para activar tu cuenta.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#6b7280] bg-[#faf8ff] rounded-lg px-3 py-2.5 mb-5">
              <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
              <span>Revisá también la carpeta de spam</span>
            </div>
            <Link href="/login" className="text-sm text-[#7c3aed] hover:underline touch-manipulation">
              Volver al login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-white flex flex-col items-center justify-center px-4 overflow-x-hidden pb-32 lg:pb-0">
      <div
        className="fixed inset-0 pointer-events-none" aria-hidden="true"
        style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <AguaraLogo size={36} variant="light" />
          <div>
            <div className="text-sm font-bold text-[#0f0f12] leading-none">Aguara</div>
            <div className="text-[9px] text-[#6b7280] uppercase tracking-widest mt-0.5">Business Control Tower</div>
          </div>
        </div>

        <div className="bg-white border border-black/[0.08] rounded-2xl p-6 lg:p-8">
          <h1 className="text-xl font-bold text-[#0f0f12] mb-1">Crear cuenta</h1>
          <p className="text-sm text-[#6b7280] mb-6">Empezá gratis, sin tarjeta de crédito.</p>

          <form onSubmit={handleSignup} className="space-y-4" noValidate>
            {/* Nombre */}
            <div>
              <label htmlFor="signup-name" className="block text-xs font-medium text-[#6b7280] mb-1.5">
                Nombre completo
              </label>
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tu nombre"
                required
                // text-base 16px → evita auto-zoom iOS
                // h-12 → touch target 48dp
                autoComplete="name"
                autoCapitalize="words"
                className="w-full h-12 bg-white border border-black/[0.10] rounded-lg px-4 text-base text-[#0f0f12] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#7c3aed] transition-all touch-manipulation"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="signup-email" className="block text-xs font-medium text-[#6b7280] mb-1.5">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vos@empresa.com"
                required
                inputMode="email"
                autoComplete="email"
                className="w-full h-12 bg-white border border-black/[0.10] rounded-lg px-4 text-base text-[#0f0f12] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#7c3aed] transition-all touch-manipulation"
              />
            </div>

            {/* Contraseña con show/hide */}
            <div>
              <label htmlFor="signup-password" className="block text-xs font-medium text-[#6b7280] mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  required
                  autoComplete="new-password"
                  className="w-full h-12 bg-white border border-black/[0.10] rounded-lg px-4 pr-12 text-base text-[#0f0f12] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#7c3aed] transition-all touch-manipulation"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-0 top-0 w-12 h-12 flex items-center justify-center text-[#9ca3af] hover:text-[#374151] transition-colors touch-manipulation"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-[#9ca3af] mt-1.5 px-0.5">
                Usá al menos 8 caracteres con letras y números
              </p>
            </div>

            {/* Error con causa y solución */}
            {error && (
              <div role="alert" className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-3">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* CTA desktop */}
            <div className="hidden lg:block mt-2">
              <SubmitButton />
            </div>
          </form>

          <p className="text-[11px] text-[#9ca3af] text-center mt-4 leading-relaxed">
            Al crear tu cuenta aceptás nuestros{" "}
            <a href="#" className="text-[#374151] hover:underline">Términos de Servicio</a>{" "}
            y{" "}
            <a href="#" className="text-[#374151] hover:underline">Política de Privacidad</a>
          </p>

          <div className="mt-4 text-center text-xs text-[#6b7280]">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-[#7c3aed] hover:underline touch-manipulation">
              Ingresá
            </Link>
          </div>
        </div>
      </div>

      {/* ── CTA Sticky Mobile ─────────────────────────────────────────────── */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-white via-white/95 to-transparent"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <form onSubmit={handleSignup}>
          <SubmitButton fullHeight />
        </form>
      </div>
    </div>
  )
}
