import { Calendar, ChevronDown, DollarSign, BarChart2, TrendingUp, Target } from "lucide-react"
import Link from "next/link"

const GoogleIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

export default function GooglePixelPage() {
  return (
    <div className="min-h-screen bg-[#080d14]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-[#080d14]/90 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-medium text-white">Pixel</h1>
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5">
            <Link
              href="/pixel/meta"
              className="px-3 py-1 rounded-md text-xs font-medium text-white/50 hover:text-white/80 transition-colors"
            >
              Meta
            </Link>
            <Link
              href="/pixel/google"
              className="px-3 py-1 rounded-md text-xs font-medium bg-white/[0.08] text-white transition-colors"
            >
              Google Ads
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 text-xs text-white/60 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg px-3 py-1.5 transition-colors">
            <Calendar size={12} />
            <span>May 27, 2026 - Jun 02, 2026</span>
          </button>
          <button className="flex items-center gap-1.5 text-xs text-white/60 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg px-3 py-1.5 transition-colors">
            <DollarSign size={12} />
            <span>USD</span>
            <ChevronDown size={10} />
          </button>
        </div>
      </header>

      <div className="px-6 py-6 flex items-center justify-center min-h-[calc(100vh-56px)]">
        <div className="flex flex-col items-center text-center max-w-md">
          {/* Google icon */}
          <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-6">
            <GoogleIcon />
          </div>

          <h2 className="text-xl font-semibold text-white mb-2">
            Conectá tu cuenta de Google Ads
          </h2>
          <p className="text-sm text-white/50 mb-8 leading-relaxed">
            Visualizá el rendimiento de tus campañas en tiempo real, junto a tus métricas de Meta en un solo lugar.
          </p>

          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4f8ef7] hover:bg-[#4f8ef7]/90 text-white text-sm font-medium rounded-lg transition-colors mb-8">
            Conectar Google Ads
          </button>

          {/* Feature chips */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {[
              { icon: <BarChart2 size={14} />, label: "Campañas" },
              { icon: <TrendingUp size={14} />, label: "Métricas" },
              { icon: <Target size={14} />, label: "Conversiones" },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white/50 text-xs"
              >
                {f.icon}
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
