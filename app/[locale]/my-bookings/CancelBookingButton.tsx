"use client";

interface Props {
  bookingId:  string;
  action:     (formData: FormData) => Promise<void>;
  label:      string;
  confirmMsg: string;
}

export default function CancelBookingButton({ bookingId, action, label, confirmMsg }: Props) {
  return (
    <form action={action}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm(confirmMsg)) e.preventDefault();
        }}
        style={{
          padding:      "0.3rem 0.875rem",
          fontSize:     "0.8rem",
          fontWeight:   600,
          color:        "#DC2626",
          background:   "none",
          border:       "1.5px solid #FCA5A5",
          borderRadius: "8px",
          cursor:       "pointer",
          fontFamily:   "inherit",
          transition:   "background-color 0.15s, border-color 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#FEE2E2";
          e.currentTarget.style.borderColor = "#EF4444";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.borderColor = "#FCA5A5";
        }}
      >
        {label}
      </button>
    </form>
  );
}
