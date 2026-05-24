// =============================================================
// components/home/HowItWorks.tsx
// =============================================================
// "How it works" — three-step explainer section.
// Server Component (no client JS).
//
// Layout:
//   Centred section heading
//   Three step cards in a row (stacks to 1 col on mobile)
//   Each card:
//     - Numbered teal circle
//     - Lucide icon inside a teal-tinted square
//     - Bold step title
//     - Short description
//   Connecting dashed line between cards (desktop only, CSS)
// =============================================================

import { Search, CalendarDays, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ---------------------------------------------------------------
// Step definitions — edit here to change text or icons
// ---------------------------------------------------------------
const STEPS: {
  num:         number;
  Icon:        LucideIcon;
  title:       string;
  description: string;
}[] = [
  {
    num:   1,
    Icon:  Search,
    title: "Αναζήτηση",
    description:
      "Βρείτε τον κατάλληλο επαγγελματία από 51 κατηγορίες στην περιοχή σας.",
  },
  {
    num:   2,
    Icon:  CalendarDays,
    title: "Κράτηση",
    description:
      "Κλείστε ραντεβού online ή καλέστε απευθείας — εσείς διαλέγετε τον τρόπο.",
  },
  {
    num:   3,
    Icon:  Star,
    title: "Αξιολόγηση",
    description:
      "Αφήστε κριτική μετά την υπηρεσία και βοηθήστε την κοινότητα.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      style={{
        backgroundColor: "#ffffff",
        padding: "5rem 1.5rem",
      }}
    >
      {/* CSS for the dashed connector line (desktop only) */}
      <style>{`
        .hiw-grid {
          position: relative;
        }
        /* Dashed line spanning between the three icon boxes on md+ */
        @media (min-width: 768px) {
          .hiw-grid::before {
            content: "";
            position: absolute;
            top: 52px; /* vertically centred on the icon box */
            left: calc(16.66% + 36px);
            right: calc(16.66% + 36px);
            height: 2px;
            background: repeating-linear-gradient(
              to right,
              var(--color-primary-bg) 0,
              var(--color-primary-bg) 8px,
              transparent 8px,
              transparent 16px
            );
          }
        }
      `}</style>

      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* ── Section heading ── */}
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <p
            style={{
              fontSize: "0.8125rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--color-primary)",
              marginBottom: "0.5rem",
            }}
          >
            Πώς λειτουργεί
          </p>
          <h2
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 800,
              color: "var(--color-text)",
              letterSpacing: "-0.025em",
              margin: 0,
            }}
          >
            Τρία βήματα για κάθε υπηρεσία
          </h2>
        </div>

        {/* ── Steps grid ── */}
        {/* 1 column mobile → 3 columns md+ */}
        <div
          className="hiw-grid grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6"
        >
          {STEPS.map(({ num, Icon, title, description }) => (
            <div
              key={num}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "1rem",
                position: "relative",
                zIndex: 1,
              }}
            >
              {/* Icon box with number badge */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                {/* Teal-tinted icon container */}
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "18px",
                    backgroundColor: "var(--color-primary-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-primary)",
                  }}
                  aria-hidden="true"
                >
                  <Icon size={32} strokeWidth={1.75} />
                </div>

                {/* Step number badge — teal circle, top-right corner */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-primary)",
                    color: "#ffffff",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #ffffff",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                  }}
                >
                  {num}
                </div>
              </div>

              {/* Step text */}
              <div>
                <h3
                  style={{
                    fontSize: "1.0625rem",
                    fontWeight: 700,
                    color: "var(--color-text)",
                    margin: "0 0 0.375rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--color-text-muted)",
                    lineHeight: 1.65,
                    margin: 0,
                    maxWidth: "260px",
                  }}
                >
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
