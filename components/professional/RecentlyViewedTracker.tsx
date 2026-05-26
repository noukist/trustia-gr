// =============================================================
// components/professional/RecentlyViewedTracker.tsx
// =============================================================
// Invisible client component — fires once on mount to upsert
// the current professional into the customer's recently_viewed
// history.
//
// ONLY fires when the visitor is a logged-in customer
// (customerId is required; pass null to skip entirely).
//
// UPSERT strategy: the table has UNIQUE(customer_id, professional_id),
// so duplicate visits simply update viewed_at to now() — keeping
// the list compact and always ordered by last visit.
//
// DOUBLE-FIRE GUARD
//   React 18 StrictMode fires effects twice in development.
//   A ref flag prevents the second upsert from going out.
//
// RENDERS NOTHING — safe to place anywhere in the JSX tree.
// =============================================================

"use client";

import { useEffect, useRef } from "react";
import { createClient }      from "@/lib/supabase/client";

interface RecentlyViewedTrackerProps {
  professionalId: string;
  /** customers.id of the current visitor — null = skip (not logged in or is a pro) */
  customerId:     string | null;
}

export default function RecentlyViewedTracker({
  professionalId,
  customerId,
}: RecentlyViewedTrackerProps) {
  const fired = useRef(false);

  useEffect(() => {
    // Nothing to track if visitor isn't a logged-in customer
    if (!customerId) return;
    if (fired.current) return;
    fired.current = true;

    const supabase = createClient();

    supabase
      .from("recently_viewed")
      .upsert(
        {
          customer_id:     customerId,
          professional_id: professionalId,
          viewed_at:       new Date().toISOString(),
        },
        { onConflict: "customer_id,professional_id" },
      )
      .then(({ error }) => {
        // Non-fatal — silently warn in dev, never surface to user
        if (error) console.warn("[RecentlyViewedTracker]", error.message);
      });
  }, [customerId, professionalId]);

  return null;
}
