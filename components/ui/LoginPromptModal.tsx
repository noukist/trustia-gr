// =============================================================
// components/ui/LoginPromptModal.tsx
// =============================================================
// Reusable auth-gate modal used whenever a gated action is
// triggered by a logged-out user (phone reveal, booking, reviews…).
//
// FEATURES
//   - Google OAuth button  → calls signInWithGoogle() directly
//   - Facebook OAuth button → calls signInWithFacebook() directly
//   - "ή με email" divider
//   - "Σύνδεση με Email" link → /login (preserves current URL as ?next=)
//   - "Εγγραφή δωρεάν" link → /register
//   - Customisable title + message via props
//   - Overlay click closes; Escape key closes
//   - Accessible: focus trap hint via aria-modal
//
// USAGE
//   import LoginPromptModal from "@/components/ui/LoginPromptModal"
//
//   const [showModal, setShowModal] = useState(false)
//
//   {showModal && (
//     <LoginPromptModal
//       message="Συνδεθείτε για να δείτε τα στοιχεία επικοινωνίας"
//       onClose={() => setShowModal(false)}
//     />
//   )}
// =============================================================

"use client";

import React, { useEffect, useState } from "react";
import { Link, usePathname }           from "@/i18n/navigation";
import { X, Mail, LogIn }              from "lucide-react";
import { useTranslations }             from "next-intl";
import { signInWithGoogle, signInWithFacebook } from "@/lib/auth/helpers";

// ── Props ──────────────────────────────────────────────────────
interface LoginPromptModalProps {
  /** Sentence shown below the title explaining WHY login is required */
  message?: string;
  onClose: () => void;
}

// ── Component ──────────────────────────────────────────────────
export default function LoginPromptModal({
  message,
  onClose,
}: LoginPromptModalProps) {
  const t        = useTranslations("auth");
  const tc       = useTranslations("common");
  const pathname = usePathname();

  // Track loading state for each OAuth provider to give visual feedback
  const [loadingGoogle,   setLoadingGoogle]   = useState(false);
  const [loadingFacebook, setLoadingFacebook] = useState(false);

  // ── Close on Escape key ───────────────────────────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // ── Prevent body scroll while modal is open ───────────────
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // ── OAuth handlers ─────────────────────────────────────────
  async function handleGoogle() {
    setLoadingGoogle(true);
    try {
      await signInWithGoogle();
      // signInWithGoogle() redirects the browser away; no cleanup needed
    } catch {
      setLoadingGoogle(false);
    }
  }

  async function handleFacebook() {
    setLoadingFacebook(true);
    try {
      await signInWithFacebook();
    } catch {
      setLoadingFacebook(false);
    }
  }

  // ── /login URL with ?next= so the user returns here after login ──
  const loginHref    = `/login?next=${encodeURIComponent(pathname)}`;
  const registerHref = `/register?next=${encodeURIComponent(pathname)}`;

  return (
    /* ── Backdrop ── */
    <div
      onClick={onClose}
      role="presentation"
      style={{
        position:        "fixed",
        inset:           0,
        backgroundColor: "rgba(0,0,0,0.55)",
        zIndex:          600,
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        padding:         "1rem",
        backdropFilter:  "blur(2px)",
      }}
    >
      {/* ── Modal card ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#fff",
          borderRadius:    "20px",
          padding:         "2rem 1.75rem",
          maxWidth:        "400px",
          width:           "100%",
          position:        "relative",
          boxShadow:       "0 24px 80px rgba(0,0,0,0.22)",
        }}
      >
        {/* ── Close button ── */}
        <button
          type="button"
          onClick={onClose}
          aria-label={tc("close")}
          style={{
            position:        "absolute",
            top:             "1rem",
            right:           "1rem",
            background:      "none",
            border:          "none",
            cursor:          "pointer",
            color:           "var(--color-text-muted)",
            display:         "flex",
            padding:         "4px",
            borderRadius:    "6px",
            transition:      "color 0.15s",
          }}
        >
          <X size={20} />
        </button>

        {/* ── Brand icon + title ── */}
        <div
          style={{
            width:           "52px",
            height:          "52px",
            borderRadius:    "14px",
            background:      "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, #1a6f6f))",
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            marginBottom:    "1.125rem",
          }}
        >
          <LogIn size={24} color="#fff" />
        </div>

        <h2
          id="login-modal-title"
          style={{
            fontSize:     "1.1875rem",
            fontWeight:   800,
            color:        "var(--color-text)",
            margin:       "0 0 0.4rem",
            lineHeight:   1.3,
          }}
        >
          {t("loginRequired")}
        </h2>

        <p
          style={{
            fontSize:     "0.9rem",
            color:        "var(--color-text-muted)",
            margin:       "0 0 1.625rem",
            lineHeight:   1.55,
          }}
        >
          {message}
        </p>

        {/* ── OAuth buttons ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loadingGoogle || loadingFacebook}
            style={{
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              gap:             "0.625rem",
              padding:         "0.8125rem",
              border:          "1.5px solid var(--color-border)",
              borderRadius:    "10px",
              backgroundColor: "#fff",
              cursor:          loadingGoogle ? "wait" : "pointer",
              fontWeight:      600,
              fontSize:        "0.9375rem",
              color:           "var(--color-text)",
              fontFamily:      "inherit",
              opacity:         (loadingGoogle || loadingFacebook) ? 0.65 : 1,
              transition:      "background-color 0.15s",
            }}
          >
            {/* Google "G" logo — inline SVG so no extra dependency */}
            {loadingGoogle ? (
              <span style={{ width: 20, height: 20, display: "inline-block" }}>⏳</span>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {loadingGoogle ? tc("loading") : t("continueGoogle")}
          </button>

          {/* Facebook */}
          <button
            type="button"
            onClick={handleFacebook}
            disabled={loadingGoogle || loadingFacebook}
            style={{
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              gap:             "0.625rem",
              padding:         "0.8125rem",
              border:          "none",
              borderRadius:    "10px",
              backgroundColor: "#1877F2",
              cursor:          loadingFacebook ? "wait" : "pointer",
              fontWeight:      600,
              fontSize:        "0.9375rem",
              color:           "#fff",
              fontFamily:      "inherit",
              opacity:         (loadingGoogle || loadingFacebook) ? 0.65 : 1,
              transition:      "opacity 0.15s",
            }}
          >
            {loadingFacebook ? (
              tc("loading")
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                {t("continueFacebook")}
              </>
            )}
          </button>

          {/* Divider */}
          <div
            style={{
              display:    "flex",
              alignItems: "center",
              gap:        "0.75rem",
              margin:     "0.25rem 0",
            }}
          >
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }} />
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
              {t("orEmail")}
            </span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }} />
          </div>

          {/* Email login link */}
          <Link
            href={loginHref}
            style={{
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              gap:             "0.5rem",
              padding:         "0.8125rem",
              border:          "1.5px solid var(--color-primary)",
              borderRadius:    "10px",
              color:           "var(--color-primary)",
              fontWeight:      600,
              fontSize:        "0.9375rem",
              textDecoration:  "none",
              transition:      "background-color 0.15s",
            }}
          >
            <Mail size={16} />
            {t("loginWithEmail")}
          </Link>

          {/* Register link */}
          <p
            style={{
              textAlign:  "center",
              fontSize:   "0.8125rem",
              color:      "var(--color-text-muted)",
              margin:     "0.25rem 0 0",
            }}
          >
            {t("noAccount")}{" "}
            <Link
              href={registerHref}
              style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}
            >
              {t("registerFreeLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
