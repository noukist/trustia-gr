// =============================================================
// components/reviews/WriteReviewModal.tsx
// =============================================================
// Modal dialog for writing or editing a review.
//
// LOGIC
//   • existingReview → pre-fills stars + text, sends UPDATE on submit
//   • no existingReview  → blank form, sends INSERT on submit
//   • completedBookingId → type='verified' (weight 2.0), green note
//   • no completedBookingId → type='user' (weight 0.5)
//
// DB TRIGGER: recalculate_professional_rating() fires after INSERT
// or UPDATE on reviews, so professionals.rating is always fresh.
//
// CLOSES on backdrop click or Escape key.
// On success: calls onSuccess() which triggers router.refresh().
// =============================================================

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X }                  from "lucide-react";
import { useTranslations }    from "next-intl";
import { createClient }       from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────

export interface ExistingReview {
  id:     string;
  rating: number;
  text:   string | null;
  type:   string;
}

interface WriteReviewModalProps {
  professionalId:    string;
  professionalName:  string;
  /** customers.id of the current user — must be non-null to render */
  customerId:        string;
  existingReview:    ExistingReview | null;
  /** If customer has a completed booking, the review becomes 'verified' */
  completedBookingId: string | null;
  /** Invite code from ?invite= URL param — makes the review type='invitation' */
  inviteCode?: string | null;
  onClose:   () => void;
  onSuccess: () => void;
}

// ── Star picker ───────────────────────────────────────────────

