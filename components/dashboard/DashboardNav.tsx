// =============================================================
// components/dashboard/DashboardNav.tsx
// =============================================================
// Navigation for the professional dashboard.
//
// LAYOUT
//   Desktop (md+):  sticky left sidebar, 220 px wide, with teal
//                   active-state pill and professional info header.
//   Mobile:         fixed bottom tab bar with icon + short label.
//
// Each nav item updates the `tab` URL search param via router.push()
// which causes the Server Component page to re-render with the
// new tab's content — no client-side data fetching needed.
// =============================================================

"use client";

import React             from "react";
import Link              from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Calendar,
  Star,
  CreditCard,
  Clock,
  Share2,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { signOut } from "@/lib/auth/helpers";

// ── Types ──────────────────────────────────────────────────────
interface NavItem {
  id:          string;
  labelEl:     string;
  shortEl:     string;      // Short label for mobile tabs
  icon:        React.ComponentType<{ size?: number }>;
  placeholder: boolean;     // True = show "Σύντομα" badge
}

interface DashboardNavProps {
  tab:          string;
  proFirstName: string;
  proSlug:      string | null;
  avatarUrl:    string | null;
  initials:     string;
  /** booking_mode from the professionals row — shows Availability tab only for "full" */
  bookingMode:  "contact" | "date" | "full";
}

// ── Nav items builder ──────────────────────────────────────────
// Availability tab is only shown for professionals using full-calendar
// booking mode since it's the only mode that reads availability_slots.
function buildNavItems(bookingMode: "contact" | "date" | "full"): NavItem[] {
  const items: NavItem[] = [
    { id: "overview",      labelEl: "Επισκόπηση", shortEl: "Αρχική",    icon: LayoutDashboard, placeholder: false },
    { id: "profile",       labelEl: "Προφίλ",      shortEl: "Προφίλ",    icon: User,            placeholder: false },
    { id: "bookings",      labelEl: "Κρατήσεις",  shortEl: "Κρατήσεις", icon: Calendar,        placeholder: false },
    { id: "reviews",       labelEl: "Κριτικές",   shortEl: "Κριτικές",  icon: Star,            placeholder: false },
  ];
  // Insert availability tab before subscription only for full-calendar mode
  if (bookingMode === "full") {
    items.push({
      id:          "availability",
      labelEl:     "Διαθεσιμότητα",
      shortEl:     "Ώρες",
      icon:        Clock,
      placeholder: false,
    });
  }
  items.push(
    {
      id:          "referrals",
      labelEl:     "Παραπομπές",
      shortEl:     "Παραπ.",
      icon:        Share2,
      placeholder: false,
    },
    {
      id:          "subscription",
      labelEl:     "Συνδρομή",
      shortEl:     "Συνδρομή",
      icon:        CreditCard,
      placeholder: false,
    },
  );
  return items;
}

