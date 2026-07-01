"use client"

export const dynamic = "force-dynamic"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  CheckCircle2, AlertCircle, ExternalLink, Loader2, Key, X,
  Trash2, Store, RefreshCw, BarChart3,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoreConnection {
  id: string
  platform: string
  store_id: string
  store_name: string
  store_url: string
  created_at: string
}

interface ConnectorAccount {
  id: string
  platform: string
  external_account_id: string
  account_name: string
  status: string
}

// ─── SVG logos ────────────────────────────────────────────────────────────────

const PlatformLogo = ({ id }: { id: string }) => {
  if (id === "tiendanube") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <path d="M20 7C15 7 11 10.8 10.2 15.7C7.3 16.2 5 18.7 5 21.8C5 25.2 7.8 28 11.2 28H28.8C32.2 28 35 25.2 35 21.8C35 18.5 32.5 15.9 29.3 15.6C28.5 10.8 24.6 7 20 7Z" fill="white" opacity="0.95"/>
    </svg>
  )
  if (id === "shopify") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <path d="M27.2 9.4C27 9.1 26.7 9 26.5 9C26.3 9 24.3 8.9 24.3 8.9C24.3 8.9 22.4 7 22.2 6.8C22 6.6 21.6 6.6 21.4 6.7L20 7.1C19.6 6 18.8 5 17.5 5C17.3 5 17.2 5 17 5C16.6 4.5 16 4.1 15.4 4.1C11.6 4.1 9.7 8.7 9.2 11L6.6 11.8C5.8 12 5.8 12.1 5.7 12.8L3.5 31.2L21.4 34.5L32.5 31.9L27.2 9.4ZM18.4 7.8C18.2 7.9 18 8 17.8 8.1C17.8 8 17.9 8 17.9 7.9C17.9 7 17.6 6.1 17.1 5.4C18 5.6 18.3 6.9 18.4 7.8ZM16.1 5.5C16.4 5.5 16.6 5.6 16.8 5.7C16.2 6.4 16 7.4 15.9 8.2L13.4 8.9C13.9 7.1 15.1 5.5 16.1 5.5ZM17.6 18.9C17.4 18.8 17.1 18.7 16.8 18.6C15.7 18.2 14.8 17.9 14.8 17C14.8 16.2 15.5 15.7 16.5 15.7C17.6 15.7 18.5 16.2 18.5 16.2L19.1 14.3C19.1 14.3 18 13.7 16.5 13.7C13.8 13.7 12 15.3 12 17.3C12 19.5 13.8 20.3 15.4 20.9C16.5 21.3 17.1 21.6 17.1 22.4C17.1 23.1 16.5 23.6 15.4 23.6C13.9 23.6 12.9 22.9 12.9 22.9L12.2 24.8C12.2 24.8 13.3 25.6 15.3 25.6C18 25.6 20 24.1 20 21.9C20 19.7 18.2 18.9 17.6 18.9Z" fill="white" opacity="0.95"/>
    </svg>
  )
  if (id === "mercadolibre") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <text x="20" y="26" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="15" fill="#2D3277">ML</text>
    </svg>
  )
  if (id === "milonga") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <rect x="7" y="13" width="11" height="11" rx="2" fill="white" opacity="0.95"/>
      <rect x="22" y="13" width="11" height="11" rx="2" fill="white" opacity="0.55"/>
      <rect x="14.5" y="25" width="11" height="9" rx="2" fill="white" opacity="0.8"/>
    </svg>
  )
  if (id === "meta_ads") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <path d="M23 9h-3.5C16 9 14 11 14 14.5V18h-3v5h3v12h5V23h3.5l.5-5H19v-3c0-1 .5-1.5 1.5-1.5H23V9Z" fill="white"/>
    </svg>
  )
  if (id === "google_ads") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <rect x="2" y="2" width="36" height="36" rx="8" fill="white"/>
      <text x="21" y="31" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="26" fontWeight="bold" fill="#4285F4">G</text>
    </svg>
  )
  // Google Analytics 4 — chart bars with GA colors
  if (id === "google_analytics") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <rect x="5"  y="22" width="8"  height="13" rx="2" fill="#F9AB00"/>
      <rect x="16" y="13" width="8"  height="22" rx="2" fill="#E37400"/>
      <rect x="27" y="6"  width="8"  height="29" rx="2" fill="white" opacity="0.95"/>
    </svg>
  )
  if (id === "tiktok_ads") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <rect x="17" y="7" width="5" height="20" rx="2.5" fill="white"/>
      <rect x="17" y="7" width="13" height="5" rx="2" fill="white"/>
      <circle cx="17" cy="30" r="5" fill="white"/>
    </svg>
  )
  if (id === "pinterest_ads") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <path d="M20 4C11.2 4 4 11.2 4 20C4 26.8 8.2 32.6 14.2 34.9C14.1 34 14 32.6 14.2 31.5L15.8 24.7C15.8 24.7 15.3 23.8 15.3 22.4C15.3 20.2 16.6 18.6 18.2 18.6C19.6 18.6 20.3 19.6 20.3 20.9C20.3 22.3 19.4 24.4 18.9 26.4C18.5 28 19.7 29.4 21.3 29.4C24.2 29.4 26.4 26.3 26.4 21.8C26.4 17.8 23.6 15 19.5 15C14.8 15 12.1 18.5 12.1 22.1C12.1 23.5 12.6 25 13.4 25.9C13.5 26.1 13.5 26.3 13.5 26.5L12.9 28.9C12.8 29.2 12.6 29.3 12.3 29.2C10.2 28.2 8.9 25.3 8.9 22C8.9 16.4 13 11.2 20.1 11.2C25.7 11.2 30.1 15.2 30.1 21.7C30.1 28.5 26 33.9 20.1 33.9C18.4 33.9 16.8 33 16.3 32L15.3 35.5C14.9 37 13.9 38.9 13.2 40C15.4 40.6 17.7 41 20 41C28.8 41 36 33.8 36 25C36 16.2 28.8 4 20 4Z" fill="white" opacity="0.95"/>
    </svg>
  )
  if (id === "klaviyo") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <path d="M13 8H17V20L26 8H31L22 20L31 32H26L17 20V32H13V8Z" fill="white" opacity="0.95"/>
    </svg>
  )
  if (id === "perfit") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <path d="M12 8H22C26.4 8 29 10.5 29 14.5C29 18.5 26.4 21 22 21H16V32H12V8ZM16 17.5H21.5C23.5 17.5 25 16.5 25 14.5C25 12.5 23.5 11.5 21.5 11.5H16V17.5Z" fill="white" opacity="0.95"/>
    </svg>
  )
  return <span className="text-xs font-black text-white">{id.slice(0, 2).toUpperCase()}</span>
}

