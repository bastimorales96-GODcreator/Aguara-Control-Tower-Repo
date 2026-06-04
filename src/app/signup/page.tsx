"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

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
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#080d14] flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-base relative"
            style={{ background: "linear-gradient(135deg, #4f8ef7, #1a3a6b)" }}>
            A
            <span className="absolute bottom-1.5 right-1 w-1.5 h-2 bg-[#a3e635]"
              style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }} />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-none">Aguara</div>
            <div className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">Business Control Tower</div>
          </div>
        </div>

        <div className="bg-[#0f1825] border border-white/[0.07] rounded-2xl p-8">
          {success ? (
            <div className="text-center">
              <div className="text-3xl mb-4">✉️</div>
              <h1 className="text-lg font-bold text-white mb-2">Revisá tu email</h1>
              <p className="text-sm text-white/40 mb-6">
                Te enviamos un link de confirmación a <strong className="text-white/70">{email}</strong>.
                Hacé click en el link para activar tu cuenta.
              </p>
              <Link href="/login" className="text-sm text-[#4f8ef7] hover:underline">
                Volver al login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-white mb-1">Crear cuenta</h1>
              <p className="text-sm text-white/40 mb-7">Empezá gratis, sin tarjeta de crédito.</p>

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Nombre</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Tu nombre"
                    required
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#4f8ef7]/50 focus:bg-white/[0.06] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="vos@empresa.com"
                    required
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#4f8ef7]/50 focus:bg-white/[0.06] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    minLength={8}
                    required
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#4f8ef7]/50 focus:bg-white/[0.06] transition-all"
                  />
                </div>

                {error && (
                  <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#4f8ef7] hover:bg-[#4f8ef7]/90 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors mt-2"
                >
                  {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
                </button>
              </form>

              <div className="mt-5 text-center text-xs text-white/30">
                ¿Ya tenés cuenta?{" "}
                <Link href="/login" className="text-[#4f8ef7] hover:underline">
                  Ingresá
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
