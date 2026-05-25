// =============================================================
// components/ui/Logo.tsx
// =============================================================
// Brand logo wordmark for Trustia.gr.
//
//   "TRUSTIA" is rendered in the primary teal color.
//   ".GR"    is rendered in the accent gold color.
//
// Props:
//   size        — "sm" | "md" | "lg"  (maps to font-size)
//   linkToHome  — boolean (default true): wraps in <Link href="/">
//   onClick     — forwarded to the inner <Link> or <span>
// =============================================================

"use client";

import { Link } from "@/i18n/navigation";

// ── Size → font-size mapping ──────────────────────────────────
// sm  → text-lg   (1.125 rem)
// md  → text-2xl  (1.5   rem)
// lg  → text-4xl  (2.25  rem)
const FONT_SIZE: Record<"sm" | "md" | "lg", string> = {
  sm: "1.125rem",
  md: "1.5rem",
  lg: "2.25rem",
};

// ── Props ─────────────────────────────────────────────────────
interface LogoProps {
  size?:        "sm" | "md" | "lg";
  /** When true (default), the logo is a link to the homepage */
  linkToHome?:  boolean;
  /** Optional click handler — useful in drawer / modal contexts */
  onClick?:     () => void;
  className?:   string;
}

// ── Component ─────────────────────────────────────────────────
export default function Logo({
  size       = "md",
  linkToHome = true,
  onClick,
  className,
}: LogoProps) {
  const wordmark = (
    <span
      style={{
        fontSize:      FONT_SIZE[size],
        fontWeight:    800,
        letterSpacing: "-0.03em",
        lineHeight:    1,
        color:         "var(--color-primary)",
        userSelect:    "none",
      }}
    >
      TRUSTIA
      <span style={{ color: "var(--color-accent)" }}>.GR</span>
    </span>
  );

  if (linkToHome) {
    return (
      <Link
        href="/"
        aria-label="TRUSTIA.GR — Αρχική"
        onClick={onClick}
        className={className}
        style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
      >
        {wordmark}
      </Link>
    );
  }

  // Non-linked version — still tabbable / accessible via the parent container
  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center" }}
    >
      {wordmark}
    </span>
  );
}
