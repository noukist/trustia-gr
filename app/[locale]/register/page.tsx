// =============================================================
// app/register/page.tsx — Εγγραφή (Customer Registration)
// =============================================================
// "use client" — owns form state, loading, GDPR checkboxes.
//
// Sections:
//   1. Logo + title
//   2. Google OAuth button
//   3. Facebook OAuth button
//   4. "ή με email" divider
//   5. Email + password + confirm-password form
//   6. GDPR checkbox (required) — per PRD §4.6
//   7. Marketing checkbox (optional) — per PRD §4.6
//   8. "Εγγραφή" button
//   9. Footer: professional registration link + login link
//
// Post-signup states:
//   • Email confirmation enabled (typical Supabase default):
//     Show "check your email" success card.
//   • Email confirmation disabled (local dev / test):
//     `data.session` is non-null → role check → redirect.
//   • OAuth: browser is redirected to /auth/callback immediately.
//
// Customer record creation:
//   Handled in /auth/callback to ensure it runs after email
//   verification. If email confirmation is disabled and the user
//   gets a session immediately, we insert the record here too.
// =============================================================

"use client";

import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Check } from "lucide-react";
import {
  signInWithGoogle,
  signInWithFacebook,
  signUpWithEmail,
  getUserRole,
} from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------
// Brand icon helpers (inline SVG)
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
export default function RegisterPage() {
  const t      = useTranslations("auth");
  const router = useRouter();

  // Form fields
  const [email,            setEmail]            = useState("");
  const [password,         setPassword]         = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [showPassword,     setShowPassword]     = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);

  // GDPR checkboxes (PRD §4.6)
  const [gdprAccepted,    setGdprAccepted]    = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);

  // Loading flags per button
  const [loadingGoogle,   setLoadingGoogle]   = useState(false);
  const [loadingFacebook, setLoadingFacebook] = useState(false);
  const [loadingEmail,    setLoadingEmail]    = useState(false);

  // Feedback
  const [error,           setError]           = useState<string | null>(null);
  // success = "verify" | "redirect" — drives the success card
  const [success,         setSuccess]         = useState<"verify" | "redirect" | null>(null);
  const [successEmail,    setSuccessEmail]     = useState("");

  // ── Helpers ─────────────────────────────────────────────────

  function validatePassword(): string | null {
    if (password.length < 8)          return t("passwordTooShort");
    if (password !== confirmPassword)  return t("passwordMismatch");
    return null;
  }

  // ── Handlers ─────────────────────────────────────────────────

  async function handleGoogle() {
    setError(null);
    setLoadingGoogle(true);
    const { error: err } = await signInWithGoogle();
    if (err) {
      setError(t("errors.googleFailed"));
      setLoadingGoogle(false);
    }
    // On success the browser navigates to /auth/callback
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

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!gdprAccepted) {
      setError(t("gdprRequiredError"));
      return;
    }

    const passwordError = validatePassword();
    if (passwordError) { setError(passwordError); return; }

    setLoadingEmail(true);

    const { data, error: signUpError } = await signUpWithEmail(email.trim(), password);

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes("already registered")) {
        setError(t("errors.alreadyRegistered"));
      } else {
        setError(signUpError.message);
      }
      setLoadingEmail(false);
      return;
    }

    // ── Duplicate email detection (email-confirmation ON) ────────
    // Supabase silently swallows duplicate signups to prevent
    // user-enumeration attacks, but the response shape differs:
    //
    //   Confirmed duplicate:   user=null, session=null, error=null
    //   Unconfirmed duplicate: user={ identities:[] }, session=null, error=null
    //
    // In both cases we show the "already registered" error instead
    // of the misleading "check your email" success screen.
    const isConfirmedDuplicate   = !data.user && !data.session;
    const isUnconfirmedDuplicate = data.user != null && (data.user.identities?.length ?? 0) === 0;

    if (isConfirmedDuplicate || isUnconfirmedDuplicate) {
      setError(t("errors.alreadyRegistered"));
      setLoadingEmail(false);
      return;
    }

    setSuccessEmail(email.trim());

    if (data.session && data.user) {
      // Email confirmation is disabled — user is immediately signed in.
      // Create the customer record now and redirect.
      try {
        const supabase = createClient();
        await supabase.from("customers").insert({
          user_id: data.user.id,
          email:   data.user.email,
          marketing_consent: marketingAccepted,
        });
      } catch {
        // Non-fatal — record creation will be retried by /auth/callback
      }

      const role = await getUserRole();
      router.push(role === "professional" ? "/dashboard" : "/");
      router.refresh();
      return;
    }

    // Standard case: email confirmation required
    setSuccess("verify");
    setLoadingEmail(false);
  }

  // ── Shared styles ─────────────────────────────────────────────
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

  // ── Success: email verification card ─────────────────────────
  if (success === "verify") {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
          background: [
            "radial-gradient(ellipse 70% 50% at 70% 20%, rgba(42,143,143,0.10) 0%, transparent 70%)",
            "radial-gradient(ellipse 60% 50% at 15% 85%, rgba(212,160,57,0.08) 0%, transparent 65%)",
            "var(--color-bg-light)",
          ].join(", "),
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            boxShadow: "0 4px 32px rgba(0,0,0,0.09)",
            padding: "2.5rem 2rem",
            border: "1px solid var(--color-border)",
            textAlign: "center",
          }}
        >
          {/* Green check circle */}
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "var(--color-primary-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}
          >
            <Check size={28} style={{ color: "var(--color-primary)" }} strokeWidth={2.5} />
          </div>

          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 800,
              color: "var(--color-text)",
              margin: "0 0 0.5rem",
              letterSpacing: "-0.02em",
            }}
          >
            {t("successVerifyTitle")}
          </h2>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", lineHeight: 1.65, margin: "0 0 1.5rem" }}>
            {t("successVerifyPrefix")}{" "}
            <strong style={{ color: "var(--color-text)" }}>{successEmail}</strong>.
            <br />
            {t("successVerifyLine2")}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            {t("successNotArrived")}{" "}
            <button
              onClick={() => { setSuccess(null); setError(null); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", fontWeight: 600, padding: 0, fontSize: "inherit" }}
            >
              {t("successTryAgain")}
            </button>
            .
          </p>

          <Link
            href="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "1.5rem",
              padding: "0.625rem 1.5rem",
              border: "1.5px solid var(--color-primary)",
              borderRadius: "8px",
              color: "var(--color-primary)",
              fontWeight: 600,
              fontSize: "0.9rem",
              textDecoration: "none",
            }}
          >
            {t("goToLogin")}
          </Link>
        </div>
      </div>
    );
  }

  // ── Main registration form ─────────────────────────────────
  return (
    <>
      <style>{`
        .auth-input:focus { border-color: var(--color-primary) !important; }
        .auth-social-btn:hover { background-color: #f5f5f5; }
        .auth-checkbox-label:hover { color: var(--color-text); }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.9s linear infinite; }
      `}</style>

      {/* Full-height centred wrapper — brand gradient fills the background */}
      <div
        style={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
          background: [
            "radial-gradient(ellipse 70% 50% at 70% 20%, rgba(42,143,143,0.10) 0%, transparent 70%)",
            "radial-gradient(ellipse 60% 50% at 15% 85%, rgba(212,160,57,0.08) 0%, transparent 65%)",
            "var(--color-bg-light)",
          ].join(", "),
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "440px",
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
              <span style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--color-primary)" }}>
                TRUSTIA<span style={{ color: "var(--color-accent)" }}>.GR</span>
              </span>
            </Link>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)", margin: "0.5rem 0 0.25rem", letterSpacing: "-0.02em" }}>
              {t("registerTitle")}
            </h1>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: 0 }}>
              {t("registerSubCustomer")}
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
            {loadingGoogle ? <Loader2 size={20} className="spin" /> : <GoogleIcon />}
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
            {loadingFacebook ? <Loader2 size={20} className="spin" /> : <FacebookIcon />}
            {t("continueFacebook")}
          </button>

          {/* ── Divider ── */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }} />
            <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", fontWeight: 500 }}>{t("orEmail")}</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }} />
          </div>

          {/* ── Registration form ── */}
          <form onSubmit={handleRegister}>
            {/* Email */}
            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="email" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.375rem" }}>
                {t("emailLabel")}
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
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
            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="password" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.375rem" }}>
                {t("passwordLabel")}{" "}
                <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--color-text-muted)" }}>({t("passwordHint")})</span>
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="auth-input"
                  style={{ ...inputStyle, paddingLeft: "2.5rem", paddingRight: "2.75rem" }}
                />
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

            {/* Confirm password */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label htmlFor="confirmPassword" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.375rem" }}>
                {t("passwordConfirmLabel")}
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="auth-input"
                  style={{ ...inputStyle, paddingLeft: "2.5rem", paddingRight: "2.75rem" }}
                />
                <button
                  type="button"
                  aria-label={showConfirm ? t("hideConfirm") : t("showConfirm")}
                  onClick={() => setShowConfirm((v) => !v)}
                  style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "0.125rem" }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* ── GDPR checkboxes (PRD §4.6) ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginBottom: "1.75rem" }}>

              {/* Checkbox 1 — Required: Terms acceptance */}
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.625rem",
                  cursor: "pointer",
                  fontSize: "0.8375rem",
                  color: "var(--color-text-muted)",
                  lineHeight: 1.5,
                }}
              >
                <input
                  type="checkbox"
                  checked={gdprAccepted}
                  onChange={(e) => setGdprAccepted(e.target.checked)}
                  required
                  style={{ width: "16px", height: "16px", marginTop: "1px", flexShrink: 0, accentColor: "var(--color-primary)", cursor: "pointer" }}
                />
                <span>
                  {t("gdprAcceptPrefix")}{" "}
                  <Link href="/terms" style={{ color: "var(--color-primary)", fontWeight: 600 }} target="_blank">
                    {t("gdprTermsLink")}
                  </Link>{" "}
                  {t("gdprAcceptMiddle")}{" "}
                  <Link href="/privacy" style={{ color: "var(--color-primary)", fontWeight: 600 }} target="_blank">
                    {t("gdprPrivacyLink")}
                  </Link>
                  . <span style={{ color: "var(--color-danger)", fontWeight: 600 }}>*</span>
                </span>
              </label>

              {/* Checkbox 2 — Optional: Marketing consent */}
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.625rem",
                  cursor: "pointer",
                  fontSize: "0.8375rem",
                  color: "var(--color-text-muted)",
                  lineHeight: 1.5,
                }}
              >
                <input
                  type="checkbox"
                  checked={marketingAccepted}
                  onChange={(e) => setMarketingAccepted(e.target.checked)}
                  style={{ width: "16px", height: "16px", marginTop: "1px", flexShrink: 0, accentColor: "var(--color-primary)", cursor: "pointer" }}
                />
                <span>{t("gdprMarketing")}</span>
              </label>
            </div>

            {/* ── Submit ── */}
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
              {t("registerBtn")}
            </button>
          </form>

          {/* ── Footer ── */}
          <div style={{ marginTop: "1.75rem", display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center", textAlign: "center" }}>
            {/* Professional registration CTA */}
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: 0 }}>
              {t("proRegisterCta")}{" "}
              <Link
                href="/register/professional"
                style={{ color: "var(--color-accent)", fontWeight: 700, textDecoration: "none" }}
              >
                {t("proRegisterLink")}
              </Link>
            </p>

            {/* Login link */}
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: 0 }}>
              {t("hasAccount")}{" "}
              <Link href="/login" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
                {t("loginLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
