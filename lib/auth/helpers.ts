// =============================================================
// lib/auth/helpers.ts — Shared auth utility functions
// =============================================================
// All functions here use the BROWSER Supabase client and should
// only be called from "use client" components / event handlers.
//
// Functions:
//   signInWithGoogle()      — OAuth via Google
//   signInWithFacebook()    — OAuth via Facebook
//   signInWithEmail()       — Email + password sign-in
//   signUpWithEmail()       — Email + password registration
//   resetPassword()         — Send password-reset email
//   signOut()               — Clear session
//   getCurrentUser()        — Return the currently signed-in user
//   getUserRole()           — "professional" | "customer" | null
//
// OAuth redirect:
//   Both OAuth helpers redirect to /auth/callback, which is the
//   server route handler that exchanges the code for a session,
//   creates the customer record if needed, and redirects the user
//   to / or /dashboard based on their role.
// =============================================================

import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------
// OAuth — Social providers
// ---------------------------------------------------------------

/** Sign in (or sign up) via Google OAuth. Redirects browser away. */
export async function signInWithGoogle() {
  const supabase = createClient();
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

/** Sign in (or sign up) via Facebook OAuth. Redirects browser away. */
export async function signInWithFacebook() {
  const supabase = createClient();
  return supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

// ---------------------------------------------------------------
// Email / password
// ---------------------------------------------------------------

/** Sign in with email + password. Returns user/session or an error. */
export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

/**
 * Create a new account with email + password.
 * Supabase sends a verification email; the confirmation link
 * redirects to /auth/callback where the session is established
 * and the customer record is created.
 */
export async function signUpWithEmail(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

/**
 * Send a password-reset email.
 * The link in the email redirects to /auth/reset-password (future page).
 */
export async function resetPassword(email: string) {
  const supabase = createClient();
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
}

// ---------------------------------------------------------------
// Session management
// ---------------------------------------------------------------

/** Sign out the current user and clear all session cookies. */
export async function signOut() {
  const supabase = createClient();
  return supabase.auth.signOut();
}

/** Return the currently authenticated User, or null if not signed in. */
export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// ---------------------------------------------------------------
// Role detection
// ---------------------------------------------------------------

/**
 * Determine whether the current user is a professional or a customer.
 *
 * Logic: if a row exists in the `professionals` table with this
 * user's auth ID, they are a professional — otherwise a customer.
 *
 * Returns:
 *   "professional" — user has a row in professionals
 *   "customer"     — authenticated but no professional profile
 *   null           — not authenticated
 */
export async function getUserRole(): Promise<"professional" | "customer" | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return data ? "professional" : "customer";
}
