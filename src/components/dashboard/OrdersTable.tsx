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
  refunded:  "bg-black/[0.05] text-[#6b7280] border-black/[0.10]",
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
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[320px] bg-[#faf7ff] border-l border-black/[0.08] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.08]">
          <div>
            <p className="text-[10px] text-[#9ca3af] uppercase tracking-wider mb-0.5">Detalle de Orden</p>
            <p className="text-sm font-semibold text-[#0f0f12] font-mono">#{order.id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/[0.06] text-[#9ca3af] hover:text-[#374151] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Status */}
        <div className="px-5 py-3 border-b border-black/[0.08]">
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
                <p className="text-xs text-[#6b7280]">{label}</p>
                <p className="text-sm text-[#0f0f12]">{value}</p>
              </div>
            ))}

            {/* Margin bar */}
            <div className="pt-1">
              <div className="flex justify-between text-[10px] mb-1.5">
                <span className="text-[#9ca3af]">Margen bruto estimado</span>
                <span className={margin >= 40 ? "text-emerald-400" : margin >= 20 ? "text-yellow-400" : "text-red-400"}>
                  {margin.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 bg-black/[0.05] rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", margin >= 40 ? "bg-emerald-500" : margin >= 20 ? "bg-yellow-500" : "bg-red-500")}
                  style={{ width: `${Math.min(Math.max(margin, 0), 100)}%` }}
                />
              </div>
            </div>

            {/* Desglose */}
            <div className="pt-2 border-t border-black/[0.08]">
              <p className="text-[10px] text-[#9ca3af] uppercase tracking-wider mb-3">Desglose</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#6b7280]">Subtotal (facturado)</span>
                  <span className="text-[#374151]">{formatCurrency(order.totalOrder)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#6b7280]">Neto (sin impuestos estimados)</span>
                  <span className="text-[#374151]">{formatCurrency(order.totalNet)}</span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-black/[0.06]">
                  <span className="text-[#6b7280]">Diferencia (impuestos/fees est.)</span>
                  <span className="text-[#6b7280]">{formatCurrency(order.totalOrder - order.totalNet)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-black/[0.08] space-y-2">
          <button
            onClick={copyId}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-black/[0.08] text-xs text-[#6b7280] hover:text-[#0f0f12] hover:bg-black/[0.04] transition-colors"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            {copied ? "¡Copiado!" : "Copiar ID de orden"}
          </button>
          {platformUrl && (
            <a
              href={platformUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-medium transition-colors"
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

      <div className="bg-white border border-black/[0.08] rounded-xl overflow-hidden">
        {/* Header — flex-col en mobile para no comprimir */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-4 border-b border-black/[0.08]">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-black/[0.05]"><FileText size={13} className="text-[#6b7280]" /></div>
            <h3 className="text-sm font-medium text-[#0f0f12]">Últimas ventas</h3>
            {filter && <span className="text-[10px] text-[#9ca3af]">{sorted.length} resultado{sorted.length !== 1 ? "s" : ""}</span>}
          </div>
          <div className="flex items-center gap-2">
            {/* text-base 16px → evita zoom iOS; h-9 → touch target ok con min-width */}
            <input
              type="text"
              placeholder="Filtrar por Id..."
              value={filter}
              onChange={e => { setFilter(e.target.value); setPage(1) }}
              inputMode="search"
              autoComplete="off"
              className="text-base sm:text-xs bg-black/[0.04] border border-black/[0.08] rounded-lg px-3 h-9 text-[#374151] placeholder:text-[#9ca3af] focus:outline-none focus:border-black/[0.15] flex-1 sm:w-44 sm:flex-initial touch-manipulation"
            />
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 text-xs text-[#6b7280] hover:text-[#0f0f12] bg-black/[0.04] border border-black/[0.08] rounded-lg px-3 h-9 transition-colors touch-manipulation shrink-0"
            >
              <Download size={11} />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Table — overflow-x-auto previene layout shift horizontal en mobile */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/[0.08]">
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
                    className={cn("px-5 py-3 text-left text-[11px] font-medium text-[#9ca3af]", field && "cursor-pointer select-none hover:text-[#374151]")}
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
            <tbody className="divide-y divide-black/[0.06]">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-xs text-[#9ca3af]">No se encontraron órdenes</td>
                </tr>
              ) : paged.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-black/[0.04] transition-colors cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <td className="px-5 py-3 text-[#374151] font-mono text-xs">#{order.id}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5 text-[#6b7280] text-xs">
                      {order.origin === "shopify" ? <ShopifyIcon /> : <TiendanubeIcon />}
                      <span className="capitalize">{order.origin === "tiendanube" ? "Tiendanube" : order.origin === "shopify" ? "Shopify" : order.origin}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md border", statusColors[order.status])}>
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#6b7280] text-xs whitespace-nowrap">{formatDate(order.createdAt)}</td>
                  <td className="px-5 py-3 text-[#374151] text-xs font-medium">{formatCurrency(order.totalOrder)}</td>
                  <td className="px-5 py-3 text-[#374151] text-xs font-medium">{formatCurrency(order.totalNet)}</td>
                  <td className="px-5 py-3" onClick={e => { e.stopPropagation(); setSelectedOrder(order) }}>
                    <button className="flex items-center gap-1 text-[11px] text-[#6b7280] hover:text-[#7c3aed] transition-colors">
                      <FileText size={11} />
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination — botones h-9 w-9 para touch targets ≥44px (con padding visual) */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-black/[0.08] gap-2 flex-wrap">
          <span className="text-xs text-[#9ca3af]">{totalPages} página{totalPages !== 1 ? "s" : ""}</span>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-[#9ca3af]">Filas</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                // text-base 16px → evita zoom iOS
                className="text-base sm:text-xs bg-black/[0.05] border border-black/[0.08] rounded h-8 px-2 text-[#374151] focus:outline-none cursor-pointer touch-manipulation"
              >
                {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              {/* Botones de paginación: h-9 w-9 para touch target */}
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-9 h-9 rounded text-sm text-[#6b7280] hover:text-[#374151] hover:bg-black/[0.06] disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center touch-manipulation">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
                .map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={cn("w-9 h-9 rounded text-xs font-medium transition-colors touch-manipulation",
                      p === page ? "bg-[#f3e8ff] text-[#0f0f12]" : "text-[#6b7280] hover:text-[#374151] hover:bg-black/[0.06]"
                    )}>{p}</button>
                ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="w-9 h-9 rounded text-sm text-[#6b7280] hover:text-[#374151] hover:bg-black/[0.06] disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center touch-manipulation">›</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
