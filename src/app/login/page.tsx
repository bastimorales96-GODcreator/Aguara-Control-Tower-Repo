"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { AguaraLogo } from "@/components/AguaraLogo"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-[#080d14] flex items-center justify-center px-4">
      {/* Dot grid background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <AguaraLogo size={36} variant="dark" />
          <div>
            <div className="text-sm font-bold text-white leading-none">Aguara</div>
            <div className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">Business Control Tower</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#0f1825] border border-white/[0.07] rounded-2xl p-8">
          <h1 className="text-xl font-bold text-white mb-1">Bienvenido</h1>
          <p className="text-sm text-white/40 mb-7">Ingresá a tu cuenta para continuar</p>

          <form onSubmit={handleLogin} className="space-y-4">
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
                placeholder="••••••••"
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
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-white/30">
            ¿No tenés cuenta?{" "}
            <Link href="/signup" className="text-[#4f8ef7] hover:underline">
              Registrate
            </Link>
          </div>
        </div>

        <p className="text-center text-[10px] text-white/20 mt-6">
          © 2026 Aguara · <a href="mailto:hola@aguara.io" className="hover:text-white/40">hola@aguara.io</a>
        </p>
      </div>
    </div>
  )
}
