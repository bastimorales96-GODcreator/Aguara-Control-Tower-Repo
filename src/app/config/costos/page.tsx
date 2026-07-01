"use client"

import { useEffect, useState } from "react"
import { Plus, Loader2, Trash2, CheckCircle2, AlertCircle, Receipt } from "lucide-react"
import { cn } from "@/lib/utils"

interface Expense {
  id: string
  name: string
  amount: number
  currency: string
  category: string
  frequency: string
  date: string
  notes?: string
}

const CATEGORIES = [
  { value: "marketing", label: "Marketing" },
  { value: "logistica", label: "Logística" },
  { value: "tecnologia", label: "Tecnología" },
  { value: "honorarios", label: "Honorarios" },
  { value: "alquiler", label: "Alquiler" },
  { value: "otros", label: "Otros" },
]

const FREQUENCIES = [
  { value: "unico", label: "Único" },
  { value: "mensual", label: "Mensual" },
  { value: "anual", label: "Anual" },
]

const CATEGORY_COLORS: Record<string, string> = {
  marketing: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  logistica: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  tecnologia: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  honorarios: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  alquiler: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  otros: "bg-black/[0.05] text-[#6b7280] border-black/[0.10]",
}

const emptyForm = { name: "", amount: "", currency: "ARS", category: "otros", frequency: "mensual", date: new Date().toISOString().split("T")[0], notes: "" }

export default function CostosPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)

  useEffect(() => { fetchExpenses() }, [])

  async function fetchExpenses() {
    const res = await fetch("/api/expenses")
    const data = await res.json()
    setExpenses(data.expenses || [])
    setLoading(false)
  }

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleSave() {
    if (!form.name || !form.amount) return
    setSaving(true)
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { showToast(`Error: ${data.error}`, "error"); return }
    showToast("✅ Gasto registrado", "success")
    setForm(emptyForm)
    setShowForm(false)
    fetchExpenses()
  }

  async function handleDelete(id: string) {
    await fetch("/api/expenses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setExpenses(es => es.filter(e => e.id !== id))
  }

  const totalMensual = expenses
    .filter(e => e.frequency === "mensual")
    .reduce((sum, e) => sum + (e.currency === "ARS" ? e.amount : 0), 0)

  return (
    <div className="min-h-dvh overflow-x-hidden bg-white">
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-black/[0.08] bg-white/90 backdrop-blur-sm">
        <h1 className="text-sm font-medium text-[#0f0f12]">Gastos Operativos</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold transition-colors"
        >
          <Plus size={12} /> Registrar gasto
        </button>
      </header>

      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border",
          toast.type === "success"
            ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
            : "bg-red-500/20 border-red-500/30 text-red-300"
        )}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="px-4 lg:px-6 py-4 lg:py-6 max-w-[900px]">

        {/* Summary */}
        {expenses.length > 0 && (
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="bg-white border border-black/[0.08] rounded-xl px-5 py-4">
              <p className="text-xs text-[#6b7280] mb-1">Total mensual (ARS)</p>
              <p className="text-xl font-semibold text-[#0f0f12]">
                {totalMensual.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-white border border-black/[0.08] rounded-xl px-5 py-4">
              <p className="text-xs text-[#6b7280] mb-1">Cantidad de gastos</p>
              <p className="text-xl font-semibold text-[#0f0f12]">{expenses.length}</p>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="mb-5 p-4 bg-white border border-black/[0.08] rounded-xl">
            <p className="text-xs font-medium text-[#6b7280] mb-3">Nuevo gasto</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <input
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nombre del gasto (ej: Hosting, Contador...)"
                className="col-span-2 bg-white border border-black/[0.10] rounded-lg px-3 py-2 text-xs text-[#0f0f12] placeholder:text-[#9ca3af] outline-none focus:border-[#7c3aed]"
              />
              <div className="flex gap-2">
                <input
                  value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="Monto" type="number"
                  className="flex-1 bg-white border border-black/[0.10] rounded-lg px-3 py-2 text-xs text-[#0f0f12] placeholder:text-[#9ca3af] outline-none focus:border-[#7c3aed]"
                />
                <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                  className="w-20 bg-white border border-black/[0.10] rounded-lg px-2 py-2 text-xs text-[#374151] outline-none cursor-pointer">
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="bg-white border border-black/[0.10] rounded-lg px-3 py-2 text-xs text-[#374151] outline-none cursor-pointer">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                className="bg-white border border-black/[0.10] rounded-lg px-3 py-2 text-xs text-[#374151] outline-none cursor-pointer">
                {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              <input
                value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                type="date"
                className="bg-white border border-black/[0.10] rounded-lg px-3 py-2 text-xs text-[#374151] outline-none focus:border-[#7c3aed]"
              />
              <input
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notas (opcional)"
                className="bg-white border border-black/[0.10] rounded-lg px-3 py-2 text-xs text-[#0f0f12] placeholder:text-[#9ca3af] outline-none focus:border-[#7c3aed]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 rounded-lg text-[#6b7280] hover:text-[#0f0f12] transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold transition-colors disabled:opacity-50">
                {saving && <Loader2 size={11} className="animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center gap-2 text-[#6b7280] text-sm">
            <Loader2 size={14} className="animate-spin" /> Cargando gastos...
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Receipt size={32} className="text-[#9ca3af] mb-3" />
            <p className="text-sm font-medium text-[#6b7280] mb-1">Sin gastos registrados</p>
            <p className="text-xs text-[#9ca3af]">Registrá tus costos fijos y variables para calcular rentabilidad real.</p>
          </div>
        ) : (
          <div className="bg-white border border-black/[0.08] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.08]">
                  {["Nombre", "Categoría", "Monto", "Frecuencia", "Fecha", ""].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-medium text-[#9ca3af]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06]">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-black/[0.04] transition-colors">
                    <td className="px-5 py-3 text-xs text-[#0f0f12]">
                      {e.name}
                      {e.notes && <p className="text-[10px] text-[#9ca3af] mt-0.5">{e.notes}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize", CATEGORY_COLORS[e.category])}>
                        {CATEGORIES.find(c => c.value === e.category)?.label || e.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs font-medium text-[#374151]">
                      {e.currency} {e.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3 text-xs text-[#6b7280] capitalize">
                      {FREQUENCIES.find(f => f.value === e.frequency)?.label || e.frequency}
                    </td>
                    <td className="px-5 py-3 text-xs text-[#6b7280]">
                      {new Date(e.date).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleDelete(e.id)} className="text-[#9ca3af] hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
