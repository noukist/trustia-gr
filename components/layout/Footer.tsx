// =============================================================
// components/layout/Footer.tsx
// =============================================================
// Site-wide footer — Server Component (no client JS needed).
//
// Layout:
//   <footer>
//     Top section — 4-column grid (responsive → 2 cols → 1 col)
//       Col 1: Brand logo + tagline + social icons
//       Col 2: Trustia.gr (about, how-it-works, contact)
//       Col 3: Επαγγελματίες (register, pricing, login)
//       Col 4: Νομικά (terms, privacy, cookies)
//     Bottom bar — copyright + "Με ❤️ από Ελλάδα"
//
// Hover effects are handled via the <style> tag below (pure CSS)
// so this stays a Server Component and ships zero JS for the footer.
// =============================================================

import React from "react";
import Link from "next/link";
import { Music2 } from "lucide-react";

// ---------------------------------------------------------------
// Social brand icons — inline SVGs because lucide-react does not
// ship brand logos (Instagram, Facebook, TikTok).
// Replace with real brand assets / a dedicated icon library later.
// ---------------------------------------------------------------

/** Instagram: rounded-rect viewfinder + lens circle */
function IconInstagram({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Facebook: "f" lettermark path */
function IconFacebook({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

// ---------------------------------------------------------------
// Link columns — edit here to add/remove footer links
// ---------------------------------------------------------------
const LINK_COLUMNS = [
  {
    id: "trustia",
    heading: "Trustia.gr",
    links: [
      { label: "Πώς λειτουργεί",   href: "/how-it-works" },
      { label: "Υπηρεσίες",        href: "/services" },
      { label: "Επικοινωνία",      href: "/contact" },
    ],
  },
  {
    id: "professionals",
    heading: "Επαγγελματίες",
    links: [
      { label: "Εγγραφή",         href: "/register/professional" },
      { label: "Τιμολόγηση",      href: "/professionals#pricing" },
      { label: "Σύνδεση",         href: "/login" },
    ],
  },
  {
    id: "legal",
    heading: "Νομικά",
    links: [
      { label: "Όροι Χρήσης",              href: "/terms" },
      { label: "Πολιτική Απορρήτου",       href: "/privacy" },
      { label: "Πολιτική Cookies",          href: "/cookies" },
    ],
  },
] as const;

// ---------------------------------------------------------------
// Social links
// Each entry has an Icon component that renders an SVG.
// ---------------------------------------------------------------
const SOCIAL_LINKS: { label: string; href: string; Icon: React.FC<{ size?: number }> }[] = [
  { label: "Instagram", href: "https://instagram.com/trustia.gr",    Icon: IconInstagram },
  { label: "Facebook",  href: "https://facebook.com/trustia.gr",     Icon: IconFacebook },
  // Music2 (Lucide) is a recognisable placeholder for TikTok
  // — replace with a dedicated TikTok SVG when brand assets are ready
  { label: "TikTok",    href: "https://tiktok.com/@trustia.gr",      Icon: ({ size = 18 }) => <Music2 size={size} /> },
];

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "var(--color-bg-dark)",
        color: "#e5e7eb",
      }}
    >
      {/*
        Pure-CSS hover rules for footer links and social buttons.
        React 19 hoists <style> elements to <head> automatically,
        so scoping by the .trustia-footer- prefix avoids collisions.
      */}
      <style>{`
        .trustia-footer-link {
          color: #d1d5db;
          transition: color 0.15s ease;
        }
        .trustia-footer-link:hover {
          color: #ffffff;
        }
        .trustia-footer-social {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.08);
          color: #d1d5db;
          transition: background-color 0.15s ease, color 0.15s ease;
          text-decoration: none;
        }
        .trustia-footer-social:hover {
          background-color: rgba(255, 255, 255, 0.18);
          color: #ffffff;
        }
      `}</style>

      {/* ── Main content grid ── */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "3.5rem 1.5rem 2.5rem",
          // 4 equal columns on desktop, 2 on tablet, 1 on mobile
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "2.5rem",
        }}
      >
        {/* ── Column 1: Brand + tagline + social ── */}
        <div>
          {/* Logo */}
          <Link
            href="/"
            aria-label="Trustia.gr — Αρχική"
            style={{ display: "inline-block", marginBottom: "0.875rem", textDecoration: "none" }}
          >
            <span
              style={{
                fontSize: "1.2rem",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                // Slightly lighter teal so it reads well on dark bg
                color: "var(--color-primary-light)",
              }}
            >
              TRUSTIA
              <span style={{ color: "var(--color-accent)" }}>.GR</span>
            </span>
          </Link>

          {/* Tagline */}
          <p
            style={{
              fontSize: "0.875rem",
              color: "#9ca3af",
              lineHeight: 1.65,
              maxWidth: "210px",
              margin: "0 0 1.25rem",
            }}
          >
            Βρες τον ειδικό για κάθε ανάγκη.
            <br />
            Μηδέν προμήθεια. 100% στον επαγγελματία.
          </p>

          {/* Social icon row */}
          <div style={{ display: "flex", gap: "0.625rem" }}>
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="trustia-footer-social"
              >
                <Icon size={17} />
              </a>
            ))}
          </div>
        </div>

        {/* ── Columns 2-4: Link groups ── */}
        {LINK_COLUMNS.map(({ id, heading, links }) => (
          <div key={id}>
            {/* Column heading */}
            <p
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#9ca3af",
                margin: "0 0 1rem",
              }}
            >
              {heading}
            </p>

            {/* Links */}
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.625rem",
              }}
            >
              {links.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="trustia-footer-link"
                    style={{
                      textDecoration: "none",
                      fontSize: "0.9rem",
                    }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Bottom bar ── */}
      <div
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "1.125rem 1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "0.375rem",
            fontSize: "0.8125rem",
            color: "#6b7280",
            textAlign: "center",
          }}
        >
          <span>&copy; {new Date().getFullYear()} Trustia.gr</span>
          <span aria-hidden="true" style={{ margin: "0 0.25rem" }}>·</span>
          <span>Με ❤️ από Ελλάδα</span>
        </div>
      </div>
    </footer>
  );
}
