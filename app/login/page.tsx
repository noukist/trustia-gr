// =============================================================
// app/login/page.tsx — Login page for Trustia.gr
// =============================================================
// URL: trustia.gr/login
//
// This page handles authentication for all user types:
// - Customers sign in with Google (primary), Facebook, Apple
// - After first login, they confirm display name + phone
// - Professionals use the /register page instead
//
// Uses Supabase Auth which handles all the OAuth complexity:
// - Redirects to Google's login screen
// - Receives the token back
// - Creates a user in Supabase's auth.users table
// - Sets a session cookie in the browser
//
// After successful login, users are redirected to homepage.
// Later: redirect to customer dashboard or professional dashboard
// based on their role in the database.
// =============================================================

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function LoginPage() {
  // Track loading state while OAuth redirect happens
  const [loading, setLoading] = useState(false);

  // Track any error messages to show the user
  const [error, setError] = useState("");

  // Language — hardcoded for now, will use context later
  const lang = "el";
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  // ─── GOOGLE LOGIN ───
  // Calls Supabase Auth to start the Google OAuth flow.
  // The user is redirected to Google's login page.
  // After login, Google redirects back to our callback URL.
  // Supabase handles the token exchange automatically.
  async function handleGoogleLogin() {
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Where to redirect after successful login
          redirectTo: window.location.origin + "/",
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
      // If no error, the browser is redirecting to Google — don't setLoading(false)
    } catch {
      setError(t("Κάτι πήγε στραβά. Δοκιμάστε ξανά.", "Something went wrong. Try again."));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        {/* ─── CARD ─── */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          {/* ─── HEADING ─── */}
          <h1
            className="text-2xl font-bold text-center mb-2"
            style={{ color: "var(--color-primary)" }}
          >
            {t("Σύνδεση", "Sign In")}
          </h1>
          <p className="text-center text-gray-500 text-sm mb-8">
            {t(
              "Συνδεθείτε για να κλείσετε ραντεβού και να αφήσετε κριτικές",
              "Sign in to book appointments and leave reviews"
            )}
          </p>

          {/* ─── GOOGLE LOGIN BUTTON ─── */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="
              w-full flex items-center justify-center gap-3
              px-4 py-3 border-2 border-gray-200 rounded-xl
              text-sm font-medium text-gray-700
              hover:bg-gray-50 hover:border-gray-300
              transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {/* Google icon — simple SVG */}
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {loading
              ? t("Μετάβαση στο Google...", "Redirecting to Google...")
              : t("Συνέχεια με Google", "Continue with Google")}
          </button>

          {/* ─── DIVIDER ─── */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-gray-400">
              {t("Σύντομα και με", "Coming soon with")}
            </span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* ─── FUTURE PROVIDERS ─── */}
          {/* Facebook and Apple login — disabled for now */}
          <div className="space-y-3">
            <button
              disabled
              className="
                w-full flex items-center justify-center gap-3
                px-4 py-3 border-2 border-gray-100 rounded-xl
                text-sm text-gray-400
                cursor-not-allowed
              "
            >
              {t("Facebook (σύντομα)", "Facebook (coming soon)")}
            </button>
            <button
              disabled
              className="
                w-full flex items-center justify-center gap-3
                px-4 py-3 border-2 border-gray-100 rounded-xl
                text-sm text-gray-400
                cursor-not-allowed
              "
            >
              {t("Apple (σύντομα)", "Apple (coming soon)")}
            </button>
          </div>

          {/* ─── ERROR MESSAGE ─── */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* ─── PROFESSIONAL LINK ─── */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            {t("Είσαι επαγγελματίας;", "Are you a professional?")}
          </p>
          <Link
            href="/register"
            className="text-sm font-semibold hover:underline"
            style={{ color: "var(--color-primary)" }}
          >
            {t("Εγγραφή Επαγγελματία →", "Professional Registration →")}
          </Link>
        </div>
      </div>
    </div>
  );
}