// =============================================================
// components/layout/AnnouncementBarClient.tsx
// =============================================================
// Client wrapper for the announcement bar.
// Handles the dismiss (×) button — once dismissed, the bar is
// hidden for the rest of the session via sessionStorage.
// =============================================================

"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface Props {
  id:      string;
  text:    string;
  linkUrl: string | null;
}

export default function AnnouncementBarClient({ id, text, linkUrl }: Props) {
  const storageKey = `announcement_dismissed_${id}`;
  const [visible, setVisible] = useState(false);

  // Check sessionStorage on mount to avoid flash on revisit
  useEffect(() => {
    const dismissed = sessionStorage.getItem(storageKey);
    if (!dismissed) setVisible(true);
  }, [storageKey]);

  function dismiss() {
    sessionStorage.setItem(storageKey, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="banner"
      style={{
        backgroundColor: "var(--color-accent)",
        color:           "#fff",
        padding:         "0.55rem 1rem",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        gap:             "0.75rem",
        fontSize:        "0.875rem",
        fontWeight:      500,
        lineHeight:      1.4,
        position:        "relative",
      }}
    >
      {/* Message — optionally a link */}
      {linkUrl ? (
        <a
          href={linkUrl}
          style={{
            color:          "#fff",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >
          {text}
        </a>
      ) : (
        <span>{text}</span>
      )}

      {/* Dismiss button */}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Κλείσιμο ανακοίνωσης"
        style={{
          position:        "absolute",
          right:           "0.75rem",
          top:             "50%",
          transform:       "translateY(-50%)",
          background:      "transparent",
          border:          "none",
          color:           "#fff",
          cursor:          "pointer",
          padding:         "0.25rem",
          display:         "flex",
          alignItems:      "center",
          opacity:         0.8,
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
