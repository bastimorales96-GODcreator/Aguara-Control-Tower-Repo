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
    <div className="min-h-dvh overflow-x-hidden bg-white">
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-black/[0.08] bg-white/90 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-[#6b7280] text-sm">
          <span>Configuración</span><span>/</span>
          <span className="text-[#0f0f12]">Cotización del Dólar</span>
        </div>
      </header>

      <div className="px-4 lg:px-6 py-4 lg:py-6 max-w-[700px] space-y-5">

        {/* Current rate display */}
        <div className="bg-white border border-black/[0.08] rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-[#6b7280] mb-1">
                Cotización activa · {SOURCES.find(s => s.id === source)?.label}
              </p>
              {loading && !isManual ? (
                <div className="flex items-center gap-2 text-[#6b7280] py-2">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-sm">Cargando...</span>
                </div>
              ) : displayRate ? (
                <>
                  <p className="text-4xl font-bold text-[#0f0f12] tabular-nums tracking-tight">
                    ARS ${displayRate.toLocaleString("es-AR")}
                  </p>
                  {!isManual && currentAutoRate && (
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-[#6b7280]">Compra: <span className="text-[#374151]">${currentAutoRate.compra.toLocaleString("es-AR")}</span></span>
                      <span className="text-xs text-[#6b7280]">Venta: <span className="text-[#374151]">${currentAutoRate.venta.toLocaleString("es-AR")}</span></span>
                    </div>
                  )}
                  {!isManual && updatedAt && (
                    <p className="text-xs text-[#9ca3af] mt-1">Actualizado hoy a las {formatTime(updatedAt)}</p>
                  )}
                  {isManual && (
                    <p className="text-xs text-[#9ca3af] mt-1">Valor ingresado manualmente</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-[#6b7280] py-2">
                  {isManual ? "Ingresá el valor manual abajo" : "No se pudo obtener la cotización"}
                </p>
              )}
            </div>
            {!isManual && (
              <button
                onClick={fetchRates}
                className="p-2 rounded-lg hover:bg-black/[0.05] text-[#9ca3af] hover:text-[#374151] transition-colors"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            )}
          </div>

          {/* All auto rates grid */}
          {rates && !loading && !isManual && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-4 border-t border-black/[0.08]">
              {SOURCES.filter(s => s.id !== "manual").map(s => {
                const r = rates[s.id]
                if (!r) return null
                return (
                  <div key={s.id} className="bg-[#faf8ff] rounded-lg px-3 py-2">
                    <p className="text-[10px] text-[#9ca3af] mb-0.5">{s.label}</p>
                    <p className="text-sm font-semibold text-[#0f0f12]">${r.venta?.toLocaleString("es-AR")}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Source selector */}
        <div className="bg-white border border-black/[0.08] rounded-xl p-5">
          <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-3">
            Cotización usada en los cálculos
          </p>
          <div className="space-y-2">
            {SOURCES.map((s) => (
              <label
                key={s.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  source === s.id
                    ? "border-[#7c3aed]/40 bg-[#7c3aed]/5"
                    : "border-black/[0.08] hover:bg-black/[0.04]"
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
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${source === s.id ? "border-[#7c3aed]" : "border-black/[0.15]"}`}>
                  {source === s.id && <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />}
                </span>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${source === s.id ? "text-[#0f0f12]" : "text-[#374151]"}`}>
                    {s.label}
                  </p>
                  <p className="text-xs text-[#9ca3af]">{s.desc}</p>
                </div>
                {s.id !== "manual" && rates?.[s.id] && (
                  <span className="text-xs text-[#6b7280] font-mono">
                    ${rates[s.id].venta?.toLocaleString("es-AR")}
                  </span>
                )}
                {s.id === "manual" && manualSaved && (
                  <span className="text-xs text-[#6b7280] font-mono">
                    ${parseFloat(manualValue.replace(",", ".")).toLocaleString("es-AR")}
                  </span>
                )}
              </label>
            ))}
          </div>

          {/* Manual input — shown when "Manual" is selected */}
          {isManual && (editingManual || !manualSaved) && (
            <div className="mt-3 pt-3 border-t border-black/[0.08]">
              <p className="text-xs text-[#6b7280] mb-2">Ingresá el tipo de cambio (ARS por 1 USD)</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 flex-1 bg-white border border-black/[0.10] rounded-lg px-3 py-2.5">
                  <span className="text-xs text-[#9ca3af] font-medium">ARS $</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="ej. 1435"
                    value={manualValue}
                    onChange={e => setManualValue(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && saveManual()}
                    className="flex-1 bg-transparent text-sm text-[#0f0f12] placeholder:text-[#9ca3af] outline-none tabular-nums"
                    autoFocus
                  />
                </div>
                <button
                  onClick={saveManual}
                  disabled={!manualValue}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <CheckCircle2 size={13} />
                  Guardar
                </button>
              </div>
            </div>
          )}

          {/* Saved manual — show edit option */}
          {isManual && manualSaved && !editingManual && (
            <div className="mt-3 pt-3 border-t border-black/[0.08] flex items-center justify-between">
              <p className="text-xs text-[#6b7280]">
                Usando <span className="text-[#374151] font-medium">
                  ARS ${parseFloat(manualValue.replace(",", ".")).toLocaleString("es-AR")}
                </span> por USD
              </p>
              <button
                onClick={() => setEditingManual(true)}
                className="flex items-center gap-1 text-xs text-[#7c3aed] hover:text-[#6d28d9] transition-colors"
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