// ─── Integration definitions ──────────────────────────────────────────────────

const storeIntegrations = [
  {
    id: "tiendanube", name: "Tiendanube",
    description: "Sincronizá órdenes, productos e inventario en tiempo real.",
    logoBg: "#00b140", connectUrl: "/api/auth/tiendanube/connect",
    type: "oauth_redirect" as const, available: true,
  },
  {
    id: "shopify", name: "Shopify",
    description: "Conectá tu tienda Shopify para ver ventas y métricas.",
    logoBg: "#96bf48", connectUrl: "/api/auth/shopify/connect",
    type: "shopify_input" as const, available: true,
  },
  {
    id: "mercadolibre", name: "MercadoLibre",
    description: "Integrá tus ventas de MercadoLibre al dashboard.",
    logoBg: "#ffe600", connectUrl: "/api/auth/mercadolibre/connect",
    type: "oauth_redirect" as const, available: true,
  },
]

const omsIntegrations = [
  {
    id: "milonga", name: "Milonga",
    description: "Conectá el OMS de Iflow para sincronizar fulfillment y estado de órdenes.",
    logoBg: "#4338ca", connectUrl: "/api/auth/milonga/connect",
    type: "oauth_redirect" as const, available: false,
  },
]

const adsIntegrations = [
  {
    id: "meta_ads", name: "Meta Ads",
    description: "Importá el rendimiento de tus campañas de Facebook e Instagram.",
    logoBg: "#1877f2", connectUrl: "/api/auth/meta/connect",
    type: "oauth_popup" as const, available: true,
  },
  {
    id: "google_ads", name: "Google Ads",
    description: "Conectá Google Ads para ver spend, CPA y ROAS por campaña.",
    logoBg: "#f8f9fa", connectUrl: "/api/auth/google-ads/connect",
    type: "oauth_popup" as const, available: true,
  },
  {
    id: "tiktok_ads", name: "TikTok Ads",
    description: "Conectá TikTok for Business para ver métricas de campañas.",
    logoBg: "#010101", connectUrl: "#",
    type: "oauth_popup" as const, available: false,
  },
  {
    id: "pinterest_ads", name: "Pinterest Ads",
    description: "Importá el rendimiento de tus campañas de Pinterest.",
    logoBg: "#e60023", connectUrl: "#",
    type: "oauth_popup" as const, available: false,
  },
]

const analyticsIntegrations = [
  {
    id: "google_analytics", name: "Google Analytics 4",
    description: "Conectá GA4 para ver sesiones, usuarios, conversiones y fuente de tráfico.",
    logoBg: "#E37400", connectUrl: "/api/connectors/google-analytics",
    type: "ga4_input" as const, available: true,
    docsUrl: "https://support.google.com/analytics/answer/9304153",
  },
]

const emailIntegrations = [
  {
    id: "klaviyo", name: "Klaviyo",
    description: "Conectá Klaviyo para cruzar métricas de email con ventas.",
    logoBg: "#1a1a1a", connectUrl: "/api/connectors/klaviyo",
    type: "api_key" as const, available: true,
    placeholder: "pk_...",
    docsUrl: "https://help.klaviyo.com/hc/en-us/articles/7423954176283",
  },
  {
    id: "perfit", name: "Perfit",
    description: "Integrá Perfit para ver el rendimiento de tus campañas de email.",
    logoBg: "#e84040", connectUrl: "/api/connectors/perfit",
    type: "api_key" as const, available: true,
    placeholder: "Tu API Key de Perfit",
    docsUrl: "https://api.myperfit.com/docs",
  },
]

