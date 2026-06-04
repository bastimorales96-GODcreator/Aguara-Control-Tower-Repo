import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ products: data || [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { products } = body // array of products

  if (!Array.isArray(products) || products.length === 0) {
    return NextResponse.json({ error: "No products provided" }, { status: 400 })
  }

  const rows = products.map((p: any) => ({
    user_id: user.id,
    sku: String(p.sku || "").trim(),
    description: String(p.description || "").trim(),
    cost_price: parseFloat(p.cost_price) || 0,
    iva_rate: parseFloat(p.iva_rate) || 21,
    currency: String(p.currency || "ARS").toUpperCase(),
    updated_at: new Date().toISOString(),
  })).filter(p => p.sku && p.description)

  const { data, error } = await supabase
    .from("products")
    .upsert(rows, { onConflict: "user_id,sku" })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ inserted: data?.length || 0 })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await request.json()
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
