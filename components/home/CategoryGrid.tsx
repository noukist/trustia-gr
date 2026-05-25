// =============================================================
// components/home/CategoryGrid.tsx
// =============================================================
// Grid of the 12 most popular service categories.
// Server Component — no client JS needed.
//
// Layout:
//   Section header: "Δημοφιλείς Υπηρεσίες" (left) + "Δείτε όλες →" (right)
//   Grid: 2 columns on mobile → 3 columns on md+
//   Each card: emoji icon + Greek name, links to /services?category={id}
//
// Hover effects are handled via a <style> block (React 19 hoists
// <style> to <head>) to keep this a Server Component with zero JS.
// =============================================================

import Link from "next/link";
import { CATEGORIES, POPULAR_CATEGORY_IDS } from "@/lib/constants";
import type { Category } from "@/lib/constants";

// Resolve the 12 popular IDs to full Category objects, preserving order
const POPULAR: Category[] = POPULAR_CATEGORY_IDS
  .map((id) => CATEGORIES.find((c) => c.id === id))
  .filter((c): c is Category => c !== undefined);

export default function CategoryGrid() {
  return (
    <section
      id="categories"
      style={{
        backgroundColor: "var(--color-bg-light)",
        padding: "4.5rem 1.5rem",
      }}
    >
      {/* Pure-CSS hover rules for category cards */}
      <style>{`
        .trustia-cat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          padding: 1.5rem 0.75rem;
          background: #ffffff;
          border: 1.5px solid var(--color-border);
          border-radius: 14px;
          text-decoration: none;
          color: var(--color-text);
          transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
        }
        .trustia-cat-card:hover {
          border-color: var(--color-primary);
          box-shadow: 0 4px 20px rgba(42, 143, 143, 0.14);
          transform: translateY(-2px);
        }
        .trustia-cat-card:active {
          transform: translateY(0);
        }
        /* Emoji starts desaturated; pops to full colour on card hover */
        .trustia-cat-emoji {
          filter: grayscale(1);
          transition: filter 0.25s ease;
        }
        .trustia-cat-card:hover .trustia-cat-emoji {
          filter: grayscale(0);
        }
      `}</style>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* ── Section header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
            marginBottom: "2rem",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(1.4rem, 3vw, 1.875rem)",
              fontWeight: 800,
              color: "var(--color-text)",
              letterSpacing: "-0.025em",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Δημοφιλείς Υπηρεσίες
          </h2>

          <Link
            href="/services"
            style={{
              color: "var(--color-primary)",
              fontWeight: 600,
              fontSize: "0.9rem",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Δείτε όλες τις κατηγορίες&nbsp;→
          </Link>
        </div>

        {/* ── Card grid ── */}
        {/*
          2 columns on mobile, 3 on tablet/desktop.
          Tailwind's md:grid-cols-3 works because --color-* tokens
          in @theme don't affect structural utilities.
        */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {POPULAR.map((cat) => (
            <Link
              key={cat.id}
              href={`/services?category=${cat.id}`}
              className="trustia-cat-card"
              aria-label={cat.nameEl}
            >
              {/* Emoji icon — large, centered. Grayscale by default, full colour on hover */}
              <span
                aria-hidden="true"
                className="trustia-cat-emoji"
                style={{ fontSize: "2.25rem", lineHeight: 1 }}
              >
                {cat.emoji}
              </span>

              {/* Greek category name */}
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textAlign: "center",
                  color: "var(--color-text)",
                  lineHeight: 1.35,
                }}
              >
                {cat.nameEl}
              </span>
            </Link>
          ))}
        </div>

        {/* ── Mobile "see all" link — centred below grid ── */}
        <div
          className="md:hidden"
          style={{ textAlign: "center", marginTop: "1.5rem" }}
        >
          <Link
            href="/services"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.625rem 1.5rem",
              border: "1.5px solid var(--color-primary)",
              borderRadius: "8px",
              color: "var(--color-primary)",
              fontWeight: 600,
              fontSize: "0.9rem",
              textDecoration: "none",
            }}
          >
            Όλες οι κατηγορίες&nbsp;→
          </Link>
        </div>

      </div>
    </section>
  );
}