// ─── Manage Store Modal ────────────────────────────────────────────────────────

interface ManageStoreModalProps {
  conn: StoreConnection
  integrationName: string
  logoBg: string
  onClose: () => void
  onDisconnect: () => void
}

function ManageStoreModal({ conn, integrationName, logoBg, onClose, onDisconnect }: ManageStoreModalProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDisconnect() {
    setLoading(true)
    const res = await fetch("/api/connectors/store", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: conn.platform }),
    })
    setLoading(false)
    if (res.ok) {
      onDisconnect()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white border border-black/[0.08] rounded-2xl w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: logoBg }}>
              <PlatformLogo id={conn.platform} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0f0f12]">{integrationName}</p>
              <p className="text-[11px] text-emerald-600">Conectado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-[#6b7280] hover:bg-black/[0.03] transition-colors touch-manipulation"
          >
            <X size={16} />
          </button>
        </div>

        {/* Store info */}
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9ca3af]">Tienda</span>
            <span className="text-xs text-[#0f0f12] font-medium">{conn.store_name || "—"}</span>
          </div>
          {conn.store_url && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9ca3af]">URL</span>
              <a
                href={`https://${conn.store_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[#7c3aed] hover:underline"
              >
                {conn.store_url}
                <ExternalLink size={10} />
              </a>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9ca3af]">Conectado el</span>
            <span className="text-xs text-[#6b7280]">
              {new Date(conn.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 space-y-3">
          {!confirming ? (
            <>
              {/* Reconectar */}
              <button
                onClick={onClose}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-black/[0.03] border border-black/[0.08] text-sm text-[#6b7280] hover:text-[#0f0f12] hover:bg-black/[0.06] transition-colors touch-manipulation"
              >
                <RefreshCw size={14} />
                Reconectar tienda
              </button>
              {/* Desconectar */}
              <button
                onClick={() => setConfirming(true)}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-sm text-red-600 hover:bg-red-500/[0.15] transition-colors touch-manipulation"
              >
                <Trash2 size={14} />
                Desconectar tienda
              </button>
            </>
          ) : (
            <>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-center">
                <p className="text-sm font-semibold text-red-600 mb-1">¿Desconectar {integrationName}?</p>
                <p className="text-xs text-[#9ca3af]">
                  Se eliminarán las credenciales. Los datos históricos se mantienen en Aguara.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 h-11 rounded-xl bg-black/[0.03] border border-black/[0.08] text-sm text-[#6b7280] hover:text-[#0f0f12] transition-colors touch-manipulation"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-semibold text-white transition-colors disabled:opacity-60 touch-manipulation flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Sí, desconectar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Account selection modal ──────────────────────────────────────────────────

interface DiscoveredAccount { id: string; name: string; currency: string }

function AccountSelectionModal({
  platform, discoveryId, onClose, onConnected,
}: {
  platform: string; discoveryId: string; onClose: () => void; onConnected: () => void
}) {
  const [accounts, setAccounts] = useState<DiscoveredAccount[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("oauth_discoveries").select("accounts").eq("id", discoveryId).single()
      setAccounts((data?.accounts as DiscoveredAccount[]) ?? [])
      setLoading(false)
    }
    load()
  }, [discoveryId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleConnect() {
    if (selected.size === 0) return
    setSaving(true)
    const res = await fetch("/api/connectors/select-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discoveryId, accountIds: Array.from(selected) }),
    })
    setSaving(false)
    if (res.ok) { onConnected(); onClose() }
  }

  const platformLabel = platform === "meta_ads" ? "Meta Ads" : "Google Ads"

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white border border-black/[0.08] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.08]">
          <h3 className="text-sm font-semibold text-[#0f0f12]">
            Cuentas de {platformLabel}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-[#6b7280] hover:bg-black/[0.03] transition-colors touch-manipulation">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">
          {loading ? (
            <div className="flex items-center gap-2 text-[#9ca3af] text-sm py-4">
              <Loader2 size={14} className="animate-spin" /> Cargando cuentas...
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-[#9ca3af] py-4">No se encontraron cuentas.</p>
          ) : (
            <div className="flex flex-col gap-2 mb-5 max-h-64 overflow-y-auto">
              {accounts.map((account) => (
                <label
                  key={account.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors",
                    selected.has(account.id)
                      ? "bg-[#7c3aed]/10 border-[#7c3aed]/40"
                      : "bg-black/[0.03] border-black/[0.08] hover:bg-black/[0.06]"
                  )}
                >
                  <input
                    type="checkbox"
                    className="accent-[#7c3aed]"
                    checked={selected.has(account.id)}
                    onChange={() => {
                      const s = new Set(selected)
                      s.has(account.id) ? s.delete(account.id) : s.add(account.id)
                      setSelected(s)
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#0f0f12] truncate">{account.name}</p>
                    <p className="text-xs text-[#9ca3af]">{account.id} · {account.currency}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl bg-black/[0.03] border border-black/[0.08] text-sm text-[#6b7280] hover:text-[#0f0f12] transition-colors touch-manipulation"
          >
            Cancelar
          </button>
          <button
            onClick={handleConnect}
            disabled={selected.size === 0 || saving}
            className={cn(
              "flex-1 h-11 rounded-xl text-sm font-semibold transition-colors touch-manipulation",
              selected.size > 0
                ? "bg-[#7c3aed] hover:bg-[#6d28d9] text-white"
                : "bg-black/[0.03] text-[#9ca3af] cursor-not-allowed"
            )}
          >
            {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : `Conectar (${selected.size})`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

function IntegracionesPageContent() {
  const searchParams = useSearchParams()
  const [connections, setConnections]       = useState<StoreConnection[]>([])
  const [connectorAccounts, setConnectorAccounts] = useState<ConnectorAccount[]>([])
  const [loading, setLoading]               = useState(true)
  const [toast, setToast]                   = useState<{ msg: string; type: "success" | "error" } | null>(null)
  const [shopifyInput, setShopifyInput]     = useState("")
  const [showShopifyInput, setShowShopifyInput] = useState(false)
  const [apiKeyInputs, setApiKeyInputs]     = useState<Record<string, string>>({})
  const [showApiKeyInput, setShowApiKeyInput] = useState<Record<string, boolean>>({})
  const [apiKeyLoading, setApiKeyLoading]   = useState<Record<string, boolean>>({})
  // GA4 specific
  const [ga4PropertyId, setGa4PropertyId]   = useState("")
  const [ga4MeasurementId, setGa4MeasurementId] = useState("")
  const [showGa4Input, setShowGa4Input]     = useState(false)
  const [ga4Loading, setGa4Loading]         = useState(false)
  // Modals
  const [accountModal, setAccountModal]     = useState<{ platform: string; discoveryId: string } | null>(null)
  // Inline store management: which platform is in "manage" mode
  const [managingPlatform, setManagingPlatform] = useState<string | null>(null)
  const [disconnecting, setDisconnecting]   = useState<string | null>(null)

  const popupRef = useRef<Window | null>(null)

  useEffect(() => {
    const code      = searchParams.get("code")
    const connected = searchParams.get("connected")
    const error     = searchParams.get("error")

    // Tiendanube delivers the install `code` to this page (its configured
    // post-install redirect points here, not to the API callback). Forward the
    // code to the OAuth callback so it gets exchanged for a token and stored,
    // then the callback redirects back here as ?connected=tiendanube (no code),
    // so this runs again and shows the success toast — no loop.
    if (code) {
      window.location.replace(`/api/auth/tiendanube/callback?code=${encodeURIComponent(code)}`)
      return
    }

    if (connected === "tiendanube") showToast("✅ Tiendanube conectado con éxito", "success")
    if (connected === "shopify")    showToast("✅ Shopify conectado con éxito", "success")
    if (error) showToast(`Error al conectar: ${error}`, "error")
  }, [searchParams])

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    function handleMessage(ev: MessageEvent) {
      if (ev.data?.source !== "aguara_oauth") return
      popupRef.current?.close()
      if (!ev.data.success) {
        showToast(`Error al conectar: ${ev.data.error ?? "desconocido"}`, "error")
        return
      }
      if (ev.data.discoveryId) {
        setAccountModal({ platform: ev.data.platform, discoveryId: ev.data.discoveryId })
      } else {
        showToast("✅ Conectado con éxito", "success")
        fetchAll()
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  async function fetchAll() {
    const supabase = createClient()
    const [storeRes, connRes] = await Promise.all([
      supabase.from("store_connections").select("*"),
      supabase.from("connector_accounts").select("*"),
    ])
    setConnections(storeRes.data ?? [])
    setConnectorAccounts(connRes.data ?? [])
    setLoading(false)
  }

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  function getStoreConn(platformId: string) {
    return connections.find((c) => c.platform === platformId)
  }

  function getConnectorAccounts(platformId: string) {
    return connectorAccounts.filter((c) => c.platform === platformId)
  }

  const activeStore = connections.find((c) =>
    storeIntegrations.map((i) => i.id).includes(c.platform)
  )

  function openOAuthPopup(url: string) {
    const width = 600, height = 700
    const left  = window.screenX + (window.innerWidth  - width)  / 2
    const top   = window.screenY + (window.innerHeight - height) / 2
    popupRef.current = window.open(url, "aguara_oauth",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`)
  }

  async function handleApiKeyConnect(integration: typeof emailIntegrations[0]) {
    const key = apiKeyInputs[integration.id]?.trim()
    if (!key) return
    setApiKeyLoading((p) => ({ ...p, [integration.id]: true }))
    const res = await fetch(integration.connectUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: key }),
    })
    setApiKeyLoading((p) => ({ ...p, [integration.id]: false }))
    if (res.ok) {
      const data = await res.json()
      showToast(`✅ ${data.accountName ?? integration.name} conectado`, "success")
      setShowApiKeyInput((p) => ({ ...p, [integration.id]: false }))
      setApiKeyInputs((p) => ({ ...p, [integration.id]: "" }))
      fetchAll()
    } else {
      const data = await res.json().catch(() => ({}))
      showToast(data.error ?? "Error al conectar", "error")
    }
  }

  async function disconnectStore(platform: string) {
    setDisconnecting(platform)
    try {
      // Usar Supabase client directamente — mismo cliente que lee las conexiones (funciona)
      // RLS policy "for all using (auth.uid() = user_id)" permite el DELETE
      const supabase = createClient()
      const { error } = await supabase
        .from("store_connections")
        .delete()
        .eq("platform", platform)
      // RLS se encarga de filtrar por user_id — no hace falta pasarlo explícitamente

      if (error) {
        console.error("[disconnectStore] error:", error)
        showToast(`Error: ${error.message}`, "error")
        return
      }

      showToast("✅ Tienda desconectada", "success")
      setManagingPlatform(null)
      fetchAll()
    } catch (e) {
      console.error("[disconnectStore] catch:", e)
      showToast("Error inesperado al desconectar", "error")
    } finally {
      setDisconnecting(null)
    }
  }

  async function handleGA4Connect() {
    if (!ga4PropertyId.trim() || !ga4MeasurementId.trim()) return
    setGa4Loading(true)
    const res = await fetch("/api/connectors/google-analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: ga4PropertyId.trim(), measurementId: ga4MeasurementId.trim() }),
    })
    setGa4Loading(false)
    if (res.ok) {
      const data = await res.json()
      showToast(`✅ ${data.accountName ?? "Google Analytics 4"} conectado`, "success")
      setShowGa4Input(false)
      setGa4PropertyId("")
      setGa4MeasurementId("")
      fetchAll()
    } else {
      const data = await res.json().catch(() => ({}))
      showToast(data.error ?? "Error al conectar GA4", "error")
    }
  }

  // ─── Card renderers ───────────────────────────────────────────────────────────

  function renderStoreCard(integration: typeof storeIntegrations[0]) {
    const conn       = getStoreConn(integration.id)
    const isBlocked  = !conn && !!activeStore && integration.available
    const isManaging = managingPlatform === integration.id
    const isLoading  = disconnecting === integration.id

    return (
      <div
        key={integration.id}
        className={cn(
          "bg-white border rounded-xl overflow-hidden transition-all",
          conn ? "border-emerald-500/25" : "border-black/[0.08]",
          isBlocked && "opacity-40"
        )}
      >
        {/* ── Main row ── */}
        <div className="flex items-center gap-4 px-4 py-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: integration.logoBg }}
          >
            <PlatformLogo id={integration.id} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-[#0f0f12]">{integration.name}</span>
              {conn && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                  Conectado
                </span>
              )}
              {!integration.available && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/[0.04] text-[#9ca3af] border border-black/[0.08]">
                  Próximamente
                </span>
              )}
            </div>
            <p className="text-xs text-[#9ca3af] truncate">
              {conn
                ? `${conn.store_name}${conn.store_url ? ` · ${conn.store_url}` : ""}`
                : integration.description}
            </p>
          </div>

          {/* Action button */}
          {conn ? (
            <button
              onClick={() => setManagingPlatform(isManaging ? null : integration.id)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 text-xs px-3 h-9 rounded-lg border transition-colors touch-manipulation",
                isManaging
                  ? "bg-black/[0.06] border-black/[0.08] text-[#0f0f12]"
                  : "bg-black/[0.03] border-black/[0.08] text-[#6b7280] hover:text-[#0f0f12] hover:bg-black/[0.06]"
              )}
            >
              {isManaging ? <X size={12} /> : <Store size={12} />}
              {isManaging ? "Cerrar" : "Gestionar"}
            </button>
          ) : isBlocked || !integration.available ? (
            <button disabled className="shrink-0 text-xs px-4 h-9 rounded-lg bg-black/[0.03] border border-black/[0.08] text-[#9ca3af] cursor-not-allowed">
              Conectar
            </button>
          ) : integration.type === "shopify_input" ? (
            <div className="flex items-center gap-2 shrink-0">
              {showShopifyInput ? (
                <>
                  <div className="flex items-center bg-black/[0.03] border border-black/[0.08] rounded-lg overflow-hidden">
                    <input
                      type="text"
                      value={shopifyInput}
                      onChange={(e) => setShopifyInput(e.target.value)}
                      placeholder="tu-tienda"
                      autoComplete="off"
                      className="bg-transparent text-base sm:text-xs text-[#0f0f12] px-3 h-9 outline-none w-28 placeholder:text-[#9ca3af] touch-manipulation"
                      onKeyDown={(e) =>
                        e.key === "Enter" && shopifyInput &&
                        (window.location.href = `/api/auth/shopify/connect?shop=${shopifyInput}`)
                      }
                    />
                    <span className="text-xs text-[#9ca3af] pr-2">.myshopify.com</span>
                  </div>
                  <a
                    href={shopifyInput ? `/api/auth/shopify/connect?shop=${shopifyInput}` : "#"}
                    className={cn(
                      "text-xs px-3 h-9 flex items-center rounded-lg font-semibold transition-colors",
                      shopifyInput ? "bg-[#7c3aed] hover:bg-[#6d28d9] text-white" : "bg-black/[0.03] text-[#9ca3af] pointer-events-none"
                    )}
                  >
                    Ir
                  </a>
                  <button onClick={() => setShowShopifyInput(false)} className="text-[#9ca3af] hover:text-[#6b7280] w-8 h-8 flex items-center justify-center touch-manipulation">
                    <X size={14} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowShopifyInput(true)}
                  className="text-xs px-4 h-9 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold transition-colors touch-manipulation"
                >
                  Conectar
                </button>
              )}
            </div>
          ) : (
            <a
              href={integration.connectUrl}
              className="shrink-0 text-xs px-4 h-9 flex items-center rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold transition-colors"
            >
              Conectar
            </a>
          )}
        </div>

        {/* ── Inline manage panel (expands when Gestionar clicked) ── */}
        {isManaging && conn && (
          <div className="border-t border-black/[0.08] px-4 py-4 bg-[#faf8ff]">
            {/* Store details */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-xs">
              <span className="text-[#9ca3af]">Tienda</span>
              <span className="text-[#0f0f12] font-medium text-right truncate">{conn.store_name || "—"}</span>
              {conn.store_url && (
                <>
                  <span className="text-[#9ca3af]">URL</span>
                  <a
                    href={`https://${conn.store_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#7c3aed] hover:underline flex items-center gap-1 justify-end"
                  >
                    {conn.store_url} <ExternalLink size={10} />
                  </a>
                </>
              )}
              <span className="text-[#9ca3af]">Conectado</span>
              <span className="text-[#6b7280] text-right">
                {new Date(conn.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>

            {/* Disconnect button */}
            <button
              onClick={() => disconnectStore(integration.id)}
              disabled={isLoading}
              className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-sm text-red-600 hover:bg-red-500/[0.15] disabled:opacity-60 transition-colors touch-manipulation"
            >
              {isLoading
                ? <><Loader2 size={14} className="animate-spin" /> Desconectando...</>
                : <><Trash2 size={14} /> Desconectar {integration.name}</>
              }
            </button>
            <p className="text-[10px] text-[#9ca3af] text-center mt-2">
              Los datos históricos se mantienen en Aguara.
            </p>
          </div>
        )}
      </div>
    )
  }

  function renderAdsCard(integration: typeof adsIntegrations[0]) {
    const accts      = getConnectorAccounts(integration.id)
    const isConnected = accts.length > 0

    return (
      <div
        key={integration.id}
        className={cn(
          "flex items-center gap-4 bg-white border rounded-xl px-4 py-4",
          isConnected ? "border-emerald-500/25" : "border-black/[0.08]"
        )}
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: integration.logoBg }}>
          <PlatformLogo id={integration.id} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-[#0f0f12]">{integration.name}</span>
            {isConnected && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                {accts.length} cuenta{accts.length !== 1 ? "s" : ""}
              </span>
            )}
            {!integration.available && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/[0.04] text-[#9ca3af] border border-black/[0.08]">
                Próximamente
              </span>
            )}
          </div>
          <p className="text-xs text-[#9ca3af] truncate">
            {isConnected ? accts.map((a) => a.account_name).join(", ") : integration.description}
          </p>
        </div>
        {!integration.available ? (
          <button disabled className="shrink-0 text-xs px-4 h-9 rounded-lg bg-black/[0.03] border border-black/[0.08] text-[#9ca3af] cursor-not-allowed">
            Conectar
          </button>
        ) : isConnected ? (
          <button
            onClick={() => openOAuthPopup(integration.connectUrl)}
            className="shrink-0 text-xs px-3 h-9 rounded-lg bg-black/[0.03] border border-black/[0.08] text-[#6b7280] hover:text-[#0f0f12] transition-colors touch-manipulation"
          >
            + Agregar
          </button>
        ) : (
          <button
            onClick={() => openOAuthPopup(integration.connectUrl)}
            className="shrink-0 text-xs px-4 h-9 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold transition-colors touch-manipulation"
          >
            Conectar
          </button>
        )}
      </div>
    )
  }

  function renderGA4Card(integration: typeof analyticsIntegrations[0]) {
    const accts       = getConnectorAccounts(integration.id)
    const isConnected = accts.length > 0

    return (
      <div
        key={integration.id}
        className={cn(
          "flex flex-col gap-3 bg-white border rounded-xl px-4 py-4",
          isConnected ? "border-emerald-500/25" : "border-black/[0.08]"
        )}
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: integration.logoBg }}>
            <PlatformLogo id={integration.id} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-[#0f0f12]">{integration.name}</span>
              {isConnected && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                  Conectado
                </span>
              )}
            </div>
            <p className="text-xs text-[#9ca3af] truncate">
              {isConnected ? accts[0].account_name : integration.description}
            </p>
          </div>

          {isConnected ? (
            <button
              onClick={async () => {
                await fetch(integration.connectUrl, { method: "DELETE" })
                showToast("Google Analytics 4 desconectado", "success")
                fetchAll()
              }}
              className="shrink-0 text-xs px-3 h-9 rounded-lg bg-black/[0.03] border border-black/[0.08] text-[#6b7280] hover:text-red-600 transition-colors touch-manipulation"
            >
              Desconectar
            </button>
          ) : (
            <button
              onClick={() => setShowGa4Input((v) => !v)}
              className="shrink-0 flex items-center gap-1.5 text-xs px-4 h-9 rounded-lg bg-[#E37400] hover:bg-[#E37400]/90 text-white font-semibold transition-colors touch-manipulation"
            >
              <BarChart3 size={12} />
              Conectar
            </button>
          )}
        </div>

        {/* GA4 inline form */}
        {showGa4Input && !isConnected && (
          <div className="ml-15 space-y-2 pt-1 pl-0 sm:pl-[60px]">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <label className="block text-[10px] text-[#9ca3af] mb-1">Property ID</label>
                <input
                  type="text"
                  value={ga4PropertyId}
                  onChange={(e) => setGa4PropertyId(e.target.value)}
                  placeholder="123456789"
                  inputMode="numeric"
                  autoComplete="off"
                  className="w-full h-10 bg-black/[0.03] border border-black/[0.08] rounded-lg px-3 text-base sm:text-xs text-[#0f0f12] placeholder:text-[#9ca3af] outline-none focus:border-[#E37400]/50 touch-manipulation"
                />
                <p className="text-[10px] text-[#9ca3af] mt-1">Admin → Detalles de la propiedad</p>
              </div>
              <div className="flex-1">
                <label className="block text-[10px] text-[#9ca3af] mb-1">Measurement ID</label>
                <input
                  type="text"
                  value={ga4MeasurementId}
                  onChange={(e) => setGa4MeasurementId(e.target.value.toUpperCase())}
                  placeholder="G-XXXXXXXXXX"
                  autoComplete="off"
                  autoCapitalize="characters"
                  className="w-full h-10 bg-black/[0.03] border border-black/[0.08] rounded-lg px-3 text-base sm:text-xs text-[#0f0f12] placeholder:text-[#9ca3af] outline-none focus:border-[#E37400]/50 touch-manipulation"
                />
                <p className="text-[10px] text-[#9ca3af] mt-1">Flujo de datos → ID de medición</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={integration.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-[#E37400] hover:underline flex items-center gap-1"
              >
                <ExternalLink size={10} /> ¿Dónde encuentro estos datos?
              </a>
              <div className="flex-1" />
              <button
                onClick={() => { setShowGa4Input(false); setGa4PropertyId(""); setGa4MeasurementId("") }}
                className="text-[#9ca3af] hover:text-[#6b7280] w-8 h-8 flex items-center justify-center touch-manipulation"
              >
                <X size={14} />
              </button>
              <button
                onClick={handleGA4Connect}
                disabled={!ga4PropertyId.trim() || !ga4MeasurementId.trim() || ga4Loading}
                className={cn(
                  "text-xs px-4 h-9 rounded-lg font-semibold transition-colors touch-manipulation",
                  ga4PropertyId.trim() && ga4MeasurementId.trim()
                    ? "bg-[#E37400] hover:bg-[#E37400]/90 text-white"
                    : "bg-black/[0.03] text-[#9ca3af] cursor-not-allowed"
                )}
              >
                {ga4Loading ? <Loader2 size={13} className="animate-spin" /> : "Guardar"}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderEmailCard(integration: typeof emailIntegrations[0]) {
    const accts       = getConnectorAccounts(integration.id)
    const isConnected = accts.length > 0
    const showInput   = showApiKeyInput[integration.id]
    const isLoading   = apiKeyLoading[integration.id]

    return (
      <div
        key={integration.id}
        className={cn(
          "flex flex-col gap-3 bg-white border rounded-xl px-4 py-4",
          isConnected ? "border-emerald-500/25" : "border-black/[0.08]"
        )}
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: integration.logoBg }}>
            <PlatformLogo id={integration.id} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-[#0f0f12]">{integration.name}</span>
              {isConnected && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                  Conectado
                </span>
              )}
            </div>
            <p className="text-xs text-[#9ca3af] truncate">
              {isConnected ? accts[0].account_name : integration.description}
            </p>
          </div>
          {isConnected ? (
            <button
              onClick={async () => {
                await fetch(integration.connectUrl, { method: "DELETE" })
                showToast(`${integration.name} desconectado`, "success")
                fetchAll()
              }}
              className="shrink-0 text-xs px-3 h-9 rounded-lg bg-black/[0.03] border border-black/[0.08] text-[#6b7280] hover:text-red-600 transition-colors touch-manipulation"
            >
              Desconectar
            </button>
          ) : (
            <button
              onClick={() => setShowApiKeyInput((p) => ({ ...p, [integration.id]: !p[integration.id] }))}
              className="shrink-0 flex items-center gap-1.5 text-xs px-4 h-9 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold transition-colors touch-manipulation"
            >
              <Key size={12} /> API Key
            </button>
          )}
        </div>

        {showInput && !isConnected && (
          <div className="flex items-center gap-2 pl-0 sm:pl-[60px]">
            <input
              type="password"
              value={apiKeyInputs[integration.id] ?? ""}
              onChange={(e) => setApiKeyInputs((p) => ({ ...p, [integration.id]: e.target.value }))}
              placeholder={integration.placeholder}
              autoComplete="off"
              className="flex-1 h-10 bg-black/[0.03] border border-black/[0.08] rounded-lg px-3 text-base sm:text-xs text-[#0f0f12] placeholder:text-[#9ca3af] outline-none focus:border-[#7c3aed]/50 touch-manipulation"
              onKeyDown={(e) => e.key === "Enter" && handleApiKeyConnect(integration)}
            />
            <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer"
              className="text-[#9ca3af] hover:text-[#6b7280] transition-colors w-8 h-8 flex items-center justify-center touch-manipulation" title="¿Dónde encuentro mi API Key?">
              <ExternalLink size={13} />
            </a>
            <button
              onClick={() => handleApiKeyConnect(integration)}
              disabled={!apiKeyInputs[integration.id]?.trim() || isLoading}
              className={cn(
                "text-xs px-4 h-9 rounded-lg font-semibold transition-colors touch-manipulation",
                apiKeyInputs[integration.id]?.trim()
                  ? "bg-[#7c3aed] hover:bg-[#6d28d9] text-white"
                  : "bg-black/[0.03] text-[#9ca3af] cursor-not-allowed"
              )}
            >
              {isLoading ? <Loader2 size={13} className="animate-spin" /> : "Guardar"}
            </button>
            <button
              onClick={() => setShowApiKeyInput((p) => ({ ...p, [integration.id]: false }))}
              className="text-[#9ca3af] hover:text-[#6b7280] w-8 h-8 flex items-center justify-center touch-manipulation"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh overflow-x-hidden bg-white">
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-black/[0.08] bg-white/90 backdrop-blur-sm">
        <h1 className="text-sm font-medium text-[#0f0f12]">Integraciones</h1>
      </header>

      {/* Toast */}
      {toast && (
        <div role="status" aria-live="polite" className={cn(
          "fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border max-w-xs",
          toast.type === "success"
            ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-700"
            : "bg-red-500/20 border-red-500/30 text-red-700"
        )}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Account selection modal */}
      {accountModal && (
        <AccountSelectionModal
          platform={accountModal.platform}
          discoveryId={accountModal.discoveryId}
          onClose={() => setAccountModal(null)}
          onConnected={() => {
            const label = accountModal.platform === "meta_ads" ? "Meta Ads" : "Google Ads"
            showToast(`✅ ${label} conectado con éxito`, "success")
            fetchAll()
          }}
        />
      )}

      <div className="px-4 lg:px-6 py-6 lg:py-8 max-w-[900px]">
        {loading ? (
          <div className="flex items-center gap-2 text-[#9ca3af] text-sm">
            <Loader2 size={14} className="animate-spin" /> Cargando conexiones...
          </div>
        ) : (
          <div className="flex flex-col gap-8">

            {/* Canal de venta */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest">Canal de venta</h2>
                  <p className="text-xs text-[#9ca3af] mt-0.5">Solo un canal activo a la vez. Para cambiar, desconectá el actual.</p>
                </div>
                {activeStore && (
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                    1 tienda activa
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3">
                {storeIntegrations.map(renderStoreCard)}
              </div>
            </section>

            {/* Operaciones / OMS */}
            <section>
              <div className="mb-3">
                <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest">Operaciones / OMS</h2>
                <p className="text-xs text-[#9ca3af] mt-0.5">Sincronizá fulfillment y estado de órdenes con tu sistema de gestión.</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {omsIntegrations.map(renderStoreCard)}
              </div>
            </section>

            {/* Publicidad */}
            <section>
              <div className="mb-3">
                <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest">Publicidad</h2>
                <p className="text-xs text-[#9ca3af] mt-0.5">Cruzá el gasto en ads con tus ventas para calcular ROAS y CPA real.</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {adsIntegrations.map(renderAdsCard)}
              </div>
            </section>

            {/* Analytics */}
            <section>
              <div className="mb-3">
                <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest">Analytics</h2>
                <p className="text-xs text-[#9ca3af] mt-0.5">Tráfico, sesiones y conversiones para contextualizar tus ventas.</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {analyticsIntegrations.map(renderGA4Card)}
              </div>
            </section>

            {/* Email marketing */}
            <section>
              <div className="mb-3">
                <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest">Email marketing</h2>
                <p className="text-xs text-[#9ca3af] mt-0.5">Conectá tu herramienta de email para cruzar métricas con ventas.</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {emailIntegrations.map(renderEmailCard)}
              </div>
            </section>

          </div>
        )}
      </div>
    </div>
  )
}

export default function IntegracionesPage() {
  return (
    <Suspense fallback={null}>
      <IntegracionesPageContent />
    </Suspense>
  )
}
