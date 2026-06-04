"use client"

import { useState } from "react"
import { ArrowUpDown, Download, FileText, X, ExternalLink, Copy, Check } from "lucide-react"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import type { Order } from "@/types"

interface OrdersTableProps {
  orders: Order[]
}

const TiendanubeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C8.5 2 6 4.5 6 8C4.5 8 2 9.5 2 12C2 14.8 4.2 17 7 17H17C19.8 17 22 14.8 22 12C22 9.4 20 7.2 17.5 7C17 4.2 14.8 2 12 2Z" fill="currentColor" className="text-cyan-400" opacity="0.8"/>
  </svg>
)

const ShopifyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 50 57" fill="currentColor" className="text-green-400">
    <path d="M43.6 10.8c0-.3-.3-.5-.5-.5s-4.2-.3-4.2-.3-2.8-2.7-3.1-3c-.3-.3-.9-.2-1.1-.1 0 0-.5.2-1.4.4-.8-2.4-2.3-4.6-4.9-4.6h-.2C27.4 1.1 26 .5 24.8.5c-9.6 0-14.2 12-15.6 18.1l-6.7 2.1c-2.1.7-2.1.7-2.4 2.6L.1 50.4l35.9 6.7 19.4-4.2L43.6 10.8zM31.2 8.4c-.9.3-1.9.6-3 .9V8.9c0-1.5-.2-2.7-.5-3.7 1.3.2 2.2 1.6 3.5 3.2zM25.2 4c.3 1 .5 2.4.5 4.3v.3l-6.2 1.9C20.8 6.2 23 4.3 25.2 4zM19.7 1.8c.4 0 .8.1 1.1.3-2.8 1.3-5.7 4.6-7 11.3l-5.2 1.6C10 9.5 14 1.8 19.7 1.8z"/>
  </svg>
)

const statusColors: Record<Order["status"], string> = {
  paid:      "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  pending:   "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
  refunded:  "bg-white/[0.06] text-white/40 border-white/10",
}

const statusLabels: Record<Order["status"], string> = {
  paid:      "Pagado",
  pending:   "Pendiente",
  cancelled: "Cancelado",
  refunded:  "Reembolsado",
}

const PAGE_SIZE_OPTIONS = [5, 10, 20]

// ─── Drawer ──────────────────────────────────────────────────────────────────

