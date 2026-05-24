// =============================================================
// app/auth/reset-password/page.tsx
// =============================================================
// Handles the second half of Supabase's password-reset flow.
//
// FLOW
//   1. User clicks "Ξέχασες τον κωδικό;" on /login
//   2. lib/auth/helpers.ts calls supabase.auth.resetPasswordForEmail()
//      with redirectTo: `/auth/reset-password`
//   3. Supabase emails a magic link; user clicks it
//   4. Supabase redirects here with an access_token in the URL hash
//   5. Supabase JS client picks up the token automatically (PKCE)
//   6. User types their new password; we call supabase.auth.updateUser()
//   7. On success: show confirmation and link back to /login
// =============================================================

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createClient();

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPwd,   setShowPwd]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες.");
      return;
    }
    if (password !== confirm) {
      setError("Οι κωδικοί δεν ταιριάζουν.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) throw updateErr;
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Σφάλμα. Δοκιμάστε ξανά.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight:       "calc(100vh - 128px)",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        padding:         "2rem 1rem",
        backgroundColor: "var(--color-bg-light)",
      }}
    >
      <div
        style={{
          width:           "100%",
          maxWidth:        "420px",
          backgroundColor: "#fff",
          borderRadius:    "16px",
          border:          "1.5px solid var(--color-border)",
          padding:         "2.5rem 2rem",
          boxShadow:       "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display:         "inline-flex",
              alignItems:      "center",
              justifyContent:  "center",
              width:           "52px",
              height:          "52px",
              backgroundColor: "var(--color-primary-bg)",
              borderRadius:    "50%",
              marginBottom:    "1rem",
            }}
          >
            <Lock size={22} style={{ color: "var(--color-primary)" }} />
          </div>
          <h1
            style={{
              fontSize:    "1.375rem",
              fontWeight:  800,
              color:       "var(--color-text)",
              margin:      "0 0 0.375rem",
            }}
          >
            Νέος Κωδικός Πρόσβασης
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: 0 }}>
            Εισάγετε τον νέο σας κωδικό παρακάτω.
          </p>
        </div>

        {/* Success state */}
        {success ? (
          <div style={{ textAlign: "center" }}>
            <CheckCircle2
              size={48}
              style={{ color: "#27AE60", marginBottom: "1rem" }}
            />
            <p
              style={{
                fontWeight:   700,
                fontSize:     "1rem",
                color:        "var(--color-text)",
                marginBottom: "0.5rem",
              }}
            >
              Ο κωδικός άλλαξε!
            </p>
            <p
              style={{
                fontSize:     "0.875rem",
                color:        "var(--color-text-muted)",
                marginBottom: "1.5rem",
              }}
            >
              Μπορείτε τώρα να συνδεθείτε με τον νέο σας κωδικό.
            </p>
            <Link
              href="/login"
              style={{
                display:         "inline-flex",
                alignItems:      "center",
                padding:         "0.625rem 1.5rem",
                backgroundColor: "var(--color-primary)",
                color:           "#fff",
                borderRadius:    "10px",
                fontWeight:      700,
                fontSize:        "0.9375rem",
                textDecoration:  "none",
              }}
            >
              Σύνδεση →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>

            {/* Error banner */}
            {error && (
              <div
                style={{
                  display:         "flex",
                  alignItems:      "flex-start",
                  gap:             "0.5rem",
                  padding:         "0.75rem 1rem",
                  backgroundColor: "rgba(231,76,60,0.08)",
                  border:          "1px solid rgba(231,76,60,0.3)",
                  borderRadius:    "8px",
                  color:           "#991B1B",
                  fontSize:        "0.875rem",
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
                {error}
              </div>
            )}

            {/* New password */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <label
                htmlFor="password"
                style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text)" }}
              >
                Νέος κωδικός *
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={16}
                  style={{
                    position: "absolute",
                    left:     "0.75rem",
                    top:      "50%",
                    transform:"translateY(-50%)",
                    color:    "var(--color-text-muted)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Τουλάχιστον 8 χαρακτήρες"
                  required
                  autoComplete="new-password"
                  style={{
                    width:        "100%",
                    padding:      "0.625rem 2.5rem 0.625rem 2.25rem",
                    border:       "1.5px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize:     "0.9rem",
                    fontFamily:   "inherit",
                    outline:      "none",
                    boxSizing:    "border-box",
                    color:        "var(--color-text)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? "Απόκρυψη κωδικού" : "Εμφάνιση κωδικού"}
                  style={{
                    position:  "absolute",
                    right:     "0.75rem",
                    top:       "50%",
                    transform: "translateY(-50%)",
                    background:"none",
                    border:    "none",
                    cursor:    "pointer",
                    padding:   0,
                    color:     "var(--color-text-muted)",
                  }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <label
                htmlFor="confirm"
                style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text)" }}
              >
                Επιβεβαίωση κωδικού *
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={16}
                  style={{
                    position: "absolute",
                    left:     "0.75rem",
                    top:      "50%",
                    transform:"translateY(-50%)",
                    color:    "var(--color-text-muted)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  id="confirm"
                  type={showPwd ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Επαναλάβετε τον κωδικό"
                  required
                  autoComplete="new-password"
                  style={{
                    width:        "100%",
                    padding:      "0.625rem 0.875rem 0.625rem 2.25rem",
                    border:       `1.5px solid ${confirm && confirm !== password ? "#E74C3C" : "var(--color-border)"}`,
                    borderRadius: "8px",
                    fontSize:     "0.9rem",
                    fontFamily:   "inherit",
                    outline:      "none",
                    boxSizing:    "border-box",
                    color:        "var(--color-text)",
                  }}
                />
              </div>
              {confirm && confirm !== password && (
                <p style={{ fontSize: "0.775rem", color: "#E74C3C", margin: 0 }}>
                  Οι κωδικοί δεν ταιριάζουν.
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                display:         "flex",
                alignItems:      "center",
                justifyContent:  "center",
                gap:             "0.5rem",
                width:           "100%",
                padding:         "0.75rem",
                backgroundColor: "var(--color-primary)",
                color:           "#fff",
                border:          "none",
                borderRadius:    "10px",
                fontSize:        "0.9375rem",
                fontWeight:      700,
                fontFamily:      "inherit",
                cursor:          loading ? "wait" : "pointer",
                marginTop:       "0.25rem",
              }}
            >
              {loading ? (
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                "Αλλαγή Κωδικού"
              )}
            </button>

            <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>
              <Link href="/login" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
                ← Πίσω στη Σύνδεση
              </Link>
            </p>
          </form>
        )}
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </main>
  );
}
