"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { AguaraLogo } from "@/components/AguaraLogo"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword]   = useState("")
  const [confirm, setConfirm]     = useState("")
  const [showPass, setShowPass]   = useState(false)
  const [error, setError]         = useState("")
  const [success, setSuccess]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [ready, setReady]         = useState(false)

  // Supabase sends the user via URL hash fragment — wait for auth session
  useEffect(() => {
    const supabase = createClient()
    // onAuthStateChange picks up the RECOVERY event from the email link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true)
    })
    // Also check if already in a session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.")
      return
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError("No pudimos actualizar la contraseña. El link puede haber expirado.")
    } else {
      setSuccess(true)
      setTimeout(() => router.push("/"), 2500)
    }
  }

  const passwordsMatch = confirm.length > 0 && password === confirm

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
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-emerald-400" />
              </div>
              <h1 className="text-lg font-bold text-white mb-2">¡Contraseña actualizada!</h1>
              <p className="text-sm text-white/40 mb-4">Redirigiendo al dashboard...</p>
              <div className="w-32 mx-auto h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ animation: "fill 2.5s linear forwards", width: "0%" }} />
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-white mb-1">Nueva contraseña</h1>
              <p className="text-sm text-white/40 mb-6">Elegí una contraseña segura para tu cuenta.</p>

              {!ready && (
                <div className="flex items-center gap-2 text-xs text-white/40 mb-4">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
                  Verificando sesión...
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Nueva contraseña */}
                <div>
                  <label htmlFor="new-password" className="block text-xs font-medium text-white/50 mb-1.5">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      minLength={8}
                      required
                      disabled={!ready}
                      autoComplete="new-password"
                      className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 pr-12 text-base text-white placeholder:text-white/20 focus:outline-none focus:border-[#4f8ef7]/60 focus:bg-white/[0.06] transition-all disabled:opacity-40 touch-manipulation"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      aria-label={showPass ? "Ocultar" : "Mostrar"}
                      className="absolute right-0 top-0 w-12 h-12 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors touch-manipulation"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-white/30 mt-1 px-0.5">Al menos 8 caracteres con letras y números</p>
                </div>

                {/* Confirmar */}
                <div>
                  <label htmlFor="confirm-password" className="block text-xs font-medium text-white/50 mb-1.5">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showPass ? "text" : "password"}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repetí la contraseña"
                      required
                      disabled={!ready}
                      autoComplete="new-password"
                      className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 pr-10 text-base text-white placeholder:text-white/20 focus:outline-none focus:border-[#4f8ef7]/60 transition-all disabled:opacity-40 touch-manipulation"
                    />
                    {passwordsMatch && (
                      <CheckCircle2 size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" />
                    )}
                  </div>
                </div>

                {error && (
                  <div role="alert" className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-3">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !ready || !password || !confirm}
                  className="w-full h-12 flex items-center justify-center bg-[#4f8ef7] hover:bg-[#4f8ef7]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors touch-manipulation active:scale-[0.98] mt-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Guardando...
                    </span>
                  ) : "Guardar nueva contraseña"}
                </button>
              </form>

              <div className="mt-5 text-center">
                <Link href="/login" className="text-xs text-white/30 hover:text-white/50 touch-manipulation">
                  ← Volver al login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fill { from { width: 0% } to { width: 100% } }
      `}</style>
    </div>
  )
}
