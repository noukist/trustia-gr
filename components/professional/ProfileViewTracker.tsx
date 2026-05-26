// =============================================================
// components/professional/ProfileViewTracker.tsx
// =============================================================
// Invisible client component — fires once on mount to increment
// the professional's profile_views counter via Supabase RPC.
//
// WHY CLIENT COMPONENT?
//   If we incremented in the Server Component render, every
//   Vercel SSR request (including bots, crawlers, Next.js
//   revalidations) would count as a view. Calling from a
//   client useEffect means only real browsers trigger it.
//
// DOUBLE-FIRE GUARD
//   React 18 StrictMode fires effects twice in development.
//   A ref flag prevents the second call from sending a second RPC.
//
// RENDERS NOTHING — safe to place anywhere in the JSX tree.
// =============================================================

"use client";

import { useEffect, useRef } from "react";
import { createClient }      from "@/lib/supabase/client";

export default function ProfileViewTracker({
  professionalId,
}: {
  professionalId: string;
}) {
  // Prevents double-increment in React StrictMode (dev) and
  // in case the component re-mounts with the same ID.
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const supabase = createClient();
    supabase
      .rpc("increment_profile_view", { prof_id: professionalId })
      .then(({ error }) => {
        // Non-fatal — silently warn in dev, never surface to user
        if (error) console.warn("[ProfileViewTracker]", error.message);
      });
  }, [professionalId]);

  return null;
}
