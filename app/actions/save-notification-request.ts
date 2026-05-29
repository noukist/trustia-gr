// =============================================================
// app/actions/save-notification-request.ts
// =============================================================
// Server Action: persists an "alert me when pros arrive" request
// from the zero-results state on the services search page.
//
// TABLE: notification_requests
//   INSERT is open to anon + authenticated via RLS policy
//   (migration 018_notification_requests.sql).
//
// ON CONFLICT: silently ignored via upsert — same email +
//   category + location combo is treated as a no-op.
// =============================================================

"use server";

import { createClient } from "@/lib/supabase/server";

interface SaveNotificationRequestInput {
  email:       string;
  categoryId:  string;
  location:    string;
}

/**
 * Saves a notification request to the DB.
 * Returns `{ ok: true }` on success, `{ ok: false, message }` on error.
 */
export async function saveNotificationRequest(
  input: SaveNotificationRequestInput,
): Promise<{ ok: boolean; message?: string }> {
  const { email, categoryId, location } = input;

  // ── Server-side validation ────────────────────────────────
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Παρακαλώ εισάγετε έγκυρο email." };
  }
  if (!categoryId) {
    return { ok: false, message: "Λείπει η κατηγορία." };
  }

  try {
    const supabase = await createClient();

    // Upsert: if this email+category+location already exists, do nothing.
    // The UNIQUE INDEX on notification_requests handles the conflict.
    const { error } = await supabase
      .from("notification_requests")
      .upsert(
        {
          email:       email.trim().toLowerCase(),
          category_id: categoryId,
          location:    (location ?? "").trim(),
        },
        {
          onConflict:        "email,category_id,location",
          ignoreDuplicates:  true,
        },
      );

    if (error) throw error;

    return { ok: true };
  } catch (err) {
    console.error("[saveNotificationRequest] DB error:", err);
    return { ok: false, message: "Κάτι πήγε στραβά. Δοκιμάστε ξανά." };
  }
}
