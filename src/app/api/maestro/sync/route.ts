import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Get active store connection
  const { data: connections } = await supabase
    .from("store_connections")
    .select("*")
    .eq("user_id", user.id)

  const storeplatforms = ["tiendanube", "shopify"]
  const activeStore = connections?.find(c => storeplatforms.includes(c.platform))

  if (!activeStore) {
    return NextResponse.json({ error: "No store connected" }, { status: 404 })
  }

  let storeProducts: Array<{
    sku: string
    description: string
    cost_price: number
    iva_rate: number
    currency: string
  }> = []

  if (activeStore.platform === "shopify") {
    let page_info = ""
    let hasMore = true

    while (hasMore) {
      let url = `https://${activeStore.store_id}/admin/api/2024-01/products.json?limit=250`
      if (page_info) url += `&page_info=${page_info}`

      const res = await fetch(url, {
        headers: { "X-Shopify-Access-Token": activeStore.access_token },
      })

      if (!res.ok) break

      const { products } = await res.json()
      if (!products?.length) break

      for (const p of products) {
        for (const v of (p.variants || [])) {
          storeProducts.push({
            sku: v.sku || `${p.id}-${v.id}`,
            description: p.variants.length > 1
              ? `${p.title} — ${v.title}`
              : p.title,
            cost_price: parseFloat(v.compare_at_price || v.price || "0"),
            iva_rate: 21,
            currency: "ARS",
          })
        }
      }

      // Check for next page via Link header
      const linkHeader = res.headers.get("link") || ""
      const nextMatch = linkHeader.match(/<[^>]*page_info=([^>&"]+)[^>]*>;\s*rel="next"/)
      if (nextMatch) {
        page_info = nextMatch[1]
      } else {
        hasMore = false
      }
    }
  } else if (activeStore.platform === "tiendanube") {
    let page = 1
    let hasMore = true

    while (hasMore) {
      const url = `https://api.tiendanube.com/v1/${activeStore.store_id}/products?per_page=200&page=${page}`
      const res = await fetch(url, {
        headers: {
          Authorization: `bearer ${activeStore.access_token}`,
          "User-Agent": `Aguara (${process.env.TIENDANUBE_APP_ID}) sebastian@aguara.io`,
        },
      })

      if (!res.ok) break
      const products = await res.json()
      if (!products?.length) break

      for (const p of products) {
        const name = p.name?.es || p.name?.["pt-BR"] || Object.values(p.name || {})[0] || "Sin nombre"
        if (p.variants?.length) {
          for (const v of p.variants) {
            const sku = v.sku || `${p.id}-${v.id}`
            const variantName = v.values?.map((val: any) => val.es || val.pt || Object.values(val)[0]).join(" / ")
            storeProducts.push({
              sku,
              description: variantName ? `${name} — ${variantName}` : name,
              cost_price: parseFloat(v.compare_at_price || v.price || "0"),
              iva_rate: 21,
              currency: "ARS",
            })
          }
        } else {
          storeProducts.push({
            sku: String(p.id),
            description: name,
            cost_price: parseFloat(p.compare_at_price || p.price || "0"),
            iva_rate: 21,
            currency: "ARS",
          })
        }
      }

      hasMore = products.length === 200
      page++
    }
  }

  if (!storeProducts.length) {
    return NextResponse.json({ synced: 0, message: "No products found" })
  }

  // Deduplicate by SKU (last one wins) — avoids "ON CONFLICT DO UPDATE command cannot affect row a second time"
  const skuMap = new Map<string, typeof storeProducts[0]>()
  for (const p of storeProducts) {
    const sku = p.sku?.trim()
    if (sku) skuMap.set(sku, { ...p, sku })
  }
  const validProducts = Array.from(skuMap.values())

  if (!validProducts.length) {
    return NextResponse.json({ synced: 0, message: "No products with valid SKUs" })
  }

  // Upsert in chunks of 100 to stay within limits
  const CHUNK = 100
  let totalSynced = 0
  for (let i = 0; i < validProducts.length; i += CHUNK) {
    const chunk = validProducts.slice(i, i + CHUNK)
    const { error } = await supabase.from("products").upsert(
      chunk.map(p => ({ ...p, user_id: user.id })),
      { onConflict: "user_id,sku", ignoreDuplicates: false }
    )
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    totalSynced += chunk.length
  }

  return NextResponse.json({ synced: totalSynced })
}
