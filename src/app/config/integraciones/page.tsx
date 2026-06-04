"use client"

export const dynamic = "force-dynamic"

import { useEffect, useRef, useState } from "react"
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
  if (id === "tiendanube") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <path d="M20 6C14.5 6 10 10.5 10 16C7.5 16 4 18.2 4 22C4 26 7.5 29 12 29H28C32.5 29 36 26 36 22C36 18 32.8 14.8 28.5 14.5C27.8 10 24.3 6 20 6Z" fill="white" opacity="0.9"/>
    </svg>
  )
  if (id === "shopify") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <path d="M28 9.5C27.9 9.2 27.6 9 27.3 9C27 9 24.5 8.8 24.5 8.8C24.5 8.8 22.5 6.8 22.3 6.6C22.1 6.4 21.7 6.4 21.5 6.5L20.2 6.9C19.8 5.8 19.1 4.8 17.8 4.8C17.7 4.8 17.6 4.8 17.5 4.8C17.1 4.3 16.6 4 16.1 4C12.5 4 10.8 8.4 10.3 10.5L7.9 11.3C7.2 11.5 7.2 11.5 7.1 12.2L5 30L22.3 33L33 30.5L28 9.5Z" fill="white" opacity="0.9"/>
    </svg>
  )
  if (id === "mercadolibre") return (
    <span className="text-xs font-black text-[#333]">ML</span>
  )
  if (id === "meta_ads") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <path d="M8 22C8 18 10 15 13 15C15 15 16.5 16.5 18 19L20 22.5L22 19C23.5 16.5 25 15 27 15C30 15 32 18 32 22C32 26.5 29.5 29 27 29C25 29 23.5 27.5 22 25L20 21.5L18 25C16.5 27.5 15 29 13 29C10.5 29 8 26.5 8 22Z" fill="white" opacity="0.9"/>
    </svg>
  )
  if (id === "google_ads") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <path d="M20 8C13.4 8 8 13.4 8 20C8 26.6 13.4 32 20 32C26.6 32 32 26.6 32 20H20V14H31C29.3 10.4 25 8 20 8Z" fill="white" opacity="0.9"/>
    </svg>
  )
  if (id === "tiktok_ads") return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <path d="M28 10C28 10 27.5 16 22 16V20C22 20 25 19.5 28 17.5V27C28 27 27.5 33 20 33C12.5 33 12 27 12 27C12 27 11.5 21 18 20V24C18 24 15 24.5 15 27C15 29.5 17 30.5 20 30.5C23 30.5 25 29.5 25 27V10H28Z" fill="white" opacity="0.9"/>
    </svg>
  )
  if (id === "klaviyo") return (
    <span className="text-xs font-black text-white">Kl</span>
  )
  if (id === "perfit") return (
    <span className="text-xs font-black text-white">Pf</span>
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
    logoBg: "#4285f4", connectUrl: "/api/auth/google-ads/connect",
    type: "oauth_popup" as const, available: true,
  },
  {
    id: "tiktok_ads", name: "TikTok Ads",
    description: "Conectá TikTok for Business para ver métricas de campañas.",
    logoBg: "#010101", connectUrl: "#",
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

export default function IntegracionesPage() {
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
