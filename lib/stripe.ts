// =============================================================
// lib/stripe.ts
// =============================================================
// Lazy Stripe server client.
//
// The client is created on first use (not at module import time)
// so that builds succeed even when STRIPE_SECRET_KEY is not set
// in the environment yet. The error is thrown at request time,
// which is the correct moment to surface a missing key.
//
// REQUIRED ENV VARS (add to Vercel + .env.local):
//   STRIPE_SECRET_KEY             — from Stripe Dashboard → Developers → API keys
//   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — same section (starts with pk_)
//   STRIPE_WEBHOOK_SECRET         — from Stripe Dashboard → Webhooks
// =============================================================

import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Returns the singleton Stripe instance.
 * Throws at call time if STRIPE_SECRET_KEY is not configured.
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. " +
      "Add it to .env.local (dev) or Vercel Environment Variables (prod)."
    );
  }

  _stripe = new Stripe(key, {
    // Pin the API version so upgrades don't break webhooks silently
    apiVersion: "2026-05-27.dahlia",
    typescript:  true,
  });

  return _stripe;
}

// Re-export the getter as the default for convenience
export default getStripe;
