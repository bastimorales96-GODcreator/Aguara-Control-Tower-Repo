import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-05-27.dahlia",
})

// Price IDs — set these in your Stripe dashboard and copy here.
// Use test price IDs (price_test_...) for QA, live IDs for production.
export const STRIPE_PRICES: Record<string, Record<number, string>> = {
  // starter: { 1: "price_starter_step1", 2: "price_starter_step2", ... }
  // Fill these after creating prices in Stripe dashboard.
  // For now we default to a single placeholder used in test mode.
  starter: {},
  growth:  {},
  pro:     {},
}

export const QA_MODE = process.env.QA_BYPASS === "true"