// ── Component ──────────────────────────────────────────────────
export default function DashboardNav({
  tab,
  proFirstName,
  proSlug,
  avatarUrl,
  initials,
  bookingMode,
}: DashboardNavProps) {
  const NAV_ITEMS = buildNavItems(bookingMode);
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  function navigate(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    // Clear the welcome banner when navigating away from overview
    if (id !== "overview") params.delete("welcome");
    router.push(`${pathname}?${params.toString()}`);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  // ── Sidebar item renderer ─────────────────────────────────
  function SidebarItem({ item }: { item: NavItem }) {
    const active = tab === item.id;
    const Icon   = item.icon;
    return (
      <button
        type="button"
        onClick={() => navigate(item.id)}
        style={{
          display:         "flex",
          alignItems:      "center",
          gap:             "0.75rem",
          width:           "100%",
          padding:         "0.625rem 0.875rem",
          borderRadius:    "10px",
          border:          "none",
          cursor:          "pointer",
          backgroundColor: active ? "var(--color-primary-bg)" : "transparent",
          color:           active ? "var(--color-primary)" : "var(--color-text-muted)",
          fontWeight:      active ? 700 : 500,
          fontSize:        "0.9rem",
          fontFamily:      "inherit",
          textAlign:       "left",
          transition:      "background-color 0.12s, color 0.12s",
          position:        "relative",
        }}
      >
        {/* Active left bar */}
        {active && (
          <span
            style={{
              position:        "absolute",
              left:            0,
              top:             "20%",
              bottom:          "20%",
              width:           "3px",
              backgroundColor: "var(--color-primary)",
              borderRadius:    "0 3px 3px 0",
            }}
          />
        )}
        <Icon size={17} />
        {item.labelEl}
        {item.placeholder && !active && (
          <span
            style={{
              marginLeft:      "auto",
              backgroundColor: "var(--color-bg-light)",
              border:          "1px solid var(--color-border)",
              borderRadius:    "4px",
              padding:         "0 4px",
              fontSize:        "0.65rem",
              color:           "var(--color-text-muted)",
              fontWeight:      500,
            }}
          >
            Σύντομα
          </span>
        )}
      </button>
    );
  }

  // ── Avatar ────────────────────────────────────────────────
  const avatar = avatarUrl ? (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={avatarUrl}
      alt={proFirstName}
      style={{
        width:        "36px",
        height:       "36px",
        borderRadius: "50%",
        objectFit:    "cover",
        flexShrink:   0,
        border:       "2px solid var(--color-primary)",
      }}
    />
  ) : (
    <div
      style={{
        width:           "36px",
        height:          "36px",
        borderRadius:    "50%",
        backgroundColor: "var(--color-primary)",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        color:           "#fff",
        fontSize:        "0.8rem",
        fontWeight:      800,
        flexShrink:      0,
        border:          "2px solid var(--color-primary)",
      }}
    >
      {initials}
    </div>
  );

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          DESKTOP SIDEBAR (hidden on mobile)
      ══════════════════════════════════════════════════════ */}
      <aside
        className="hidden md:flex"
        style={{
          width:           "220px",
          flexShrink:      0,
          flexDirection:   "column",
          position:        "sticky",
          top:             "64px",          // Below the ~64px sticky Navbar
          height:          "calc(100vh - 64px)",
          overflowY:       "auto",
          backgroundColor: "#fff",
          borderRight:     "1px solid var(--color-border)",
          padding:         "1.25rem 0.75rem",
          gap:             "0.25rem",
        }}
      >
        {/* Profile summary */}
        <div
          style={{
            display:      "flex",
            alignItems:   "center",
            gap:          "0.625rem",
            padding:      "0 0.25rem 1rem",
            borderBottom: "1px solid var(--color-border)",
            marginBottom: "0.75rem",
          }}
        >
          {avatar}
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin:       0,
                fontWeight:   700,
                fontSize:     "0.875rem",
                color:        "var(--color-text)",
                overflow:     "hidden",
                textOverflow: "ellipsis",
                whiteSpace:   "nowrap",
              }}
            >
              {proFirstName}
            </p>
            <p
              style={{
                margin:   "0.1rem 0 0",
                fontSize: "0.7rem",
                color:    "var(--color-text-muted)",
              }}
            >
              Επαγγελματίας
            </p>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.125rem", flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <SidebarItem key={item.id} item={item} />
          ))}
        </nav>

        {/* Bottom actions */}
        <div
          style={{
            borderTop:  "1px solid var(--color-border)",
            paddingTop: "0.75rem",
            marginTop:  "0.75rem",
            display:    "flex",
            flexDirection: "column",
            gap:        "0.125rem",
          }}
        >
          {/* Preview profile link */}
          {proSlug && (
            <Link
              href={`/professional/${proSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display:     "flex",
                alignItems:  "center",
                gap:         "0.75rem",
                padding:     "0.625rem 0.875rem",
                borderRadius:"10px",
                color:       "var(--color-text-muted)",
                fontSize:    "0.875rem",
                fontWeight:  500,
                textDecoration: "none",
              }}
            >
              <ExternalLink size={16} />
              Προεπισκόπηση
            </Link>
          )}

          {/* Sign out */}
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              display:     "flex",
              alignItems:  "center",
              gap:         "0.75rem",
              padding:     "0.625rem 0.875rem",
              borderRadius:"10px",
              border:      "none",
              cursor:      "pointer",
              backgroundColor: "transparent",
              color:       "var(--color-text-muted)",
              fontSize:    "0.875rem",
              fontWeight:  500,
              fontFamily:  "inherit",
              textAlign:   "left",
              width:       "100%",
            }}
          >
            <LogOut size={16} />
            Αποσύνδεση
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════
          MOBILE BOTTOM TABS (hidden on desktop)
      ══════════════════════════════════════════════════════ */}
      <nav
        className="md:hidden"
        style={{
          position:        "fixed",
          bottom:          0,
          left:            0,
          right:           0,
          zIndex:          100,
          backgroundColor: "#fff",
          borderTop:       "1px solid var(--color-border)",
          display:         "flex",
          alignItems:      "stretch",
          height:          "58px",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = tab === item.id;
          const Icon   = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              style={{
                flex:            1,
                display:         "flex",
                flexDirection:   "column",
                alignItems:      "center",
                justifyContent:  "center",
                gap:             "0.2rem",
                border:          "none",
                cursor:          "pointer",
                backgroundColor: "transparent",
                color:           active ? "var(--color-primary)" : "var(--color-text-muted)",
                fontFamily:      "inherit",
                padding:         "0.25rem",
                transition:      "color 0.12s",
              }}
            >
              <Icon size={20} />
              <span style={{ fontSize: "0.6rem", fontWeight: active ? 700 : 400, lineHeight: 1 }}>
                {item.shortEl}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
