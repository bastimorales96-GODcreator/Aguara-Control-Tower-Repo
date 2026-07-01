"use client"

import { useEffect, useRef, useState } from "react"
import { Upload, Loader2, Trash2, FileSpreadsheet, Plus, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  sku: string
  description: string
  cost_price: number
  iva_rate: number
  currency: string
  created_at: string
}

const IVA_OPTIONS = [10.5, 21]
const CURRENCY_OPTIONS = ["ARS", "USD"]

export default function ProductosConfigPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [form, setForm] = useState({ sku: "", description: "", cost_price: "", iva_rate: "21", currency: "ARS" })
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchProducts() }, [])

  async function syncFromStore() {
    setSyncing(true)
    try {
      const res = await fetch("/api/maestro/sync", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast(`✅ ${data.synced} productos sincronizados`, "success")
      fetchProducts()
    } catch (err: any) {
      showToast(err.message === "No store connected"
        ? "No hay tienda conectada. Conectá una en Integraciones."
        : `Error: ${err.message}`, "error")
    } finally {
      setSyncing(false)
    }
  }

  async function fetchProducts() {
    const res = await fetch("/api/products")
    const data = await res.json()
    setProducts(data.products || [])
    setLoading(false)
  }

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const rows = parseCSV(text)
      if (rows.length === 0) { showToast("El archivo no contiene datos válidos", "error"); setImporting(false); return }
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: rows }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast(`✅ ${data.inserted} productos importados`, "success")
      fetchProducts()
    } catch (err: any) {
      showToast(`Error: ${err.message}`, "error")
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  function parseCSV(text: string) {
    const lines = text.trim().split("\n")
    if (lines.length < 2) return []
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_"))
    return lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""))
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => { obj[h] = vals[i] || "" })
      return {
        sku: obj.sku,
        description: obj.descripcion || obj.description,
        cost_price: obj.precio_de_compra || obj.cost_price || "0",
        iva_rate: obj.alicuota_iva || obj.iva_rate || "21",
        currency: obj.cotizacion || obj.currency || "ARS",
      }
    }).filter(p => p.sku && p.description)
  }

  async function handleAddSingle() {
    if (!form.sku || !form.description) return
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: [form] }),
    })
    const data = await res.json()
    if (!res.ok) { showToast(`Error: ${data.error}`, "error"); return }
    showToast("✅ Producto agregado", "success")
    setForm({ sku: "", description: "", cost_price: "", iva_rate: "21", currency: "ARS" })
    setShowAddForm(false)
    fetchProducts()
  }

  async function handleDelete(id: string) {
    await fetch("/api/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setProducts(ps => ps.filter(p => p.id !== id))
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-white">
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-black/[0.08] bg-white/90 backdrop-blur-sm">
        <h1 className="text-sm font-medium text-[#0f0f12]">Maestro de Productos</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-black/[0.04] border border-black/[0.08] text-[#374151] hover:text-[#0f0f12] transition-colors"
          >
            <Plus size={12} /> Agregar uno
          </button>
          <button
            onClick={syncFromStore}
            disabled={syncing}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-black/[0.04] border border-black/[0.08] text-[#374151] hover:text-[#0f0f12] transition-colors disabled:opacity-50"
          >
            {syncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Sincronizar tienda
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold transition-colors disabled:opacity-50"
          >
            {importing ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            Importar CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
        </div>
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

      <div className="px-4 lg:px-6 py-4 lg:py-6 max-w-[1100px]">

        {/* CSV format hint */}
        <div className="mb-5 p-4 bg-[#faf8ff] border border-black/[0.08] rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <FileSpreadsheet size={13} className="text-[#6b7280]" />
            <span className="text-xs font-medium text-[#6b7280]">Formato CSV esperado</span>
          </div>
          <code className="text-[11px] text-[#9ca3af] font-mono">
            sku, descripcion, precio_de_compra, alicuota_iva, cotizacion<br />
            SKU001, Remera Básica, 1500, 21, ARS<br />
            SKU002, Pantalón Jean, 25, 21, USD
          </code>
        </div>

        {/* Add single form */}
        {showAddForm && (
          <div className="mb-5 p-4 bg-white border border-black/[0.08] rounded-xl">
            <p className="text-xs font-medium text-[#6b7280] mb-3">Nuevo producto</p>
            <div className="grid grid-cols-5 gap-3">
              <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                placeholder="SKU" className="bg-white border border-black/[0.10] rounded-lg px-3 py-2 text-xs text-[#0f0f12] placeholder:text-[#9ca3af] outline-none focus:border-[#7c3aed]" />
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descripción" className="col-span-2 bg-white border border-black/[0.10] rounded-lg px-3 py-2 text-xs text-[#0f0f12] placeholder:text-[#9ca3af] outline-none focus:border-[#7c3aed]" />
              <input value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))}
                placeholder="Costo" type="number" className="bg-white border border-black/[0.10] rounded-lg px-3 py-2 text-xs text-[#0f0f12] placeholder:text-[#9ca3af] outline-none focus:border-[#7c3aed]" />
              <div className="flex gap-2">
                <select value={form.iva_rate} onChange={e => setForm(f => ({ ...f, iva_rate: e.target.value }))}
                  className="flex-1 bg-white border border-black/[0.10] rounded-lg px-2 py-2 text-xs text-[#374151] outline-none cursor-pointer">
                  {IVA_OPTIONS.map(v => <option key={v} value={v}>IVA {v}%</option>)}
                </select>
                <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                  className="flex-1 bg-white border border-black/[0.10] rounded-lg px-2 py-2 text-xs text-[#374151] outline-none cursor-pointer">
                  {CURRENCY_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setShowAddForm(false)} className="text-xs px-3 py-1.5 rounded-lg text-[#6b7280] hover:text-[#0f0f12] transition-colors">Cancelar</button>
              <button onClick={handleAddSingle}
                className="text-xs px-3 py-1.5 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold transition-colors">
                Guardar
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center gap-2 text-[#6b7280] text-sm">
            <Loader2 size={14} className="animate-spin" /> Cargando productos...
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileSpreadsheet size={32} className="text-[#9ca3af] mb-3" />
            <p className="text-sm font-medium text-[#6b7280] mb-1">Sin productos cargados</p>
            <p className="text-xs text-[#9ca3af]">Importá un CSV o agregá productos manualmente.</p>
          </div>
        ) : (
          <div className="bg-white border border-black/[0.08] rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-black/[0.08]">
              <span className="text-xs text-[#6b7280]">{products.length} productos</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.08]">
                  {["SKU", "Descripción", "Costo", "IVA", "Moneda", ""].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-medium text-[#9ca3af]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06]">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-black/[0.04] transition-colors">
                    <td className="px-5 py-3 text-xs font-mono text-[#374151]">{p.sku}</td>
                    <td className="px-5 py-3 text-xs text-[#0f0f12]">{p.description}</td>
                    <td className="px-5 py-3 text-xs text-[#374151]">{p.cost_price.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/[0.05] text-[#6b7280] border border-black/[0.08]">
                        {p.iva_rate}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-[#6b7280]">{p.currency}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleDelete(p.id)} className="text-[#9ca3af] hover:text-red-400 transition-colors">
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
