import { Calendar, ChevronDown, DollarSign, Info, Plus, Pencil } from "lucide-react"

const SectionIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.6" />
    <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.4" />
    <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.2" />
  </svg>
)

const fees = [
  { method: "Mercado Pago", installments: "1 cuota", fee: 4.99 },
  { method: "Mercado Pago", installments: "3 cuotas", fee: 9.49 },
  { method: "Mercado Pago", installments: "6 cuotas", fee: 12.99 },
  { method: "Tarjeta de débito", installments: "1 cuota", fee: 1.80 },
  { method: "Transferencia bancaria", installments: "1 cuota", fee: 0.00 },
  { method: "Efectivo (Rapipago/Pago Fácil)", installments: "1 cuota", fee: 2.50 },
]

export default function ComisionesPage() {
  return (
    <div className="min-h-screen bg-[#080d14]">
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-[#080d14]/90 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-white/40 text-sm">
          <span>Configuración</span>
          <span>/</span>
          <span className="text-white">Comisiones</span>
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

      <div className="px-6 py-6 max-w-[800px] space-y-6">
        {/* Info banner */}
        <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
          <Info size={14} className="text-yellow-500 mt-0.5 shrink-0" />
          <p className="text-xs text-yellow-500/80 leading-relaxed">
            Las comisiones mostradas no incluyen IVA. Los valores aplicados a cada orden se calculan con el IVA correspondiente según el medio de pago.
          </p>
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-white/50">
              <SectionIcon />
              <h2 className="text-sm font-medium">Medios de Pago</h2>
            </div>
            <button className="flex items-center gap-2 text-xs text-white font-medium bg-[#4f8ef7] hover:bg-[#4f8ef7]/90 rounded-lg px-3 py-1.5 transition-colors">
              <Plus size={12} />
              Agregar medio de pago
            </button>
          </div>

          <div className="bg-[#0f1825] border border-white/[0.07] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium text-white/40 uppercase tracking-wider">Medio de Pago</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium text-white/40 uppercase tracking-wider">Cuotas</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-medium text-white/40 uppercase tracking-wider">Comisión %</th>
                  <th className="px-4 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {fees.map((row, i) => (
                  <tr key={`${row.method}-${row.installments}`} className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i === fees.length - 1 ? "border-b-0" : ""}`}>
                    <td className="px-4 py-3 text-sm text-white/90">{row.method}</td>
                    <td className="px-4 py-3 text-sm text-white/60">{row.installments}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm tabular-nums font-medium ${row.fee === 0 ? "text-emerald-400" : "text-white/70"}`}>
                        {row.fee === 0 ? "Gratis" : `${row.fee.toFixed(2)}%`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 rounded hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors">
                        <Pencil size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
