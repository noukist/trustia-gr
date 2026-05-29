// =============================================================
// components/profile/CustomerProfileForm.tsx
// =============================================================
// Client Component — interactive profile editor for customers.
//
// Renders an editable form for:
//   - Display name
//   - Phone number
//   - Email (read-only; managed by OAuth or Supabase Auth)
//   - Marketing consent checkbox
//
// On save, performs an upsert to the `customers` table via the
// Supabase browser client. If no customers row exists yet (new
// OAuth user who hasn't saved before), it inserts one.
//
// Props are passed from the parent Server Component which already
// fetched the data — this component receives only what it needs.
// =============================================================

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

// ── Props ─────────────────────────────────────────────────────

interface CustomerProfileFormProps {
  /** Supabase auth user id */
  userId: string;
  /** customers.id — null if the row doesn't exist yet */
  customerId: string | null;
  /** Pre-filled values from DB or auth metadata */
  initialDisplayName: string;
  initialPhone: string;
  initialEmail: string;
  initialMarketingConsent: boolean;
  /** True when logged in via Google or Facebook */
  isOAuth: boolean;
}

// ── Component ─────────────────────────────────────────────────

export default function CustomerProfileForm({
  userId,
  customerId,
  initialDisplayName,
  initialPhone,
  initialEmail,
  initialMarketingConsent,
  isOAuth,
}: CustomerProfileFormProps) {
  const t = useTranslations("myProfile");

  // ── Personal info state ───────────────────────────────────
  const [displayName, setDisplayName]           = useState(initialDisplayName);
  const [phone, setPhone]                       = useState(initialPhone);
  const [marketingConsent, setMarketingConsent] = useState(initialMarketingConsent);
  const [status, setStatus]                     = useState<"idle" | "saving" | "saved" | "error">("idle");

  // ── Password change state (non-OAuth only) ────────────────
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwStatus, setPwStatus]               = useState<
    "idle" | "saving" | "saved" | "error" | "mismatch" | "tooshort"
  >("idle");

  // ── Save handler ──────────────────────────────────────────

  async function handleSave() {
    setStatus("saving");

    const supabase = createClient(); // createBrowserClient returns a singleton — safe to call here

    const payload = {
      user_id:            userId,
      display_name:       displayName.trim() || null,
      phone:              phone.trim() || null,
      email:              initialEmail,
      marketing_consent:  marketingConsent,
      updated_at:         new Date().toISOString(),
    };

    let error: { message: string } | null = null;

    if (customerId) {
      // Row already exists — update it
      ({ error } = await supabase
        .from("customers")
        .update(payload)
        .eq("id", customerId));
    } else {
      // First save for this user — insert a new row
      ({ error } = await supabase
        .from("customers")
        .insert(payload));
    }

    if (error) {
      console.error("[CustomerProfileForm] save error:", error.message);
      setStatus("error");
    } else {
      setStatus("saved");
      // Reset status indicator after 3 seconds
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  // ── Change password handler ───────────────────────────────
  async function handleChangePassword() {
    // Client-side validation first
    if (newPassword.length < 8) {
      setPwStatus("tooshort");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwStatus("mismatch");
      return;
    }

    setPwStatus("saving");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      console.error("[CustomerProfileForm] password change error:", error.message);
      setPwStatus("error");
    } else {
      setPwStatus("saved");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwStatus("idle"), 4000);
    }
  }

  // ── Shared styles ─────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem 0.875rem",
    border: "1.5px solid var(--color-border)",
    borderRadius: "8px",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    color: "var(--color-text)",
    backgroundColor: "#ffffff",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "var(--color-text)",
    marginBottom: "0.375rem",
  };

  // ── Render ────────────────────────────────────────────────

  return (
    <>
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1.5px solid var(--color-border)",
        borderRadius: "16px",
        padding: "1.5rem",
        marginBottom: isOAuth ? undefined : "1.25rem",
      }}
    >
      {/* Section heading */}
      <h2
        style={{
          fontSize: "1rem",
          fontWeight: 700,
          color: "var(--color-text)",
          margin: "0 0 1.5rem",
        }}
      >
        {t("personalInfo")}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* ── Display name ── */}
        <div>
          <label style={labelStyle}>{t("displayNameLabel")}</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={inputStyle}
            autoComplete="name"
            disabled={status === "saving"}
          />
        </div>

        {/* ── Phone ── */}
        <div>
          <label style={labelStyle}>{t("phoneLabel")}</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
            autoComplete="tel"
            disabled={status === "saving"}
          />
        </div>

        {/* ── Email (read-only) ── */}
        <div>
          <label style={labelStyle}>{t("emailLabel")}</label>
          <input
            type="email"
            value={initialEmail}
            readOnly
            style={{
              ...inputStyle,
              backgroundColor: "var(--color-bg-light)",
              color: "var(--color-text-muted)",
              cursor: "default",
            }}
          />
          {/* Note for OAuth users whose email is controlled by Google / Facebook */}
          {isOAuth && (
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-text-muted)",
                margin: "0.375rem 0 0",
                lineHeight: 1.5,
              }}
            >
              {t("emailNote")}
            </p>
          )}
        </div>

        {/* ── Marketing consent ── */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
          <input
            type="checkbox"
            id="marketing-consent"
            checked={marketingConsent}
            onChange={(e) => setMarketingConsent(e.target.checked)}
            disabled={status === "saving"}
            style={{
              marginTop: "0.15rem",
              width: "16px",
              height: "16px",
              flexShrink: 0,
              accentColor: "var(--color-primary)",
              cursor: "pointer",
            }}
          />
          <label
            htmlFor="marketing-consent"
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text)",
              cursor: "pointer",
              lineHeight: 1.55,
            }}
          >
            {t("marketingLabel")}
          </label>
        </div>

        {/* ── Save row ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            paddingTop: "0.75rem",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <button
            onClick={handleSave}
            disabled={status === "saving"}
            style={{
              padding: "0.625rem 1.5rem",
              backgroundColor:
                status === "saving" ? "var(--color-border)" : "var(--color-primary)",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: status === "saving" ? "default" : "pointer",
              transition: "background-color 0.15s ease",
            }}
          >
            {status === "saving" ? t("saving") : t("saveBtn")}
          </button>

          {/* Inline feedback */}
          {status === "saved" && (
            <span style={{ fontSize: "0.875rem", color: "#059669", fontWeight: 600 }}>
              {t("saved")}
            </span>
          )}
          {status === "error" && (
            <span style={{ fontSize: "0.875rem", color: "#DC2626", fontWeight: 600 }}>
              {t("saveError")}
            </span>
          )}
        </div>

      </div>
    </div>

    {/* ── Change Password card (hidden for OAuth users) ── */}
    {!isOAuth && (
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1.5px solid var(--color-border)",
          borderRadius: "16px",
          padding: "1.5rem",
        }}
      >
        <h2
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: "var(--color-text)",
            margin: "0 0 1.5rem",
          }}
        >
          {t("passwordSection")}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* New password */}
          <div>
            <label style={labelStyle}>{t("newPasswordLabel")}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPwStatus("idle"); }}
              style={inputStyle}
              autoComplete="new-password"
              disabled={pwStatus === "saving"}
            />
          </div>

          {/* Confirm password */}
          <div>
            <label style={labelStyle}>{t("confirmPasswordLabel")}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setPwStatus("idle"); }}
              style={inputStyle}
              autoComplete="new-password"
              disabled={pwStatus === "saving"}
            />
            {/* Validation hints shown inline below confirm field */}
            {pwStatus === "mismatch" && (
              <p style={{ fontSize: "0.8rem", color: "#DC2626", margin: "0.375rem 0 0" }}>
                {t("passwordMismatch")}
              </p>
            )}
            {pwStatus === "tooshort" && (
              <p style={{ fontSize: "0.8rem", color: "#DC2626", margin: "0.375rem 0 0" }}>
                {t("passwordTooShort")}
              </p>
            )}
          </div>

          {/* Save password row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              paddingTop: "0.75rem",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <button
              onClick={handleChangePassword}
              disabled={pwStatus === "saving" || !newPassword}
              style={{
                padding: "0.625rem 1.5rem",
                backgroundColor:
                  pwStatus === "saving" || !newPassword
                    ? "var(--color-border)"
                    : "var(--color-primary)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.9rem",
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: pwStatus === "saving" || !newPassword ? "default" : "pointer",
                transition: "background-color 0.15s ease",
              }}
            >
              {pwStatus === "saving" ? t("changingPassword") : t("changePasswordBtn")}
            </button>

            {/* Inline feedback */}
            {pwStatus === "saved" && (
              <span style={{ fontSize: "0.875rem", color: "#059669", fontWeight: 600 }}>
                {t("passwordChanged")}
              </span>
            )}
            {pwStatus === "error" && (
              <span style={{ fontSize: "0.875rem", color: "#DC2626", fontWeight: 600 }}>
                {t("passwordError")}
              </span>
            )}
          </div>

        </div>
      </div>
    )}
    </>
  );
}
