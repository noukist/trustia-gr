// =============================================================
// lib/email.ts
// =============================================================
// Thin wrapper around the Resend SDK.
//
// SETUP
//   1. Create a free account at resend.com
//   2. Add a sending domain (e.g. trustia.gr → verify DNS)
//   3. Set RESEND_API_KEY in your .env.local and Vercel env vars
//   4. Set RESEND_FROM_EMAIL to your verified sender address
//      e.g. "Trustia.gr <noreply@trustia.gr>"
//
// All transactional emails flow through sendEmail().
// If RESEND_API_KEY is missing, emails are silently skipped so
// development works without credentials.
// =============================================================

import { Resend } from "resend";

// ── Singleton Resend client ───────────────────────────────────
// Created lazily so missing env vars don't crash at import time.
let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

// ── Default sender ────────────────────────────────────────────
const FROM = process.env.RESEND_FROM_EMAIL ?? "Trustia.gr <noreply@trustia.gr>";

// ── sendEmail ─────────────────────────────────────────────────

interface SendEmailOptions {
  to:      string;
  subject: string;
  html:    string;
  /** Optional plain-text fallback */
  text?:   string;
}

/**
 * Send a transactional email via Resend.
 * Returns true on success, false on failure (non-throwing).
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<boolean> {
  const resend = getResend();

  // Skip silently in development / when key is not configured
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — email skipped:", subject);
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from:    FROM,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[email] Unexpected error:", err);
    return false;
  }
}