function OrderDrawer({ order, onClose }: { order: Order; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  const margin = order.totalOrder > 0 ? (order.totalNet / order.totalOrder) * 100 : 0

  const platformUrl =
    order.origin === "shopify"
      ? `https://admin.shopify.com/orders`
      : order.origin === "tiendanube"
      ? `https://mitiendanube.com/admin/orders/${order.id}`
      : null

  function copyId() {
    navigator.clipboard.writeText(order.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[320px] bg-[#0a1120] border-l border-white/[0.08] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Detalle de Orden</p>
            <p className="text-sm font-semibold text-white font-mono">#{order.id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/30 hover:text-white/70 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Status */}
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <span className={cn("inline-flex text-xs font-semibold px-2.5 py-1 rounded-lg border", statusColors[order.status])}>
            {statusLabels[order.status]}
          </span>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-4">
            {[
              { label: "Canal",        value: order.origin === "tiendanube" ? "Tiendanube" : order.origin === "shopify" ? "Shopify" : order.origin },
              { label: "Fecha",        value: formatDate(order.createdAt) },
              { label: "Total Orden",  value: formatCurrency(order.totalOrder) },
              { label: "Total Neto",   value: formatCurrency(order.totalNet) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <p className="text-xs text-white/40">{label}</p>
                <p className="text-sm text-white/80">{value}</p>
              </div>
            ))}

            {/* Margin bar */}
            <div className="pt-1">
              <div className="flex justify-between text-[10px] mb-1.5">
                <span className="text-white/30">Margen bruto estimado</span>
                <span className={margin >= 40 ? "text-emerald-400" : margin >= 20 ? "text-yellow-400" : "text-red-400"}>
                  {margin.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", margin >= 40 ? "bg-emerald-500" : margin >= 20 ? "bg-yellow-500" : "bg-red-500")}
                  style={{ width: `${Math.min(Math.max(margin, 0), 100)}%` }}
                />
              </div>
            </div>

            {/* Desglose */}
            <div className="pt-2 border-t border-white/[0.06]">
              <p className="text-[10px] text-white/25 uppercase tracking-wider mb-3">Desglose</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Subtotal (facturado)</span>
                  <span className="text-white/60">{formatCurrency(order.totalOrder)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Neto (sin impuestos estimados)</span>
                  <span className="text-white/60">{formatCurrency(order.totalNet)}</span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-white/[0.04]">
                  <span className="text-white/40">Diferencia (impuestos/fees est.)</span>
                  <span className="text-white/50">{formatCurrency(order.totalOrder - order.totalNet)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-white/[0.06] space-y-2">
          <button
            onClick={copyId}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-white/[0.08] text-xs text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-colors"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            {copied ? "¡Copiado!" : "Copiar ID de orden"}
          </button>
          {platformUrl && (
            <a
              href={platformUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#4f8ef7] hover:bg-[#4f8ef7]/90 text-white text-xs font-medium transition-colors"
            >
              <ExternalLink size={12} />
              Ver en {order.origin === "shopify" ? "Shopify" : "Tiendanube"}
            </a>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Table ───────────────────────────────────────────────────────────────────

export function OrdersTable({ orders }: OrdersTableProps) {
  const [page, setPage]           = useState(1)
  const [pageSize, setPageSize]   = useState(5)
  const [sortField, setSortField] = useState<keyof Order>("createdAt")
  const [sortDir, setSortDir]     = useState<"asc" | "desc">("desc")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [filter, setFilter]       = useState("")

  const filtered = orders.filter(o =>
    !filter || o.id.toLowerCase().includes(filter.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) => {
    let av: string | number = a[sortField] as string | number
    let bv: string | number = b[sortField] as string | number
    if (sortDir === "desc") [av, bv] = [bv, av]
    return av > bv ? 1 : -1
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize)

  function toggleSort(field: keyof Order) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortField(field); setSortDir("desc") }
  }

  function exportCSV() {
    const headers = ["ID", "Origen", "Estado", "Fecha", "Total Orden", "Total Neto"]
    const rows = sorted.map(o => [o.id, o.origin, o.status, o.createdAt, o.totalOrder.toFixed(2), o.totalNet.toFixed(2)])
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = "ordenes.csv"
    a.click()
  }

  return (
    <>
      {selectedOrder && <OrderDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} />}

      <div className="bg-[#0f1825] border border-white/[0.06] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-white/[0.06]"><FileText size={13} className="text-white/50" /></div>
            <h3 className="text-sm font-medium text-white">Últimas ventas</h3>
            {filter && <span className="text-[10px] text-white/30">{sorted.length} resultado{sorted.length !== 1 ? "s" : ""}</span>}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Filtrar por Id Orden..."
              value={filter}
              onChange={e => { setFilter(e.target.value); setPage(1) }}
              className="text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-white/60 placeholder:text-white/25 focus:outline-none focus:border-white/20 w-44"
            />
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 transition-colors"
            >
              <Download size={11} />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {[
                  { label: "Id Orden", field: "id" },
                  { label: "Origen", field: "origin" },
                  { label: "Estado", field: "status" },
                  { label: "Fecha Creación", field: "createdAt" },
                  { label: "Total Orden", field: "totalOrder" },
                  { label: "Total Neto", field: "totalNet" },
                  { label: "", field: null },
                ].map(({ label, field }) => (
                  <th
                    key={label}
                    className={cn("px-5 py-3 text-left text-[11px] font-medium text-white/30", field && "cursor-pointer select-none hover:text-white/50")}
                    onClick={() => field && toggleSort(field as keyof Order)}
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      {field && <ArrowUpDown size={10} className="opacity-40" />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-xs text-white/30">No se encontraron órdenes</td>
                </tr>
              ) : paged.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <td className="px-5 py-3 text-white/70 font-mono text-xs">#{order.id}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5 text-white/50 text-xs">
                      {order.origin === "shopify" ? <ShopifyIcon /> : <TiendanubeIcon />}
                      <span className="capitalize">{order.origin === "tiendanube" ? "Tiendanube" : order.origin === "shopify" ? "Shopify" : order.origin}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md border", statusColors[order.status])}>
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-white/40 text-xs whitespace-nowrap">{formatDate(order.createdAt)}</td>
                  <td className="px-5 py-3 text-white/70 text-xs font-medium">{formatCurrency(order.totalOrder)}</td>
                  <td className="px-5 py-3 text-white/70 text-xs font-medium">{formatCurrency(order.totalNet)}</td>
                  <td className="px-5 py-3" onClick={e => { e.stopPropagation(); setSelectedOrder(order) }}>
                    <button className="flex items-center gap-1 text-[11px] text-white/40 hover:text-[#4f8ef7] transition-colors">
                      <FileText size={11} />
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
          <span className="text-xs text-white/30">{totalPages} página{totalPages !== 1 ? "s" : ""}</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/30">Filas por página</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="text-xs bg-white/[0.06] border border-white/[0.08] rounded px-2 py-1 text-white/60 focus:outline-none cursor-pointer"
              >
                {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-6 h-6 rounded text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.06] disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
                .map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={cn("w-6 h-6 rounded text-xs font-medium transition-colors",
                      p === page ? "bg-white/[0.12] text-white" : "text-white/40 hover:text-white/70 hover:bg-white/[0.06]"
                    )}>{p}</button>
                ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="w-6 h-6 rounded text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.06] disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center">›</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
