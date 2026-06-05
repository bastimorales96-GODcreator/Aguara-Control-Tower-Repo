"use client"

export const dynamic = "force-dynamic"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, AlertCircle, ExternalLink, Loader2, Key, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

// ─── Types ─────────────────────────────────────────────────────────────────────

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

// ─── SVG logos ─────────────────────────────────────────────────────────────────

const PlatformLogo = ({ id }: { id: string }) => {
  // Tiendanube — cloud shape
  if (id === "tiendanube") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <path d="M20 7C15 7 11 10.8 10.2 15.7C7.3 16.2 5 18.7 5 21.8C5 25.2 7.8 28 11.2 28H28.8C32.2 28 35 25.2 35 21.8C35 18.5 32.5 15.9 29.3 15.6C28.5 10.8 24.6 7 20 7Z" fill="white" opacity="0.95"/>
    </svg>
  )

  // Shopify — shopping bag with S
  if (id === "shopify") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <path d="M27.2 9.4C27 9.1 26.7 9 26.5 9C26.3 9 24.3 8.9 24.3 8.9C24.3 8.9 22.4 7 22.2 6.8C22 6.6 21.6 6.6 21.4 6.7L20 7.1C19.6 6 18.8 5 17.5 5C17.3 5 17.2 5 17 5C16.6 4.5 16 4.1 15.4 4.1C11.6 4.1 9.7 8.7 9.2 11L6.6 11.8C5.8 12 5.8 12.1 5.7 12.8L3.5 31.2L21.4 34.5L32.5 31.9L27.2 9.4ZM18.4 7.8C18.2 7.9 18 8 17.8 8.1C17.8 8 17.9 8 17.9 7.9C17.9 7 17.6 6.1 17.1 5.4C18 5.6 18.3 6.9 18.4 7.8ZM16.1 5.5C16.4 5.5 16.6 5.6 16.8 5.7C16.2 6.4 16 7.4 15.9 8.2L13.4 8.9C13.9 7.1 15.1 5.5 16.1 5.5ZM17.6 18.9C17.4 18.8 17.1 18.7 16.8 18.6C15.7 18.2 14.8 17.9 14.8 17C14.8 16.2 15.5 15.7 16.5 15.7C17.6 15.7 18.5 16.2 18.5 16.2L19.1 14.3C19.1 14.3 18 13.7 16.5 13.7C13.8 13.7 12 15.3 12 17.3C12 19.5 13.8 20.3 15.4 20.9C16.5 21.3 17.1 21.6 17.1 22.4C17.1 23.1 16.5 23.6 15.4 23.6C13.9 23.6 12.9 22.9 12.9 22.9L12.2 24.8C12.2 24.8 13.3 25.6 15.3 25.6C18 25.6 20 24.1 20 21.9C20 19.7 18.2 18.9 17.6 18.9Z" fill="white" opacity="0.95"/>
    </svg>
  )

  // MercadoLibre — yellow background with ML wordmark
  if (id === "mercadolibre") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      {/* ML letters */}
      <text x="5" y="27" fontFamily="Arial" fontWeight="900" fontSize="18" fill="#2D3277">ML</text>
    </svg>
  )

  // Meta — bold Facebook "f" letterform (very recognizable at small sizes)
  if (id === "meta_ads") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <path d="M23 9h-3.5C16 9 14 11 14 14.5V18h-3v5h3v12h5V23h3.5l.5-5H19v-3c0-1 .5-1.5 1.5-1.5H23V9Z" fill="white"/>
    </svg>
  )

  // Google Ads — white background + bold colored "G" text
  if (id === "google_ads") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <rect x="2" y="2" width="36" height="36" rx="8" fill="white"/>
      <text x="21" y="31" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="26" fontWeight="bold" fill="#4285F4">G</text>
    </svg>
  )

  // TikTok — simplified note shape (bold, clear at small sizes)
  if (id === "tiktok_ads") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <rect x="17" y="7" width="5" height="20" rx="2.5" fill="white"/>
      <rect x="17" y="7" width="13" height="5" rx="2" fill="white"/>
      <circle cx="17" cy="30" r="5" fill="white"/>
    </svg>
  )

  // Pinterest — P pin shape
  if (id === "pinterest_ads") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <path d="M20 4C11.2 4 4 11.2 4 20C4 26.8 8.2 32.6 14.2 34.9C14.1 34 14 32.6 14.2 31.5L15.8 24.7C15.8 24.7 15.3 23.8 15.3 22.4C15.3 20.2 16.6 18.6 18.2 18.6C19.6 18.6 20.3 19.6 20.3 20.9C20.3 22.3 19.4 24.4 18.9 26.4C18.5 28 19.7 29.4 21.3 29.4C24.2 29.4 26.4 26.3 26.4 21.8C26.4 17.8 23.6 15 19.5 15C14.8 15 12.1 18.5 12.1 22.1C12.1 23.5 12.6 25 13.4 25.9C13.5 26.1 13.5 26.3 13.5 26.5L12.9 28.9C12.8 29.2 12.6 29.3 12.3 29.2C10.2 28.2 8.9 25.3 8.9 22C8.9 16.4 13 11.2 20.1 11.2C25.7 11.2 30.1 15.2 30.1 21.7C30.1 28.5 26 33.9 20.1 33.9C18.4 33.9 16.8 33 16.3 32L15.3 35.5C14.9 37 13.9 38.9 13.2 40C15.4 40.6 17.7 41 20 41C28.8 41 36 33.8 36 25C36 16.2 28.8 4 20 4Z" fill="white" opacity="0.95"/>
    </svg>
  )

  // Klaviyo — K letterform
  if (id === "klaviyo") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <path d="M13 8H17V20L26 8H31L22 20L31 32H26L17 20V32H13V8Z" fill="white" opacity="0.95"/>
    </svg>
  )

  // Perfit — P letterform
  if (id === "perfit") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <path d="M12 8H22C26.4 8 29 10.5 29 14.5C29 18.5 26.4 21 22 21H16V32H12V8ZM16 17.5H21.5C23.5 17.5 25 16.5 25 14.5C25 12.5 23.5 11.5 21.5 11.5H16V17.5Z" fill="white" opacity="0.95"/>
    </svg>
  )

  return <span className="text-xs font-black text-white">{id.slice(0, 2).toUpperCase()}</span>
}

