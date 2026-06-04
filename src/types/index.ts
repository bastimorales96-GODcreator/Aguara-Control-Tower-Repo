export interface MetricData {
  id: string
  label: string
  value: number
  previousValue: number
  changePercent: number
  trend: "up" | "down" | "neutral"
  format: "currency" | "percent" | "number" | "ratio"
  sparklineData: number[]
  visible: boolean
  /** If true, rising value = bad (costs, CPA) */
  invertTrend?: boolean
  /** Link shown as "Ver detalle" in the card menu */
  detailHref?: string
  /** Section grouping for the Secciones reorder panel */
  section?: "principales" | "costos" | "publicidad"
}

export interface Order {
  id: string
  origin: "tiendanube" | "mercadolibre" | "shopify"
  status: "paid" | "pending" | "cancelled" | "refunded"
  createdAt: string
  totalOrder: number
  totalNet: number
}

export interface Campaign {
  id: string
  name: string
  status: "active" | "paused"
  budget: number | null
  budgetType: "daily" | "lifetime" | null
  spend: number
  revenue: number
  profit: number
  roas?: number
  cpa?: number
  impressions?: number
  clicks?: number
  ctr?: number
  conversions?: number
  platform: "meta" | "google"
  adSets?: AdSet[]
}

export interface AdSet {
  id: string
  name: string
  status: "active" | "paused"
  spend: number
  revenue: number
  profit: number
  roas?: number
  cpa?: number
  impressions?: number
  clicks?: number
  ctr?: number
  conversions?: number
  ads?: Ad[]
}

export interface Ad {
  id: string
  name: string
  status: "active" | "paused"
  spend: number
  revenue: number
  impressions: number
  clicks: number
  ctr: number
}

export interface DateRange {
  start: Date
  end: Date
  label: string
}

export type PlanType = "base" | "advanced"

export interface Integration {
  id: string
  name: string
  type: "ecommerce" | "marketplace" | "ads"
  status: "connected" | "disconnected" | "unavailable"
  account?: string
}
