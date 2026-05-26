// =============================================================
// components/professional/ReportModal.tsx
// =============================================================
// Modal for reporting a professional to the platform admins.
//
// The reports table uses target_type = 'professional' with the
// professional's UUID as target_id. reporter_id is auth.users.id
// (NOT customers.id — matching the FK in the schema).
//
// REASON OPTIONS (PRD §42)
//   fake_info   — Fake or misleading information
//   inappropriate — Inappropriate content / behaviour
//   scam        — Scam or fraud
//   spam        — Spam
//   other       — Other
//
// RLS: reports_insert_any allows any authenticated user to insert.
//
// CLOSES on backdrop click or Escape key.
// =============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Flag }                          from "lucide-react";
import { useTranslations }                  from "next-intl";
import { createClient }                     from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────

interface ReportModalProps {
  professionalId:   string;
  professionalName: string;
  /** auth.users.id — required to insert a report */
  userId:           string;
  onClose:          () => void;
}

// Available report reasons — keys map to i18n strings
const REASONS = [
  "fake_info",
  "inappropriate",
  "scam",
  "spam",
  "other",
] as const;

type ReasonKey = (typeof REASONS)[number];

// ── Component ─────────────────────────────────────────────────

export default function ReportModal({
  professionalId,
  professionalName,
  userId,
  onClose,
}: ReportModalProps) {
  const t = useTranslations("report");

  const [reason,  setReason]  = useState<ReasonKey | "">("");
  const [details, setDetails] = useState("");
  const [status,  setStatus]  = useState<"idle" | "saving" | "success" | "error">("idle");
  const [validationMsg, setValidationMsg] = useState("");

  // ── Close on Escape ───────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ── Prevent body scroll while open ───────────────────────
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    setValidationMsg("");

    if (!reason) {
      setValidationMsg(t("selectReason"));
      return;
    }

    setStatus("saving");
    const supabase = createClient();

    const { error } = await supabase.from("reports").insert({
      reporter_id:  userId,
      target_type:  "professional",
      target_id:    professionalId,
      reason,
      details:      details.trim() || null,
      status:       "pending",
    });

    if (error) {
      console.error("[ReportModal]", error.message);
      setStatus("error");
    } else {
      setStatus("success");
      // Auto-close after brief success flash
      setTimeout(onClose, 1800);
    }
  }, [reason, details, professionalId, userId, t, onClose]);

  // ── Render ────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position:        "fixed",
          inset:           0,
          backgroundColor: "rgba(0,0,0,0.45)",
          zIndex:          500,
          backdropFilter:  "blur(2px)",
        }}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        style={{
          position:        "fixed",
          top:             "50%",
          left:            "50%",
          transform:       "translate(-50%, -50%)",
          zIndex:          501,
          width:           "min(460px, 92vw)",
          backgroundColor: "#fff",
          borderRadius:    "20px",
          boxShadow:       "0 24px 64px rgba(0,0,0,0.2)",
          overflow:        "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            padding:        "1.25rem 1.5rem",
            borderBottom:   "1px solid var(--color-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Flag size={18} style={{ color: "#DC2626" }} />
            <div>
              <h2
                style={{
                  fontWeight:    700,
                  fontSize:      "1.05rem",
                  color:         "var(--color-text)",
                  margin:        "0 0 0.15rem",
                  letterSpacing: "-0.01em",
                }}
              >
                {t("title")}
              </h2>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: 0 }}>
                {professionalName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            style={{
              background:   "none",
              border:       "none",
              cursor:       "pointer",
              padding:      "0.375rem",
              borderRadius: "8px",
              color:        "var(--color-text-muted)",
              display:      "flex",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.5rem" }}>

          {/* Success state */}
          {status === "success" ? (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <p style={{ fontSize: "2.5rem", margin: "0 0 0.75rem" }}>✅</p>
              <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-text)", margin: "0 0 0.4rem" }}>
                {t("successTitle")}
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", lineHeight: 1.6, margin: 0 }}>
                {t("successHint")}
              </p>
            </div>
          ) : (
            <>
              {/* Reason selector */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label
                  style={{
                    display:      "block",
                    fontWeight:   600,
                    fontSize:     "0.875rem",
                    color:        "var(--color-text)",
                    marginBottom: "0.625rem",
                  }}
                >
                  {t("reasonLabel")}
                </label>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {REASONS.map((r) => (
                    <label
                      key={r}
                      style={{
                        display:         "flex",
                        alignItems:      "center",
                        gap:             "0.625rem",
                        padding:         "0.625rem 0.875rem",
                        border:          `1.5px solid ${reason === r ? "var(--color-primary)" : "var(--color-border)"}`,
                        borderRadius:    "10px",
                        cursor:          "pointer",
                        backgroundColor: reason === r ? "var(--color-primary-bg)" : "#fff",
                        transition:      "border-color 0.1s, background-color 0.1s",
                        fontSize:        "0.9rem",
                        color:           "var(--color-text)",
                        fontWeight:      reason === r ? 600 : 400,
                      }}
                    >
                      <input
                        type="radio"
                        name="report-reason"
                        value={r}
                        checked={reason === r}
                        onChange={() => setReason(r)}
                        style={{ accentColor: "var(--color-primary)" }}
                      />
                      {t(`reason_${r}`)}
                    </label>
                  ))}
                </div>

                {validationMsg && (
                  <p style={{ color: "#DC2626", fontSize: "0.8rem", margin: "0.5rem 0 0" }}>
                    {validationMsg}
                  </p>
                )}
              </div>

              {/* Optional details */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  htmlFor="report-details"
                  style={{
                    display:      "block",
                    fontWeight:   600,
                    fontSize:     "0.875rem",
                    color:        "var(--color-text)",
                    marginBottom: "0.5rem",
                  }}
                >
                  {t("detailsLabel")}
                  <span style={{ fontWeight: 400, color: "var(--color-text-muted)", marginLeft: "0.25rem" }}>
                    ({t("optional")})
                  </span>
                </label>
                <textarea
                  id="report-details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  placeholder={t("detailsPlaceholder")}
                  disabled={status === "saving"}
                  maxLength={500}
                  style={{
                    width:        "100%",
                    padding:      "0.75rem",
                    border:       "1.5px solid var(--color-border)",
                    borderRadius: "10px",
                    fontSize:     "0.9375rem",
                    fontFamily:   "inherit",
                    lineHeight:   1.6,
                    resize:       "vertical",
                    outline:      "none",
                    color:        "var(--color-text)",
                    boxSizing:    "border-box",
                  }}
                />
                <p
                  style={{
                    textAlign: "right",
                    fontSize:  "0.75rem",
                    color:     "var(--color-text-muted)",
                    margin:    "0.2rem 0 0",
                  }}
                >
                  {details.length} / 500
                </p>
              </div>

              {/* Submit */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={status === "saving" || !reason}
                  style={{
                    padding:         "0.7rem 1.75rem",
                    backgroundColor:
                      status === "saving" || !reason ? "var(--color-border)" : "#DC2626",
                    color:           "#fff",
                    border:          "none",
                    borderRadius:    "10px",
                    fontWeight:      700,
                    fontSize:        "0.9375rem",
                    fontFamily:      "inherit",
                    cursor:          status === "saving" || !reason ? "default" : "pointer",
                    transition:      "background-color 0.15s",
                  }}
                >
                  {status === "saving" ? t("sending") : t("submit")}
                </button>

                {status === "error" && (
                  <span style={{ color: "#DC2626", fontWeight: 600, fontSize: "0.875rem" }}>
                    {t("error")}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
