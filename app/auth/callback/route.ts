// =============================================================
// app/auth/callback/route.ts — OAuth / email-verify callback
// =============================================================
// Supabase redirects here after:
//   • Google / Facebook OAuth (PKCE flow — "code" param)
//   • Email verification link
//   • Password-reset confirmation
//
// Flow:
//   1. Exchange the one-time "code" for a session (sets cookies)
//   2. For new users: create a minimal customer record
//   3. Check whether the user is a professional
//   4. Redirect to /dashboard (professional) or / (customer)
//
// If anything goes wrong, redirect to /login with an error flag
// so the page can show a user-friendly message.
//
// Uses the SERVER Supabase client so it can set auth cookies on
// the response — the browser client cannot do this server-side.
// =============================================================

import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url      = new URL(request.url);
  const code     = url.searchParams.get("code");
  // Optional ?next= parameter lets protected pages redirect back after auth
  const next     = url.searchParams.get("next") ?? "/";
  const origin   = url.origin;

  // No code → something went wrong upstream; send to login with error
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", origin));
  }

  const supabase = await createClient();

  // ── Step 1: Exchange the PKCE code for a session ─────────────
  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

  if (sessionError) {
    console.error("[auth/callback] exchangeCodeForSession error:", sessionError.message);
    return NextResponse.redirect(new URL("/login?error=exchange", origin));
  }

  // ── Step 2: Identify the authenticated user ───────────────────
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("[auth/callback] getUser error:", userError?.message);
    return NextResponse.redirect(new URL("/login?error=user", origin));
  }

  // ── Step 3: Create a customer record for brand-new users ─────
  // Check whether a customer row already exists for this auth ID.
  // If not (first-ever login), insert a minimal record.
  // Failures are non-fatal — we log them and continue.
  try {
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingCustomer) {
      // Only create if there's also no professional row —
      // a professional signing in via OAuth for the first time
      // should NOT get a customer record created here.
      const { data: existingPro } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existingPro) {
        const { error: insertError } = await supabase
          .from("customers")
          .insert({ user_id: user.id, email: user.email });

        if (insertError) {
          // RLS or schema issue — non-fatal, log and continue
          console.warn("[auth/callback] customer insert warning:", insertError.message);
        }
      }
    }
  } catch (err) {
    // Non-fatal — auth session is already valid
    console.warn("[auth/callback] customer check error:", err);
  }

  // ── Step 4: Role-based redirect ────────────────────────────────
  // Check whether the user has a professional profile.
  // Professionals go to their dashboard; customers go to the homepage.
  try {
    const { data: professional } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (professional) {
      return NextResponse.redirect(new URL("/dashboard", origin));
    }
  } catch {
    // If the role check fails, default to homepage — non-fatal
  }

  // Customer or new user → homepage (or ?next= destination)
  return NextResponse.redirect(new URL(next, origin));
}
