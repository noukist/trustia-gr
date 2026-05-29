// =============================================================
// app/[locale]/my-bookings/ReviewButton.tsx
// =============================================================
// Client component — "Leave a review" button shown on completed
// bookings in the customer's My Bookings page.
//
// Opens WriteReviewModal with:
//   completedBookingId = booking.id  → review type becomes 'verified'
//   existingReview = null            → always a new review from this page
// =============================================================

"use client";

import { useState }         from "react";
import { Star }             from "lucide-react";
import WriteReviewModal     from "@/components/reviews/WriteReviewModal";

interface ReviewButtonProps {
  bookingId:       string;
  professionalId:  string;
  professionalName: string;
  customerId:      string;
}

export default function ReviewButton({
  bookingId,
  professionalId,
  professionalName,
  customerId,
}: ReviewButtonProps) {
  const [open,    setOpen]    = useState(false);
  const [done,    setDone]    = useState(false);

  if (done) {
    return (
      <span
        style={{
          display:         "inline-flex",
          alignItems:      "center",
          gap:             "0.3rem",
          fontSize:        "0.8rem",
          color:           "#27AE60",
          fontWeight:      600,
        }}
      >
        <Star size={13} fill="#27AE60" />
        Η κριτική σου καταχωρήθηκε
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display:         "inline-flex",
          alignItems:      "center",
          gap:             "0.375rem",
          padding:         "0.4rem 0.875rem",
          backgroundColor: "var(--color-primary-bg)",
          color:           "var(--color-primary)",
          border:          "1.5px solid var(--color-primary)",
          borderRadius:    "8px",
          fontSize:        "0.8rem",
          fontWeight:      700,
          fontFamily:      "inherit",
          cursor:          "pointer",
          transition:      "background-color 0.15s",
          whiteSpace:      "nowrap",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-primary)"; e.currentTarget.style.color = "#fff"; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--color-primary-bg)"; e.currentTarget.style.color = "var(--color-primary)"; }}
      >
        <Star size={13} />
        Γράψε κριτική
      </button>

      {open && (
        <WriteReviewModal
          professionalId={professionalId}
          professionalName={professionalName}
          customerId={customerId}
          existingReview={null}
          completedBookingId={bookingId}
          onClose={() => setOpen(false)}
          onSuccess={() => { setOpen(false); setDone(true); }}
        />
      )}
    </>
  );
}
