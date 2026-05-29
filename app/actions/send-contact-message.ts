// =============================================================
// app/actions/send-contact-message.ts
// =============================================================
// Server Action: saves a contact form submission to DB.
// Table: contact_messages (migration 020)
// RLS: INSERT open to anon + authenticated
// =============================================================

"use server";

import { createClient } from "@/lib/supabase/server";

interface ContactInput {
  name:    string;
  email:   string;
  subject: string;
  message: string;
  locale:  string;
}

export async function sendContactMessage(
  input: ContactInput,
): Promise<{ ok: boolean; message?: string }> {
  const { name, email, subject, message, locale } = input;

  // ── Server-side validation ─────────────────────────────────
  if (!name.trim())    return { ok: false, message: "Το όνομα είναι υποχρεωτικό." };
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                       return { ok: false, message: "Παρακαλώ εισάγετε έγκυρο email." };
  if (!message.trim()) return { ok: false, message: "Το μήνυμα είναι υποχρεωτικό." };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("contact_messages")
      .insert({
        name:    name.trim(),
        email:   email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
        locale,
      });

    if (error) throw error;
    return { ok: true };
  } catch (err) {
    console.error("[sendContactMessage] error:", err);
    return { ok: false, message: "Κάτι πήγε στραβά. Δοκιμάστε ξανά." };
  }
}