// ─── Integration definitions ───────────────────────────────────────────────────

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
    logoBg: "#ffe600", connectUrl: "#",
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

type IntegrationDef =
  | typeof storeIntegrations[0]
  | typeof adsIntegrations[0]
  | (typeof emailIntegrations[0])

// ─── Account selection modal ───────────────────────────────────────────────────

interface DiscoveredAccount {
  id: string
  name: string
  currency: string
}

interface AccountModalProps {
  platform: string
  discoveryId: string
  onClose: () => void
  onConnected: () => void
}

function AccountSelectionModal({ platform, discoveryId, onClose, onConnected }: AccountModalProps) {
  const [accounts, setAccounts] = useState<DiscoveredAccount[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("oauth_discoveries")
        .select("accounts")
        .eq("id", discoveryId)
        .single()
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
    if (res.ok) {
      onConnected()
      onClose()
    }
  }

  const platformLabel = platform === "meta_ads" ? "Meta Ads" : "Google Ads"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0f1825] border border-white/[0.10] rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-white">
            Seleccioná tus cuentas de {platformLabel}
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white/70">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-white/40 text-sm py-4">
            <Loader2 size={14} className="animate-spin" /> Cargando cuentas...
          </div>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-white/40 py-4">
            No se encontraron cuentas de ads en este perfil.
          </p>
        ) : (
          <div className="flex flex-col gap-2 mb-5 max-h-64 overflow-y-auto">
            {accounts.map((account) => (
              <label
                key={account.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors",
                  selected.has(account.id)
                    ? "bg-[#4f8ef7]/10 border-[#4f8ef7]/40"
                    : "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06]"
                )}
              >
                <input
                  type="checkbox"
                  className="accent-[#4f8ef7]"
                  checked={selected.has(account.id)}
                  onChange={() => {
                    const s = new Set(selected)
                    s.has(account.id) ? s.delete(account.id) : s.add(account.id)
                    setSelected(s)
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{account.name}</p>
                  <p className="text-xs text-white/40">{account.id} · {account.currency}</p>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 text-sm px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 hover:text-white/80 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConnect}
            disabled={selected.size === 0 || saving}
            className={cn(
              "flex-1 text-sm px-4 py-2.5 rounded-xl font-semibold transition-colors",
              selected.size > 0
                ? "bg-[#4f8ef7] hover:bg-[#4f8ef7]/90 text-white"
                : "bg-white/[0.04] text-white/25 cursor-not-allowed"
            )}
          >
            {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : `Conectar (${selected.size})`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

function IntegracionesPageContent() {
  const searchParams = useSearchParams()
  const [connections, setConnections] = useState<StoreConnection[]>([])
  const [connectorAccounts, setConnectorAccounts] = useState<ConnectorAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)
  const [shopifyInput, setShopifyInput] = useState("")
  const [showShopifyInput, setShowShopifyInput] = useState(false)
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({})
  const [showApiKeyInput, setShowApiKeyInput] = useState<Record<string, boolean>>({})
  const [apiKeyLoading, setApiKeyLoading] = useState<Record<string, boolean>>({})

  // Account selection modal state
  const [accountModal, setAccountModal] = useState<{
    platform: string
    discoveryId: string
  } | null>(null)

  const popupRef = useRef<Window | null>(null)

  useEffect(() => {
    const connected = searchParams.get("connected")
    const error = searchParams.get("error")
    if (connected === "tiendanube") showToast("✅ Tiendanube conectado con éxito", "success")
    if (connected === "shopify") showToast("✅ Shopify conectado con éxito", "success")
    if (error) showToast(`Error al conectar: ${error}`, "error")
  }, [searchParams])

  useEffect(() => {
    fetchAll()
  }, [])

  // Listen for OAuth popup messages
  useEffect(() => {
    function handleMessage(ev: MessageEvent) {
      if (ev.data?.source !== "aguara_oauth") return
      popupRef.current?.close()

      if (!ev.data.success) {
        showToast(`Error al conectar: ${ev.data.error ?? "desconocido"}`, "error")
        return
      }

      if (ev.data.discoveryId) {
        // Show account selection modal
        setAccountModal({
          platform:    ev.data.platform,
          discoveryId: ev.data.discoveryId,
        })
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
    const width  = 600
    const height = 700
    const left   = window.screenX + (window.innerWidth  - width)  / 2
    const top    = window.screenY + (window.innerHeight - height) / 2
    const popup  = window.open(url, "aguara_oauth",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`)
    popupRef.current = popup
  }

  async function handleApiKeyConnect(integration: typeof emailIntegrations[0]) {
    const key = apiKeyInputs[integration.id]?.trim()
    if (!key) return

    setApiKeyLoading((p) => ({ ...p, [integration.id]: true }))

    const res = await fetch(integration.connectUrl, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ apiKey: key }),
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

  // ─── Card renderers ───────────────────────────────────────────────────────────

  function renderStoreCard(integration: typeof storeIntegrations[0]) {
    const conn = getStoreConn(integration.id)
    const isBlocked = !conn && !!activeStore && integration.available

    return (
      <div
        key={integration.id}
        className={cn(
          "flex items-center gap-5 bg-[#0f1825] border rounded-xl px-5 py-4",
          conn ? "border-emerald-500/25" : "border-white/[0.07]",
          isBlocked && "opacity-40"
        )}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: integration.logoBg }}
        >
          <PlatformLogo id={integration.id} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-white">{integration.name}</span>
            {conn && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                Conectado
              </span>
            )}
            {!integration.available && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-white/30 border border-white/[0.08]">
                Próximamente
              </span>
            )}
          </div>
          {conn ? (
            <p className="text-xs text-white/40">
              {conn.store_name}{conn.store_url && ` · ${conn.store_url}`}
            </p>
          ) : (
            <p className="text-xs text-white/40">{integration.description}</p>
          )}
        </div>

        {conn ? (
          <div className="flex items-center gap-2 shrink-0">
            {conn.store_url && (
              <a href={`https://${conn.store_url}`} target="_blank" rel="noopener noreferrer"
                className="text-white/40 hover:text-white/70 transition-colors">
                <ExternalLink size={13} />
              </a>
            )}
            <button className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 transition-colors">
              Gestionar
            </button>
          </div>
        ) : isBlocked || !integration.available ? (
          <button disabled className="shrink-0 text-xs px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/25 cursor-not-allowed">
            Conectar
          </button>
        ) : integration.type === "shopify_input" ? (
          <div className="flex items-center gap-2 shrink-0">
            {showShopifyInput ? (
              <>
                <div className="flex items-center bg-white/[0.04] border border-white/[0.10] rounded-lg overflow-hidden">
                  <input
                    type="text"
                    value={shopifyInput}
                    onChange={(e) => setShopifyInput(e.target.value)}
                    placeholder="tu-tienda"
                    className="bg-transparent text-xs text-white px-3 py-1.5 outline-none w-28 placeholder:text-white/25"
                    onKeyDown={(e) =>
                      e.key === "Enter" && shopifyInput &&
                      (window.location.href = `/api/auth/shopify/connect?shop=${shopifyInput}`)
                    }
                  />
                  <span className="text-xs text-white/30 pr-2">.myshopify.com</span>
                </div>
                <a
                  href={shopifyInput ? `/api/auth/shopify/connect?shop=${shopifyInput}` : "#"}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors",
                    shopifyInput
                      ? "bg-[#4f8ef7] hover:bg-[#4f8ef7]/90 text-white"
                      : "bg-white/[0.04] text-white/25 pointer-events-none"
                  )}
                >
                  Ir
                </a>
                <button onClick={() => setShowShopifyInput(false)} className="text-white/30 hover:text-white/60">
                  <X size={14} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowShopifyInput(true)}
                className="text-xs px-4 py-2 rounded-lg bg-[#4f8ef7] hover:bg-[#4f8ef7]/90 text-white font-semibold transition-colors"
              >
                Conectar
              </button>
            )}
          </div>
        ) : (
          <a
            href={integration.connectUrl}
            className="shrink-0 text-xs px-4 py-2 rounded-lg bg-[#4f8ef7] hover:bg-[#4f8ef7]/90 text-white font-semibold transition-colors"
          >
            Conectar
          </a>
        )}
      </div>
    )
  }

  function renderAdsCard(integration: typeof adsIntegrations[0]) {
    const accts = getConnectorAccounts(integration.id)
    const isConnected = accts.length > 0

    return (
      <div
        key={integration.id}
        className={cn(
          "flex items-center gap-5 bg-[#0f1825] border rounded-xl px-5 py-4",
          isConnected ? "border-emerald-500/25" : "border-white/[0.07]"
        )}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: integration.logoBg }}
        >
          <PlatformLogo id={integration.id} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-white">{integration.name}</span>
            {isConnected && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                {accts.length} cuenta{accts.length !== 1 ? "s" : ""}
              </span>
            )}
            {!integration.available && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-white/30 border border-white/[0.08]">
                Próximamente
              </span>
            )}
          </div>
          {isConnected ? (
            <p className="text-xs text-white/40">
              {accts.map((a) => a.account_name).join(", ")}
            </p>
          ) : (
            <p className="text-xs text-white/40">{integration.description}</p>
          )}
        </div>

        {!integration.available ? (
          <button disabled className="shrink-0 text-xs px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/25 cursor-not-allowed">
            Conectar
          </button>
        ) : isConnected ? (
          <button
            onClick={() => openOAuthPopup(integration.connectUrl)}
            className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 transition-colors"
          >
            + Agregar
          </button>
        ) : (
          <button
            onClick={() => openOAuthPopup(integration.connectUrl)}
            className="shrink-0 text-xs px-4 py-2 rounded-lg bg-[#4f8ef7] hover:bg-[#4f8ef7]/90 text-white font-semibold transition-colors"
          >
            Conectar
          </button>
        )}
      </div>
    )
  }

  function renderEmailCard(integration: typeof emailIntegrations[0]) {
    const accts = getConnectorAccounts(integration.id)
    const isConnected = accts.length > 0
    const showInput = showApiKeyInput[integration.id]
    const isLoading = apiKeyLoading[integration.id]

    return (
      <div
        key={integration.id}
        className={cn(
          "flex flex-col gap-3 bg-[#0f1825] border rounded-xl px-5 py-4",
          isConnected ? "border-emerald-500/25" : "border-white/[0.07]"
        )}
      >
        <div className="flex items-center gap-5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: integration.logoBg }}
          >
            <PlatformLogo id={integration.id} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-white">{integration.name}</span>
              {isConnected && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  Conectado
                </span>
              )}
            </div>
            {isConnected ? (
              <p className="text-xs text-white/40">{accts[0].account_name}</p>
            ) : (
              <p className="text-xs text-white/40">{integration.description}</p>
            )}
          </div>

          {isConnected ? (
            <button
              onClick={async () => {
                await fetch(integration.connectUrl, { method: "DELETE" })
                showToast(`${integration.name} desconectado`, "success")
                fetchAll()
              }}
              className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-red-400 transition-colors"
            >
              Desconectar
            </button>
          ) : (
            <button
              onClick={() =>
                setShowApiKeyInput((p) => ({ ...p, [integration.id]: !p[integration.id] }))
              }
              className="shrink-0 flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-[#4f8ef7] hover:bg-[#4f8ef7]/90 text-white font-semibold transition-colors"
            >
              <Key size={12} /> API Key
            </button>
          )}
        </div>

        {/* Inline API key input */}
        {showInput && !isConnected && (
          <div className="flex items-center gap-2 ml-16">
            <input
              type="password"
              value={apiKeyInputs[integration.id] ?? ""}
              onChange={(e) => setApiKeyInputs((p) => ({ ...p, [integration.id]: e.target.value }))}
              placeholder={integration.placeholder}
              className="flex-1 bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/25 outline-none focus:border-[#4f8ef7]/50"
              onKeyDown={(e) => e.key === "Enter" && handleApiKeyConnect(integration)}
            />
            <a
              href={integration.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/30 hover:text-white/60 transition-colors"
              title="¿Dónde encuentro mi API Key?"
            >
              <ExternalLink size={13} />
            </a>
            <button
              onClick={() => handleApiKeyConnect(integration)}
              disabled={!apiKeyInputs[integration.id]?.trim() || isLoading}
              className={cn(
                "text-xs px-4 py-2 rounded-lg font-semibold transition-colors",
                apiKeyInputs[integration.id]?.trim()
                  ? "bg-[#4f8ef7] hover:bg-[#4f8ef7]/90 text-white"
                  : "bg-white/[0.04] text-white/25 cursor-not-allowed"
              )}
            >
              {isLoading ? <Loader2 size={13} className="animate-spin" /> : "Guardar"}
            </button>
            <button
              onClick={() => setShowApiKeyInput((p) => ({ ...p, [integration.id]: false }))}
              className="text-white/30 hover:text-white/60"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080d14]">
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-[#080d14]/90 backdrop-blur-sm">
        <h1 className="text-sm font-medium text-white">Integraciones</h1>
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

      <div className="px-6 py-8 max-w-[900px]">
        {loading ? (
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Loader2 size={14} className="animate-spin" /> Cargando conexiones...
          </div>
        ) : (
          <div className="flex flex-col gap-8">

            {/* Canal de venta */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-xs font-semibold text-white/60 uppercase tracking-widest">Canal de venta</h2>
                  <p className="text-xs text-white/30 mt-0.5">Solo un canal activo a la vez.</p>
                </div>
                {activeStore && (
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    1 tienda activa
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3">
                {storeIntegrations.map(renderStoreCard)}
              </div>
            </section>

            {/* Publicidad */}
            <section>
              <div className="mb-3">
                <h2 className="text-xs font-semibold text-white/60 uppercase tracking-widest">Publicidad</h2>
                <p className="text-xs text-white/30 mt-0.5">Cruzá el gasto en ads con tus ventas para calcular ROAS y CPA real.</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {adsIntegrations.map(renderAdsCard)}
              </div>
            </section>

            {/* Email marketing */}
            <section>
              <div className="mb-3">
                <h2 className="text-xs font-semibold text-white/60 uppercase tracking-widest">Email marketing</h2>
                <p className="text-xs text-white/30 mt-0.5">Conectá tu herramienta de email para cruzar métricas con ventas.</p>
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
