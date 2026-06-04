import { NextResponse } from "next/server"

export async function GET() {
  try {
    const res = await fetch("https://dolarapi.com/v1/dolares", {
      next: { revalidate: 3600 }, // cache 1 hour
    })
    if (!res.ok) throw new Error("API error")
    const data = await res.json()

    // Map to our format
    const rates: Record<string, { compra: number; venta: number; fecha: string }> = {}
    for (const item of data) {
      const key = item.casa?.toLowerCase()
      if (key) rates[key] = { compra: item.compra, venta: item.venta, fecha: item.fechaActualizacion }
    }

    return NextResponse.json({ rates, updatedAt: new Date().toISOString() })
  } catch (err) {
    return NextResponse.json({ error: "No se pudo obtener la cotización" }, { status: 502 })
  }
}
