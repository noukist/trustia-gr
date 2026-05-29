// =============================================================
// app/api/checkout/route.ts
// =============================================================
// POST — Creates a Stripe Checkout Session for a professional
//        subscription payment.
//
// CALLED FROM
//   • Registration wizard (after pro + subscription rows created)
//   • Dashboard SubscriptionTab "Pay Now" / "Renew" button
//
// REQUEST BODY (JSON)
//   subscriptionId  — DB subscriptions.id (uuid)
//   professionalId  — DB professionals.id (uuid)
//   amountEuros     — total amount in euros (e.g. 30)
//   planLabel       — human-readable plan name for the line item
//   locale          — "el" | "en"
//
// RESPONSE
//   { url: string }  — Stripe Checkout page URL (redirect the user)
//
// WEBHOOK
//   checkout.session.completed → /api/webhooks/stripe updates
//   subscription.payment_status = 'verified'
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { getStripe }                  from "@/lib/stripe";
import { createClient }               from "@/lib/supabase/server";

// Auth-only endpoint — must be logged in
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // ── Verify auth ─────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Parse body ───────────────────────────────────────────
    const body = await req.json() as {
      subscriptionId: string;
      professionalId: string;
      amountEuros:    number;
      planLabel:      string;
      locale:         string;
    };

    const { subscriptionId, professionalId, amountEuros, planLabel, locale } = body;

    if (!subscriptionId || !professionalId || !amountEuros || amountEuros <= 0) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // ── Verify the subscription belongs to this user ─────────
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id, professional_id, payment_status")
      .eq("id",              subscriptionId)
      .eq("professional_id", professionalId)
      .single();

    if (!sub) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Don't re-charge an already-verified subscription
    if (sub.payment_status === "verified") {
      return NextResponse.json({ error: "Already paid" }, { status: 409 });
    }

    // ── Build the base URL from the request origin ────────────
    const origin = req.headers.get("origin") ?? "https://trustia.gr";
    const localePrefix = locale === "en" ? "/en" : "";

    // ── Create Stripe Checkout Session ───────────────────────
    const session = await getStripe().checkout.sessions.create({
      mode:    "payment",          // One-time payment (not recurring subscription)
      currency: "eur",

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency:    "eur",
            unit_amount: Math.round(amountEuros * 100), // Stripe works in cents
            product_data: {
              name: `Trustia.gr — ${planLabel}`,
              description:
                locale === "en"
                  ? "Professional listing subscription — no commission, keep 100% of earnings."
                  : "Συνδρομή επαγγελματία — μηδέν προμήθεια, κρατάτε το 100% των εισπράξεων.",
            },
          },
        },
      ],

      // Metadata passed back in the webhook so we know which subscription to update
      metadata: {
        subscription_id:  subscriptionId,
        professional_id:  professionalId,
        user_id:          user.id,
      },

      // Greek language on the Stripe-hosted page
      locale: locale === "el" ? "el" : "en",

      // ── Redirect URLs ────────────────────────────────────
      // success_url gets the session_id injected by Stripe so we can
      // display a personalised "payment received" message if needed.
      success_url: `${origin}${localePrefix}/dashboard?welcome=1&payment=success`,
      cancel_url:  `${origin}${localePrefix}/dashboard?tab=subscription&payment=cancelled`,

      // Pre-fill customer email so they don't have to type it again
      customer_email: user.email ?? undefined,
    });

    // ── Store the Stripe session ID on the subscription row ──
    // This lets admins reconcile DB rows with Stripe dashboard.
    await supabase
      .from("subscriptions")
      .update({ stripe_session_id: session.id })
      .eq("id", subscriptionId);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[api/checkout] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
