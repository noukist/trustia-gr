// =============================================================
// components/reviews/ReviewActions.tsx
// =============================================================
// Client Component: "Leave a review" / "Edit your review" CTA.
//
// The parent Server Component passes auth context so this can
// decide what to render without any client-side fetching:
//
//   customerId === null  → "Log in to review" link
//   customerId + no existingReview  → "Write a review" button
//   customerId + existingReview     → "Edit your review" button
//
// On modal success: calls router.refresh() to reload the review
// list from the server without a full navigation.
// =============================================================

"use client";

import { useState }           from "react";
import { useRouter }          from "@/i18n/navigation";
import { useTranslations }    from "next-intl";
import { PenLine, LogIn }     from "lucide-react";
import WriteReviewModal, {
  type ExistingReview,
}                             from "@/components/reviews/WriteReviewModal";

// ── Props ─────────────────────────────────────────────────────

interface ReviewActionsProps {
  professionalId:     string;
  professionalName:   string;
  /** /professional/{slug} — used for login redirect ?next= */
  professionalSlug:   string;
  /** null = not logged in */
  customerId:         string | null;
  existingReview:     ExistingReview | null;
  completedBookingId: string | null;
}

// ── Component ─────────────────────────────────────────────────

export default function ReviewActions({
  professionalId,
  professionalName,
  professionalSlug,
  customerId,
  existingReview,
  completedBookingId,
}: ReviewActionsProps) {
  const t      = useTranslations("profile");
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);

  // After a successful review write / edit — refresh server data
  function handleSuccess() {
    router.refresh();
  }

  // ── Not logged in → login link ────────────────────────────
  if (!customerId) {
    return (
      <a
        href={`/login?next=/professional/${professionalSlug}`}
        style={{
          display:         "inline-flex",
          alignItems:      "center",
          gap:             "0.375rem",
          padding:         "0.5rem 1.125rem",
          border:          "1.5px solid var(--color-primary)",
          color:           "var(--color-primary)",
          borderRadius:    "8px",
          fontWeight:      600,
          fontSize:        "0.875rem",
          textDecoration:  "none",
          transition:      "background-color 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--color-primary-bg)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <LogIn size={14} />
        {t("loginToReview")}
      </a>
    );
  }

  // ── Logged in → open review modal ─────────────────────────
  const label = existingReview ? t("editReview") : t("writeReview");

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        style={{
          display:         "inline-flex",
          alignItems:      "center",
          gap:             "0.375rem",
          padding:         "0.5rem 1.125rem",
          border:          "1.5px solid var(--color-primary)",
          color:           "var(--color-primary)",
          borderRadius:    "8px",
          fontWeight:      600,
          fontSize:        "0.875rem",
          fontFamily:      "inherit",
          cursor:          "pointer",
          backgroundColor: "transparent",
          transition:      "background-color 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--color-primary-bg)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <PenLine size={14} />
        {label}
      </button>

      {modalOpen && (
        <WriteReviewModal
          professionalId={professionalId}
          professionalName={professionalName}
          customerId={customerId}
          existingReview={existingReview}
          completedBookingId={completedBookingId}
          onClose={() => setModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
