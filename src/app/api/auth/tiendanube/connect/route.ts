import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SUPABASE_URL!))
  }

  const appId = process.env.TIENDANUBE_APP_ID!
  const redirectUri = encodeURIComponent(process.env.TIENDANUBE_REDIRECT_URI!)
  const scopes = "read_orders,read_products,read_customers"

  const authUrl = `https://www.tiendanube.com/apps/${appId}/authorize?response_type=code&scope=${scopes}&redirect_uri=${redirectUri}`

  return NextResponse.redirect(authUrl)
}
