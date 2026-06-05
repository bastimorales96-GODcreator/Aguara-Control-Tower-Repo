/**
 * DELETE /api/connectors/store
 *
 * Disconnects a store by deleting its row from store_connections.
 * Body: { platform: "shopify" | "tiendanube" | "mercadolibre" }
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET ?platform=shopify — kept for clarity; DELETE via query param avoids body issues
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Accept platform from query param (reliable) or body (fallback)
  const url = new URL(req.url)
  let platform = url.searchParams.get("platform")

  if (!platform) {
    try {
      const body = await req.json()
      platform = body.platform ?? null
    } catch {
      // body missing or not JSON
    }
  }

  if (!platform) {
    return NextResponse.json({ error: "Missing platform" }, { status: 400 })
  }

  console.log("[store/disconnect] user:", user.id, "platform:", platform)

  const { error, count } = await supabase
    .from("store_connections")
    .delete()
    .eq("user_id", user.id)
    .eq("platform", platform)
    .select()

  if (error) {
    console.error("[store/disconnect] Supabase error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log("[store/disconnect] deleted rows:", count)
  return NextResponse.json({ success: true, deleted: count })
}
