// =============================================================
// app/login/page.tsx — Σύνδεση (Login)
// =============================================================
// "use client" — owns controlled form state, loading flags,
// and useRouter for post-auth redirection.
//
// Sections:
//   1. Logo + title
//   2. Google OAuth button
//   3. Facebook OAuth button
//   4. "ή με email" divider
//   5. Email + password form
//      - Forgot-password inline panel (toggled by link)
//   6. "Σύνδεση" submit button
//   7. Footer: link to /register
//
// Post-login redirect:
//   • Professional (has row in professionals table) → /dashboard
//   • Customer / new → /
// =============================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import {
  signInWithGoogle,
  signInWithFacebook,
  signInWithEmail,
  resetPassword,
  getUserRole,
} from "@/lib/auth/helpers";

// ---------------------------------------------------------------
// Brand icon helpers (inline SVG — lucide-react has no brand logos)
// ---------------------------------------------------------------
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
        fill="#1877F2"
      />
    </svg>
  );
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
export default function LoginPage() {
  const t      = useTranslations("auth");
  const router = useRouter();

  // Form state
  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [showPassword,  setShowPassword]  = useState(false);

  // Loading flags — separate per button to show the right spinner
  const [loadingGoogle,   setLoadingGoogle]   = useState(false);
  const [loadingFacebook, setLoadingFacebook] = useState(false);
  const [loadingEmail,    setLoadingEmail]    = useState(false);

  // Error / feedback
  const [error, setError] = useState<string | null>(null);

  // Forgot-password inline panel
  const [resetMode,    setResetMode]    = useState(false);
  const [resetEmail,   setResetEmail]   = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent,    setResetSent]    = useState(false);

  // ── Helpers ──────────────────────────────────────────────────

  /** After successful sign-in, route the user to the right page */
  async function redirectAfterLogin() {
    const role = await getUserRole();
    router.push(role === "professional" ? "/dashboard" : "/");
    router.refresh(); // force server component re-render with new session
  }

  // ── Handlers ──────────────────────────────────────────────────

  async function handleGoogle() {
    setError(null);
    setLoadingGoogle(true);
    const { error: err } = await signInWithGoogle();
    if (err) {
      setError(t("errors.googleFailed"));
      setLoadingGoogle(false);
    }
    // On success the browser navigates away — no need to set loading=false
  }

  async function handleFacebook() {
    setError(null);
    setLoadingFacebook(true);
    const { error: err } = await signInWithFacebook();
    if (err) {
      setError(t("errors.facebookFailed"));
      setLoadingFacebook(false);
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setError(null);
    setLoadingEmail(true);

    const { error: err } = await signInWithEmail(email.trim(), password);

    if (err) {
      // Map Supabase error messages to Greek user-facing text
      if (err.message.toLowerCase().includes("invalid login credentials")) {
        setError(t("errors.invalidCredentials"));
      } else if (err.message.toLowerCase().includes("email not confirmed")) {
        setError(t("errors.emailNotConfirmed"));
      } else {
        setError(err.message);
      }
      setLoadingEmail(false);
      return;
    }

    await redirectAfterLogin();
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setResetLoading(true);
    const { error: err } = await resetPassword(resetEmail.trim());
    setResetLoading(false);

    if (err) {
      setError(t("errors.resetFailed"));
    } else {
      setResetSent(true);
    }
  }

  // ── Shared input style ──────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1.5px solid var(--color-border)",
    borderRadius: "10px",
    padding: "0.75rem 1rem",
    fontSize: "0.9375rem",
    color: "var(--color-text)",
    outline: "none",
    backgroundColor: "#fff",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .auth-input:focus { border-color: var(--color-primary) !important; }
        .auth-social-btn:hover { background-color: #f5f5f5; }
        .auth-link:hover { text-decoration: underline; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.9s linear infinite; }
      `}</style>

      {/* Full-height centred wrapper */}
      <div
        style={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
          backgroundColor: "var(--color-bg-light)",
        }}
      >
        {/* Card */}
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            boxShadow: "0 4px 32px rgba(0,0,0,0.09)",
            padding: "2.5rem 2rem",
            border: "1px solid var(--color-border)",
          }}
        >
          {/* ── Logo ── */}
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <span
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "var(--color-primary)",
                }}
              >
                TRUSTIA
                <span style={{ color: "var(--color-accent)" }}>.GR</span>
              </span>
            </Link>
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--color-text)",
                margin: "0.5rem 0 0.25rem",
                letterSpacing: "-0.02em",
              }}
            >
              {t("loginTitle")}
            </h1>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: 0 }}>
              {t("loginSub")}
            </p>
          </div>

          {/* ── Error banner ── */}
          {error && (
            <div
              role="alert"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.5rem",
                backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "10px",
                padding: "0.75rem 1rem",
                marginBottom: "1.25rem",
                fontSize: "0.875rem",
                color: "#B91C1C",
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
              {error}
            </div>
          )}

          {/* ── OAuth: Google ── */}
          <button
            onClick={handleGoogle}
            disabled={loadingGoogle || loadingFacebook || loadingEmail}
            className="auth-social-btn"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.625rem",
              padding: "0.75rem",
              backgroundColor: "#ffffff",
              border: "1.5px solid var(--color-border)",
              borderRadius: "10px",
              fontSize: "0.9375rem",
              fontWeight: 600,
              color: "var(--color-text)",
              cursor: "pointer",
              transition: "background-color 0.15s",
              marginBottom: "0.625rem",
            }}
          >
            {loadingGoogle ? (
              <Loader2 size={20} className="spin" />
            ) : (
              <GoogleIcon />
            )}
            {t("continueGoogle")}
          </button>

          {/* ── OAuth: Facebook ── */}
          <button
            onClick={handleFacebook}
            disabled={loadingGoogle || loadingFacebook || loadingEmail}
            className="auth-social-btn"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.625rem",
              padding: "0.75rem",
              backgroundColor: "#ffffff",
              border: "1.5px solid var(--color-border)",
              borderRadius: "10px",
              fontSize: "0.9375rem",
              fontWeight: 600,
              color: "var(--color-text)",
              cursor: "pointer",
              transition: "background-color 0.15s",
              marginBottom: "1.5rem",
            }}
          >
            {loadingFacebook ? (
              <Loader2 size={20} className="spin" />
            ) : (
              <FacebookIcon />
            )}
            {t("continueFacebook")}
          </button>

          {/* ── Divider ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }} />
            <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
              {t("orEmail")}
            </span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }} />
          </div>

          {/* ── Forgot-password panel (replaces form when active) ── */}
          {resetMode ? (
            <div>
              {resetSent ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "1.5rem 0",
                    color: "var(--color-success)",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                  }}
                >
                  {t("resetSentPrefix")}{" "}
                  <strong>{resetEmail}</strong>.
                  <br />
                  {t("checkInbox")}
                </div>
              ) : (
                <form onSubmit={handleResetPassword}>
                  <label
                    htmlFor="reset-email"
                    style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.375rem" }}
                  >
                    {t("resetEmail")}
                  </label>
                  <div style={{ position: "relative", marginBottom: "1rem" }}>
                    <Mail
                      size={16}
                      style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }}
                    />
                    <input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="email@example.com"
                      required
                      autoComplete="email"
                      className="auth-input"
                      style={{ ...inputStyle, paddingLeft: "2.5rem" }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      backgroundColor: "var(--color-primary)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "10px",
                      fontSize: "0.9375rem",
                      fontWeight: 700,
                      cursor: resetLoading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      opacity: resetLoading ? 0.8 : 1,
                    }}
                  >
                    {resetLoading && <Loader2 size={17} className="spin" />}
                    {t("resetBtn")}
                  </button>
                </form>
              )}
              <button
                onClick={() => { setResetMode(false); setResetSent(false); setResetEmail(""); }}
                style={{ display: "block", margin: "1rem auto 0", background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem", color: "var(--color-text-muted)" }}
              >
                {t("backToLogin")}
              </button>
            </div>
          ) : (
            /* ── Email / password form ── */
            <form onSubmit={handleEmailLogin}>
              {/* Email */}
              <div style={{ marginBottom: "1rem" }}>
                <label
                  htmlFor="email"
                  style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.375rem" }}
                >
                  {t("emailLabel")}
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={16}
                    style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }}
                  />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                    autoComplete="email"
                    className="auth-input"
                    style={{ ...inputStyle, paddingLeft: "2.5rem" }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: "0.625rem" }}>
                <label
                  htmlFor="password"
                  style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.375rem" }}
                >
                  {t("passwordLabel")}
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={16}
                    style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }}
                  />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="auth-input"
                    style={{ ...inputStyle, paddingLeft: "2.5rem", paddingRight: "2.75rem" }}
                  />
                  {/* Show/hide toggle */}
                  <button
                    type="button"
                    aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                    onClick={() => setShowPassword((v) => !v)}
                    style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "0.125rem" }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Forgot password link */}
              <div style={{ textAlign: "right", marginBottom: "1.5rem" }}>
                <button
                  type="button"
                  onClick={() => { setResetMode(true); setResetEmail(email); setError(null); }}
                  className="auth-link"
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.8375rem", color: "var(--color-primary)", fontWeight: 500, padding: 0 }}
                >
                  {t("forgotPassword")}
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loadingEmail || loadingGoogle || loadingFacebook}
                style={{
                  width: "100%",
                  padding: "0.8125rem",
                  backgroundColor: "var(--color-primary)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "1rem",
                  fontWeight: 700,
                  cursor: loadingEmail ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  opacity: loadingEmail ? 0.8 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {loadingEmail && <Loader2 size={18} className="spin" />}
                {t("loginBtn")}
              </button>
            </form>
          )}

          {/* ── Footer: register link ── */}
          <p
            style={{
              textAlign: "center",
              marginTop: "1.75rem",
              fontSize: "0.875rem",
              color: "var(--color-text-muted)",
            }}
          >
            {t("noAccount")}{" "}
            <Link
              href="/register"
              style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}
            >
              {t("registerLink")}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
