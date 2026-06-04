/**
 * POST /api/connectors/select-accounts
 *
 * Called after the user picks which ad accounts to connect from the
 * account-selection modal. Takes a discoveryId + array of selected account IDs,
 * reads the encrypted token from oauth_discoveries, and upserts rows into
 * connector_accounts (one per selected account).
 *
 * Body: { discoveryId: string, accountIds: string[] }
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { encryptJSON, decryptJSON } from "@/lib/encryption"

interface TokenSet {
  access_token: string
  refresh_token?: string
  expires_at?: number
}

interface DiscoveredAccount {
  id: string
  name: string
  currency: string
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { discoveryId, accountIds } = body as {
    discoveryId: string
    accountIds: string[]
  }

  if (!discoveryId || !Array.isArray(accountIds) || accountIds.length === 0) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  // ── Fetch & validate discovery ────────────────────────────────────────────────
  const { data: discovery, error: discErr } = await supabase
    .from("oauth_discoveries")
    .select("*")
    .eq("id", discoveryId)
    .eq("user_id", user.id)
    .single()

  if (discErr || !discovery) {
    return NextResponse.json({ error: "Discovery not found" }, { status: 404 })
  }

  if (new Date(discovery.expires_at) < new Date()) {
    return NextResponse.json({ error: "Discovery expired — please reconnect" }, { status: 410 })
  }

  const tokenSet = decryptJSON<TokenSet>(discovery.encrypted_token)

  const allAccounts = discovery.accounts as DiscoveredAccount[]
  const selected    = allAccounts.filter((a) => accountIds.includes(a.id))

  if (selected.length === 0) {
    return NextResponse.json({ error: "No matching accounts found" }, { status: 400 })
  }

  // ── Upsert connector_accounts ─────────────────────────────────────────────────
  // Each account gets its own encrypted copy of the token (for future per-account refresh)
  const rows = selected.map((account) => ({
    user_id:               user.id,
    platform:              discovery.platform,
    external_account_id:   account.id,
    account_name:          account.name,
    account_currency:      account.currency,
    encrypted_credentials: encryptJSON(tokenSet),
    status:                "active",
  }))

  const { error: upsertErr } = await supabase
    .from("connector_accounts")
    .upsert(rows, { onConflict: "user_id,platform,external_account_id" })

  if (upsertErr) {
    console.error("[select-accounts] Upsert failed:", upsertErr)
    return NextResponse.json({ error: "Failed to save accounts" }, { status: 500 })
  }

  // ── Clean up discovery ────────────────────────────────────────────────────────
  await supabase.from("oauth_discoveries").delete().eq("id", discoveryId)

  return NextResponse.json({
    success: true,
    connected: selected.length,
    accounts: selected.map((a) => ({ id: a.id, name: a.name })),
  })
}
