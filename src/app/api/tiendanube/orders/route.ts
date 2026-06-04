import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Get store connection
  const { data: store } = await supabase
    .from("store_connections")
    .select("*")
    .eq("user_id", user.id)
    .eq("platform", "tiendanube")
    .single()

  if (!store) return NextResponse.json({ error: "No Tiendanube connection" }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const since = searchParams.get("since") || ""
  const until = searchParams.get("until") || ""

  let url = `https://api.tiendanube.com/v1/${store.store_id}/orders?per_page=50&payment_status=paid`
  if (since) url += `&created_at_min=${since}`
  if (until) url += `&created_at_max=${until}`

  const res = await fetch(url, {
    headers: {
      Authorization: `bearer ${store.access_token}`,
      "User-Agent": `Aguara (${process.env.TIENDANUBE_APP_ID}) sebastian@aguara.io`,
    },
  })

  if (!res.ok) {
    return NextResponse.json({ error: "Tiendanube API error", status: res.status }, { status: 502 })
  }

  const orders = await res.json()
  return NextResponse.json({ orders, store_name: store.store_name })
}
