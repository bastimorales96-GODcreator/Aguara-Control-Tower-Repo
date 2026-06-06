"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertCircle, CheckCircle2, Mail } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { AguaraLogo } from "@/components/AguaraLogo"

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("")
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)
    if (error) {
      setError("No pudimos enviar el email. Verificá que la dirección sea correcta.")
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-dvh bg-[#080d14] flex flex-col items-center justify-center px-4 overflow-x-hidden">
      <div
        className="fixed inset-0 pointer-events-none" aria-hidden="true"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
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

        <div className="bg-[#0f1825] border border-white/[0.07] rounded-2xl p-6 lg:p-8">
          {sent ? (
            /* ── Éxito ── */
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#4f8ef7]/15 flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-[#4f8ef7]" />
              </div>
              <h1 className="text-lg font-bold text-white mb-2">Revisá tu email</h1>
              <p className="text-sm text-white/40 mb-6 leading-relaxed">
                Si existe una cuenta con <strong className="text-white/70 break-all">{email}</strong>, recibirás un link para restablecer tu contraseña.
              </p>
              <div className="flex items-center gap-2 text-xs text-white/30 bg-white/[0.03] rounded-lg px-3 py-2.5 mb-5">
                <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                <span>Revisá también la carpeta de spam</span>
              </div>
              <Link href="/login" className="text-sm text-[#4f8ef7] hover:underline touch-manipulation">
                Volver al login
              </Link>
            </div>
          ) : (
            /* ── Formulario ── */
            <>
              <h1 className="text-xl font-bold text-white mb-1">Recuperar contraseña</h1>
              <p className="text-sm text-white/40 mb-6">
                Ingresá tu email y te enviaremos un link para crear una nueva contraseña.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="forgot-email" className="block text-xs font-medium text-white/50 mb-1.5">
                    Email
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="vos@empresa.com"
                    required
                    inputMode="email"
                    autoComplete="email"
                    className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 text-base text-white placeholder:text-white/20 focus:outline-none focus:border-[#4f8ef7]/60 focus:bg-white/[0.06] transition-all touch-manipulation"
                  />
                </div>

                {error && (
                  <div role="alert" className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-3">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full h-12 flex items-center justify-center bg-[#4f8ef7] hover:bg-[#4f8ef7]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors touch-manipulation active:scale-[0.98] mt-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </span>
                  ) : "Enviar link"}
                </button>
              </form>

              <div className="mt-5 text-center text-xs text-white/30">
                <Link href="/login" className="text-[#4f8ef7] hover:underline touch-manipulation">
                  ← Volver al login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
