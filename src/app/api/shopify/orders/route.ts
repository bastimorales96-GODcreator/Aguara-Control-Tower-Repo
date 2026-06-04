import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: store } = await supabase
    .from("store_connections")
    .select("*")
    .eq("user_id", user.id)
    .eq("platform", "shopify")
    .single()

  if (!store) return NextResponse.json({ error: "No Shopify connection" }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const since = searchParams.get("since") || ""
  const until = searchParams.get("until") || ""

  let url = `https://${store.store_id}/admin/api/2024-01/orders.json?status=any&limit=50&financial_status=paid`
  if (since) url += `&created_at_min=${since}`
  if (until) url += `&created_at_max=${until}`

  const res = await fetch(url, {
    headers: {
      "X-Shopify-Access-Token": store.access_token,
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    return NextResponse.json({ error: "Shopify API error", status: res.status }, { status: 502 })
  }

  const { orders } = await res.json()
  return NextResponse.json({ orders, store_name: store.store_name, platform: "shopify" })
}
