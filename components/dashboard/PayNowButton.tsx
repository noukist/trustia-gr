// =============================================================
// components/dashboard/PayNowButton.tsx
// =============================================================
// Client component — triggers a Stripe Checkout session and
// hard-navigates the user to Stripe's hosted payment page.
//
// Used in SubscriptionTab when payment_status = 'pending'.
// =============================================================

"use client";

import { useState }    from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { useLocale }   from "next-intl";

interface PayNowButtonProps {
  subscriptionId: string;
  professionalId: string;
  amountEuros:    number;
  planLabel:      string;
}

export default function PayNowButton({
  subscriptionId,
  professionalId,
  amountEuros,
  planLabel,
}: PayNowButtonProps) {
  const locale   = useLocale();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          subscriptionId,
          professionalId,
          amountEuros,
          planLabel,
          locale,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Σφάλμα σύνδεσης με το σύστημα πληρωμών.");
      }

      // Hard-navigate to Stripe's hosted checkout page
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Κάτι πήγε στραβά. Δοκίμασε ξανά.");
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        style={{
          display:         "inline-flex",
          alignItems:      "center",
          justifyContent:  "center",
          gap:             "0.5rem",
          padding:         "0.875rem 2rem",
          backgroundColor: "#635BFF",  // Stripe brand purple
          color:           "#fff",
          border:          "none",
          borderRadius:    "10px",
          fontWeight:      700,
          fontSize:        "1rem",
          fontFamily:      "inherit",
          cursor:          loading ? "wait" : "pointer",
          opacity:         loading ? 0.75 : 1,
          transition:      "opacity 0.15s",
          width:           "100%",
          maxWidth:        "320px",
        }}
      >
        {loading ? (
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
        ) : (
          <CreditCard size={18} />
        )}
        {loading
          ? "Μετάβαση στην πληρωμή…"
          : `Πλήρωσε €${amountEuros.toFixed(2)} με κάρτα`}
      </button>

      {error && (
        <p style={{ fontSize: "0.8125rem", color: "#E74C3C", margin: 0 }}>
          {error}
        </p>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