function StarPicker({
  value,
  onChange,
  disabled,
}: {
  value:    number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div
      role="radiogroup"
      aria-label="Βαθμολογία"
      style={{ display: "flex", gap: "0.375rem" }}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} αστέρι${star > 1 ? "α" : ""}`}
          disabled={disabled}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          style={{
            background:  "none",
            border:      "none",
            padding:     "0.125rem",
            cursor:      disabled ? "default" : "pointer",
            fontSize:    "2rem",
            lineHeight:  1,
            color:       star <= active ? "#F59E0B" : "var(--color-border)",
            transition:  "color 0.1s, transform 0.1s",
            transform:   !disabled && star <= active ? "scale(1.15)" : "scale(1)",
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────

export default function WriteReviewModal({
  professionalId,
  professionalName,
  customerId,
  existingReview,
  completedBookingId,
  inviteCode = null,
  onClose,
  onSuccess,
}: WriteReviewModalProps) {
  const t = useTranslations("profile");

  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [text,   setText]   = useState(existingReview?.text ?? "");
  const [status, setStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [validationMsg, setValidationMsg] = useState("");

  const dialogRef = useRef<HTMLDivElement>(null);

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

    if (rating === 0) {
      setValidationMsg(t("selectStars"));
      return;
    }

    setStatus("saving");
    const supabase = createClient();

    // ── Determine review type + weight ──────────────────────
    // Priority: verified (completed booking) > invitation > user
    const isVerified   = !!completedBookingId;
    const isInvitation = !isVerified && !!inviteCode;
    const type   = isVerified ? "verified" : isInvitation ? "invitation" : "user";
    const weight = isVerified ? 2.0       : isInvitation ? 1.0          : 0.5;

    // Resolve invitation_id from the invite code (needed for FK)
    let invitationId: string | null = null;
    if (isInvitation && inviteCode) {
      const { data: inv } = await supabase
        .from("review_invitations")
        .select("id")
        .eq("code", inviteCode)
        .maybeSingle();
      invitationId = inv?.id ?? null;
    }

    let error: { message: string } | null = null;

    if (existingReview) {
      // ── UPDATE existing review ──────────────────────────
      ({ error } = await supabase
        .from("reviews")
        .update({
          rating,
          text:       text.trim() || null,
          edited_at:  new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingReview.id));
    } else {
      // ── INSERT new review ───────────────────────────────
      ({ error } = await supabase
        .from("reviews")
        .insert({
          professional_id: professionalId,
          customer_id:     customerId,
          booking_id:      completedBookingId ?? null,
          invitation_id:   invitationId,
          rating,
          text:            text.trim() || null,
          type,
          weight,
          status:          "active",
        }));

      // Note: used_count increment requires a SECURITY DEFINER RPC
      // (customer doesn't own the invitation row). Tracked as future migration.
    }

    if (error) {
      console.error("[WriteReviewModal] error:", error.message);
      setStatus("error");
    } else {
      setStatus("success");
      // Brief success flash, then close and refresh
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    }
  }, [rating, text, existingReview, completedBookingId, professionalId, customerId, t, onSuccess, onClose]);

  // ── Derived UI strings ─────────────────────────────────────
  const title     = existingReview ? t("editReview") : t("writeReview");
  const submitBtn = status === "saving"
    ? t("publishingReview")
    : existingReview ? t("updateReview") : t("publishReview");

  const isVerified = !!completedBookingId;

  // ── Render ────────────────────────────────────────────────
  return (
    <>
      {/* ── Backdrop ── */}
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

      {/* ── Dialog ── */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position:        "fixed",
          top:             "50%",
          left:            "50%",
          transform:       "translate(-50%, -50%)",
          zIndex:          501,
          width:           "min(480px, 92vw)",
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
          <div>
            <h2
              style={{
                fontWeight:    700,
                fontSize:      "1.05rem",
                color:         "var(--color-text)",
                margin:        "0 0 0.2rem",
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>
              {professionalName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("closeModal")}
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

          {/* Verified / user review badge */}
          <div
            style={{
              display:         "inline-flex",
              alignItems:      "center",
              gap:             "0.375rem",
              padding:         "0.3rem 0.75rem",
              borderRadius:    "99px",
              fontSize:        "0.775rem",
              fontWeight:      600,
              marginBottom:    "1.25rem",
              backgroundColor: isVerified ? "rgba(5,150,105,0.1)" : "rgba(42,143,143,0.1)",
              color:           isVerified ? "#059669" : "var(--color-primary)",
            }}
          >
            {isVerified ? `✓ ${t("verifiedBadge")}` : t("userReviewNote")}
          </div>

          {/* Star picker */}
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
              {t("selectStars")}
            </label>
            <StarPicker
              value={rating}
              onChange={setRating}
              disabled={status === "saving" || status === "success"}
            />
            {validationMsg && (
              <p style={{ color: "#DC2626", fontSize: "0.8rem", margin: "0.5rem 0 0" }}>
                {validationMsg}
              </p>
            )}
          </div>

          {/* Review text */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="review-text"
              style={{
                display:      "block",
                fontWeight:   600,
                fontSize:     "0.875rem",
                color:        "var(--color-text)",
                marginBottom: "0.5rem",
              }}
            >
              {t("reviewText")}
            </label>
            <textarea
              id="review-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder={t("reviewTextPlaceholder")}
              disabled={status === "saving" || status === "success"}
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
              maxLength={1500}
            />
            <p
              style={{
                textAlign: "right",
                fontSize:  "0.75rem",
                color:     "var(--color-text-muted)",
                margin:    "0.25rem 0 0",
              }}
            >
              {text.length} / 1500
            </p>
          </div>

          {/* Submit row */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={status === "saving" || status === "success" || rating === 0}
              style={{
                padding:         "0.7rem 1.75rem",
                backgroundColor:
                  status === "saving" || status === "success" || rating === 0
                    ? "var(--color-border)"
                    : "var(--color-primary)",
                color:           "#fff",
                border:          "none",
                borderRadius:    "10px",
                fontWeight:      700,
                fontSize:        "0.9375rem",
                fontFamily:      "inherit",
                cursor:
                  status === "saving" || status === "success" || rating === 0
                    ? "default"
                    : "pointer",
                transition:      "background-color 0.15s",
              }}
            >
              {submitBtn}
            </button>

            {status === "success" && (
              <span style={{ color: "#059669", fontWeight: 600, fontSize: "0.9rem" }}>
                {existingReview ? t("reviewUpdated") : t("reviewPublished")}
              </span>
            )}
            {status === "error" && (
              <span style={{ color: "#DC2626", fontWeight: 600, fontSize: "0.9rem" }}>
                {t("reviewError")}
              </span>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
