"use client"

import { RefreshCw, Loader2, Pencil, CheckCircle2 } from "lucide-react"
import { useEffect, useState } from "react"

const SOURCES = [
  { id: "blue",    label: "Blue",        desc: "Dólar blue (mercado informal)" },
  { id: "oficial", label: "Oficial",     desc: "Tipo de cambio oficial BNA" },
  { id: "bolsa",   label: "MEP / Bolsa", desc: "Dólar bolsa / MEP" },
  { id: "cripto",  label: "Cripto (CCL)", desc: "Contado con liquidación" },
  { id: "manual",  label: "Manual",      desc: "Ingresás vos el valor" },
]

interface Rate { compra: number; venta: number; fecha: string }
type Rates = Record<string, Rate>

export default function CotizacionPage() {
  const [rates, setRates]         = useState<Rates | null>(null)
  const [loading, setLoading]     = useState(true)
  const [source, setSource]       = useState("blue")
  const [updatedAt, setUpdatedAt] = useState("")
  const [manualValue, setManualValue] = useState("")
  const [manualSaved, setManualSaved] = useState(false)
  const [editingManual, setEditingManual] = useState(false)

  useEffect(() => { fetchRates() }, [])

  async function fetchRates() {
    setLoading(true)
    try {
      const res = await fetch("/api/cotizacion")
      const data = await res.json()
      setRates(data.rates || null)
      setUpdatedAt(data.updatedAt || "")
    } catch {}
    setLoading(false)
  }

  function saveManual() {
    const val = parseFloat(manualValue.replace(",", "."))
    if (!val || isNaN(val)) return
    setManualSaved(true)
    setEditingManual(false)
  }

  const isManual = source === "manual"
  const currentAutoRate = rates?.[source]
  const displayRate = isManual
    ? (manualSaved ? parseFloat(manualValue.replace(",", ".")) : null)
    : currentAutoRate?.venta ?? null

  function formatTime(iso: string) {
    if (!iso) return ""
    try { return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) }
    catch { return "" }
  }

  return (
    <div className="min-h-screen bg-[#080d14]">
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-[#080d14]/90 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-white/40 text-sm">
          <span>Configuración</span><span>/</span>
          <span className="text-white">Cotización del Dólar</span>
        </div>
      </header>

      <div className="px-6 py-6 max-w-[700px] space-y-5">

        {/* Current rate display */}
        <div className="bg-[#0f1825] border border-white/[0.07] rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-white/40 mb-1">
                Cotización activa · {SOURCES.find(s => s.id === source)?.label}
              </p>
              {loading && !isManual ? (
                <div className="flex items-center gap-2 text-white/40 py-2">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-sm">Cargando...</span>
                </div>
              ) : displayRate ? (
                <>
                  <p className="text-4xl font-bold text-white tabular-nums tracking-tight">
                    ARS ${displayRate.toLocaleString("es-AR")}
                  </p>
                  {!isManual && currentAutoRate && (
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-white/40">Compra: <span className="text-white/70">${currentAutoRate.compra.toLocaleString("es-AR")}</span></span>
                      <span className="text-xs text-white/40">Venta: <span className="text-white/70">${currentAutoRate.venta.toLocaleString("es-AR")}</span></span>
                    </div>
                  )}
                  {!isManual && updatedAt && (
                    <p className="text-xs text-white/30 mt-1">Actualizado hoy a las {formatTime(updatedAt)}</p>
                  )}
                  {isManual && (
                    <p className="text-xs text-white/30 mt-1">Valor ingresado manualmente</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-white/40 py-2">
                  {isManual ? "Ingresá el valor manual abajo" : "No se pudo obtener la cotización"}
                </p>
              )}
            </div>
            {!isManual && (
              <button
                onClick={fetchRates}
                className="p-2 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            )}
          </div>

          {/* All auto rates grid */}
          {rates && !loading && !isManual && (
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/[0.06]">
              {SOURCES.filter(s => s.id !== "manual").map(s => {
                const r = rates[s.id]
                if (!r) return null
                return (
                  <div key={s.id} className="bg-white/[0.02] rounded-lg px-3 py-2">
                    <p className="text-[10px] text-white/30 mb-0.5">{s.label}</p>
                    <p className="text-sm font-semibold text-white/80">${r.venta?.toLocaleString("es-AR")}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Source selector */}
        <div className="bg-[#0f1825] border border-white/[0.07] rounded-xl p-5">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
            Cotización usada en los cálculos
          </p>
          <div className="space-y-2">
            {SOURCES.map((s) => (
              <label
                key={s.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  source === s.id
                    ? "border-[#4f8ef7]/40 bg-[#4f8ef7]/5"
                    : "border-white/[0.06] hover:bg-white/[0.02]"
                }`}
              >
                <input
                  type="radio"
                  name="source"
                  value={s.id}
                  checked={source === s.id}
                  onChange={() => {
                    setSource(s.id)
                    if (s.id === "manual") setEditingManual(!manualSaved)
                  }}
                  className="sr-only"
                />
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${source === s.id ? "border-[#4f8ef7]" : "border-white/20"}`}>
                  {source === s.id && <span className="w-1.5 h-1.5 rounded-full bg-[#4f8ef7]" />}
                </span>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${source === s.id ? "text-white" : "text-white/60"}`}>
                    {s.label}
                  </p>
                  <p className="text-xs text-white/30">{s.desc}</p>
                </div>
                {s.id !== "manual" && rates?.[s.id] && (
                  <span className="text-xs text-white/50 font-mono">
                    ${rates[s.id].venta?.toLocaleString("es-AR")}
                  </span>
                )}
                {s.id === "manual" && manualSaved && (
                  <span className="text-xs text-white/50 font-mono">
                    ${parseFloat(manualValue.replace(",", ".")).toLocaleString("es-AR")}
                  </span>
                )}
              </label>
            ))}
          </div>

          {/* Manual input — shown when "Manual" is selected */}
          {isManual && (editingManual || !manualSaved) && (
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <p className="text-xs text-white/40 mb-2">Ingresá el tipo de cambio (ARS por 1 USD)</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 flex-1 bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2.5">
                  <span className="text-xs text-white/30 font-medium">ARS $</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="ej. 1435"
                    value={manualValue}
                    onChange={e => setManualValue(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && saveManual()}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none tabular-nums"
                    autoFocus
                  />
                </div>
                <button
                  onClick={saveManual}
                  disabled={!manualValue}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-[#4f8ef7] hover:bg-[#4f8ef7]/90 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <CheckCircle2 size={13} />
                  Guardar
                </button>
              </div>
            </div>
          )}

          {/* Saved manual — show edit option */}
          {isManual && manualSaved && !editingManual && (
            <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <p className="text-xs text-white/40">
                Usando <span className="text-white/70 font-medium">
                  ARS ${parseFloat(manualValue.replace(",", ".")).toLocaleString("es-AR")}
                </span> por USD
              </p>
              <button
                onClick={() => setEditingManual(true)}
                className="flex items-center gap-1 text-xs text-[#4f8ef7] hover:text-[#4f8ef7]/80 transition-colors"
              >
                <Pencil size={11} /> Editar
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
