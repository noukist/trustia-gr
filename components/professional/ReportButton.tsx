// =============================================================
// components/professional/ReportButton.tsx
// =============================================================
// Client wrapper that renders the "Report" flag button and
// conditionally mounts <ReportModal> when clicked.
//
// If the user is not logged in (userId === null), the button
// is hidden — anonymous users cannot submit reports per RLS.
// =============================================================

"use client";

import { useState }   from "react";
import { Flag }       from "lucide-react";
import { useTranslations } from "next-intl";
import ReportModal    from "@/components/professional/ReportModal";

interface ReportButtonProps {
  professionalId:   string;
  professionalName: string;
  /** auth.users.id — null means not logged in → button hidden */
  userId:           string | null;
}

export default function ReportButton({
  professionalId,
  professionalName,
  userId,
}: ReportButtonProps) {
  const t = useTranslations("report");
  const [open, setOpen] = useState(false);

  // Don't render anything for anonymous visitors
  if (!userId) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={t("btnLabel")}
        aria-label={t("btnLabel")}
        style={{
          display:         "inline-flex",
          alignItems:      "center",
          justifyContent:  "center",
          width:           "36px",
          height:          "36px",
          border:          "1.5px solid var(--color-border)",
          borderRadius:    "8px",
          backgroundColor: "transparent",
          cursor:          "pointer",
          color:           "var(--color-text-muted)",
          transition:      "color 0.15s, border-color 0.15s, background-color 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color           = "#DC2626";
          e.currentTarget.style.borderColor     = "#DC2626";
          e.currentTarget.style.backgroundColor = "rgba(220,38,38,0.06)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color           = "var(--color-text-muted)";
          e.currentTarget.style.borderColor     = "var(--color-border)";
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <Flag size={15} />
      </button>

      {open && (
        <ReportModal
          professionalId={professionalId}
          professionalName={professionalName}
          userId={userId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
