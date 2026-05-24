// =============================================================
// components/home/ProCTA.tsx
// =============================================================
// Professional recruitment call-to-action section.
// Server Component — no client JS.
//
// Design:
//   - Dark teal gradient background (mirrors hero but darker)
//   - Decorative circle in top-right corner
//   - Left block: heading + feature pills with check icons
//   - Right block: gold CTA button + small trust note
//   - On mobile: stacks vertically, button centred
//
// PRD reference:
//   Section 4.4 — 3-month free trial, Τιμή Γνωριμίας founding price
//   Section 3   — Feature entitlements (vacation, portfolio, invitations)
// =============================================================

import { ArrowRight, Check } from "lucide-react";
import Button from "@/components/ui/Button";

// ---------------------------------------------------------------
// Feature highlights shown as pill badges
// ---------------------------------------------------------------
const FEATURES = [
  "3 μήνες ΔΩΡΕΑΝ",
  "0% προμήθεια",
  "Τιμή Γνωριμίας από €2.75/μήνα",
  "Ακύρωση οποτεδήποτε",
] as const;

export default function ProCTA() {
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        // Slightly darker gradient than the hero for visual separation
        background: "linear-gradient(135deg, #083838 0%, #0C5252 45%, #1A7070 100%)",
        padding: "5rem 1.5rem",
      }}
    >
      {/* Decorative circle — top-right, CSS only */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-80px",
          right: "-80px",
          width: "360px",
          height: "360px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
          pointerEvents: "none",
        }}
      />

      {/* Accent horizontal rule at the very top of the section */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "80px",
          height: "3px",
          backgroundColor: "var(--color-accent)",
          borderRadius: "0 0 4px 4px",
        }}
      />

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "2.5rem",
          justifyContent: "space-between",
        }}
      >
        {/* ── Left: text + feature list ── */}
        <div style={{ flex: "1 1 340px", maxWidth: "580px" }}>
          {/* Eyebrow label */}
          <p
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--color-accent)",
              margin: "0 0 0.75rem",
            }}
          >
            Για Επαγγελματίες
          </p>

          {/* Heading */}
          <h2
            style={{
              fontSize: "clamp(1.6rem, 4vw, 2.5rem)",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              margin: "0 0 1.25rem",
            }}
          >
            Είσαι επαγγελματίας;
          </h2>

          {/* Sub-heading */}
          <p
            style={{
              fontSize: "1rem",
              color: "rgba(255,255,255,0.72)",
              lineHeight: 1.65,
              margin: "0 0 1.75rem",
              maxWidth: "460px",
            }}
          >
            Μπες στο Trustia.gr χωρίς καμία δέσμευση. Μηδέν προμήθεια —
            κρατάς το&nbsp;100% των αμοιβών σου.
          </p>

          {/* Feature pills */}
          <ul
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.625rem",
              listStyle: "none",
              padding: 0,
              margin: 0,
            }}
          >
            {FEATURES.map((feat) => (
              <li
                key={feat}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: "99px",
                  padding: "0.35rem 0.875rem",
                  fontSize: "0.8375rem",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.92)",
                }}
              >
                {/* Small accent-coloured check icon */}
                <Check
                  size={13}
                  strokeWidth={3}
                  style={{ color: "var(--color-accent)", flexShrink: 0 }}
                />
                {feat}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Right: CTA block ── */}
        <div
          style={{
            flex: "0 1 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
            textAlign: "center",
          }}
        >
          {/* Gold CTA button
              NOTE: ArrowRight is inlined as children (not the `icon` prop)
              because ProCTA is a Server Component and React cannot serialize
              a function reference across the server→client boundary. Passing
              JSX *elements* (children) is always safe. */}
          <Button
            variant="secondary"
            size="lg"
            href="/register"
            style={{
              fontWeight: 800,
              letterSpacing: "-0.01em",
              boxShadow: "0 4px 24px rgba(212, 160, 57, 0.4)",
            }}
          >
            Ξεκίνα Δωρεάν
            <ArrowRight size={20} strokeWidth={2.5} aria-hidden="true" />
          </Button>

          {/* Reassurance note */}
          <p
            style={{
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.5)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Δεν χρειάζεται πιστωτική κάρτα
            <br />
            Οι πρώτοι 50 κλειδώνουν την Τιμή Γνωριμίας για πάντα
          </p>
        </div>
      </div>
    </section>
  );
}
