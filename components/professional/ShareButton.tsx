// =============================================================
// components/professional/ShareButton.tsx
// =============================================================
// Share dropdown for professional profile pages (PRD §36).
// Options: copy link, WhatsApp, Facebook.
// Uses the browser Clipboard API and window.open() for socials.
// =============================================================

"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { useTranslations } from "next-intl";

interface ShareButtonProps {
  /** Full name of the professional — used as share text */
  proName: string;
  /** Category name (locale-aware, passed from server component) */
  categoryEl: string;
}

export default function ShareButton({ proName, categoryEl }: ShareButtonProps) {
  const t                   = useTranslations("profile");
  const [open, setOpen]     = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef             = useRef<HTMLDivElement>(null);

  // ── Close dropdown on outside click ──────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Helpers ───────────────────────────────────────────────
  const url  = typeof window !== "undefined" ? window.location.href : "";
  const text = `${proName} — ${categoryEl} | Trustia.gr`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard access denied — silently ignore */
    }
    setOpen(false);
  }

  function shareWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setOpen(false);
  }

  function shareFacebook() {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setOpen(false);
  }

  // ── Shared item style ─────────────────────────────────────
  const itemStyle: React.CSSProperties = {
    display:         "flex",
    alignItems:      "center",
    gap:             "0.625rem",
    width:           "100%",
    padding:         "0.625rem 0.875rem",
    background:      "none",
    border:          "none",
    cursor:          "pointer",
    fontSize:        "0.875rem",
    color:           "var(--color-text)",
    textAlign:       "left",
    whiteSpace:      "nowrap",
    borderRadius:    "6px",
    transition:      "background-color 0.12s",
  };

  return (
    <div ref={menuRef} style={{ position: "relative", display: "inline-block" }}>
      {/* ── Trigger button ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t("shareProfile")}
        style={{
          display:         "inline-flex",
          alignItems:      "center",
          gap:             "0.375rem",
          padding:         "0.45rem 0.875rem",
          border:          "1.5px solid var(--color-border)",
          borderRadius:    "8px",
          backgroundColor: "#fff",
          cursor:          "pointer",
          fontSize:        "0.875rem",
          fontWeight:      500,
          color:           "var(--color-text-muted)",
          transition:      "border-color 0.15s, color 0.15s",
        }}
      >
        <Share2 size={15} />
        {t("share")}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div
          role="menu"
          style={{
            position:        "absolute",
            top:             "calc(100% + 6px)",
            right:           0,
            minWidth:        "200px",
            backgroundColor: "#fff",
            border:          "1.5px solid var(--color-border)",
            borderRadius:    "10px",
            boxShadow:       "0 8px 24px rgba(0,0,0,0.12)",
            padding:         "0.375rem",
            zIndex:          200,
          }}
        >
          {/* Copy link */}
          <button
            type="button"
            role="menuitem"
            onClick={copyLink}
            style={itemStyle}
          >
            {copied ? (
              <Check size={15} style={{ color: "#27AE60" }} />
            ) : (
              <Copy size={15} />
            )}
            {copied ? t("copied") : t("copyLink")}
          </button>

          {/* WhatsApp */}
          <button
            type="button"
            role="menuitem"
            onClick={shareWhatsApp}
            style={itemStyle}
          >
            {/* WhatsApp logo (inline SVG) */}
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="#25D366"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </button>

          {/* Facebook */}
          <button
            type="button"
            role="menuitem"
            onClick={shareFacebook}
            style={itemStyle}
          >
            {/* Facebook logo (inline SVG) */}
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="#1877F2"
              aria-hidden="true"
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </button>
        </div>
      )}
    </div>
  );
}
