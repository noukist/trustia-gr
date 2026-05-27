// =============================================================
// components/dashboard/DashboardNav.tsx
// =============================================================
// Navigation for the professional dashboard.
//
// LAYOUT
//   Desktop (md+):  sticky left sidebar, 220 px wide.
//   Mobile:         fixed bottom bar — always exactly 5 slots:
//                   Overview · Profile · Bookings · Reviews · More(⋯)
//                   "More" opens a slide-up sheet listing every
//                   remaining tab plus sign-out. This caps the bar
//                   at 5 items regardless of how many tabs exist.
// =============================================================

"use client";

import React, { useState }  from "react";
import Link                  from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Calendar,
  Star,
  CreditCard,
  Clock,
  Building2,
  Share2,
  ExternalLink,
  LogOut,
  MoreHorizontal,
  X,
} from "lucide-react";
import { signOut } from "@/lib/auth/helpers";

// ── Types ──────────────────────────────────────────────────────
interface NavItem {
  id:          string;
  labelEl:     string;
  shortEl:     string;
  icon:        React.ComponentType<{ size?: number }>;
  placeholder: boolean;
}

interface DashboardNavProps {
  tab:          string;
  proFirstName: string;
  proSlug:      string | null;
  avatarUrl:    string | null;
  initials:     string;
  bookingMode:  "contact" | "date" | "full";
}

// ── Nav items builder ──────────────────────────────────────────
// Returns ALL items; mobile renders only the first 4 + a "More" button.
function buildNavItems(bookingMode: "contact" | "date" | "full"): NavItem[] {
  const items: NavItem[] = [
    { id: "overview",  labelEl: "Επισκόπηση", shortEl: "Αρχική",    icon: LayoutDashboard, placeholder: false },
    { id: "profile",   labelEl: "Προφίλ",      shortEl: "Προφίλ",    icon: User,            placeholder: false },
    { id: "bookings",  labelEl: "Κρατήσεις",  shortEl: "Κρατήσεις", icon: Calendar,        placeholder: false },
    { id: "reviews",   labelEl: "Κριτικές",   shortEl: "Κριτικές",  icon: Star,            placeholder: false },
  ];
  if (bookingMode === "full") {
    items.push({ id: "availability", labelEl: "Διαθεσιμότητα", shortEl: "Ώρες",     icon: Clock,     placeholder: false });
  }
  items.push(
    { id: "business",     labelEl: "Επιχείρηση", shortEl: "Επιχ.",    icon: Building2, placeholder: false },
    { id: "referrals",    labelEl: "Παραπομπές", shortEl: "Παραπ.",   icon: Share2,    placeholder: false },
    { id: "subscription", labelEl: "Συνδρομή",   shortEl: "Συνδρομή", icon: CreditCard,placeholder: false },
  );
  return items;
}

// ── Shared sidebar button ──────────────────────────────────────
function SidebarItem({
  item,
  active,
  onClick,
}: {
  item:    NavItem;
  active:  boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
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

// ── Component ──────────────────────────────────────────────────
export default function DashboardNav({
  tab,
  proFirstName,
  proSlug,
  avatarUrl,
  initials,
  bookingMode,
}: DashboardNavProps) {
  const NAV_ITEMS    = buildNavItems(bookingMode);
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  // Mobile "More" sheet state
  const [moreOpen, setMoreOpen] = useState(false);

  // The 4 primary tabs always shown in the mobile bar
  const PRIMARY_TABS = NAV_ITEMS.slice(0, 4);
  // Everything else goes into the "More" sheet
  const OVERFLOW_TABS = NAV_ITEMS.slice(4);

  // Whether the active tab is hidden in the overflow group
  const activeIsOverflow = OVERFLOW_TABS.some((i) => i.id === tab);

  function navigate(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    if (id !== "overview") params.delete("welcome");
    router.push(`${pathname}?${params.toString()}`);
    setMoreOpen(false);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
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
          top:             "64px",
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
            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {proFirstName}
            </p>
            <p style={{ margin: "0.1rem 0 0", fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
              Επαγγελματίας
            </p>
          </div>
        </div>

        {/* All nav items on desktop */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.125rem", flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              active={tab === item.id}
              onClick={() => navigate(item.id)}
            />
          ))}
        </nav>

        {/* Bottom actions */}
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "0.75rem", marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.125rem" }}>
          {proSlug && (
            <Link
              href={`/professional/${proSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0.875rem", borderRadius: "10px", color: "var(--color-text-muted)", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none" }}
            >
              <ExternalLink size={16} />
              Προεπισκόπηση
            </Link>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0.875rem", borderRadius: "10px", border: "none", cursor: "pointer", backgroundColor: "transparent", color: "var(--color-text-muted)", fontSize: "0.875rem", fontWeight: 500, fontFamily: "inherit", textAlign: "left", width: "100%" }}
          >
            <LogOut size={16} />
            Αποσύνδεση
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════
          MOBILE BOTTOM BAR — exactly 5 slots (hidden on desktop)
          Slots: Overview · Profile · Bookings · Reviews · More
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
        {/* 4 primary tabs */}
        {PRIMARY_TABS.map((item) => {
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

        {/* "More ⋯" button — highlighted when active tab is in overflow */}
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
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
            color:           (moreOpen || activeIsOverflow) ? "var(--color-primary)" : "var(--color-text-muted)",
            fontFamily:      "inherit",
            padding:         "0.25rem",
            transition:      "color 0.12s",
            position:        "relative",
          }}
        >
          <MoreHorizontal size={20} />
          <span style={{ fontSize: "0.6rem", fontWeight: (moreOpen || activeIsOverflow) ? 700 : 400, lineHeight: 1 }}>
            Περισσότερα
          </span>
          {/* Dot indicator when active tab is hidden in overflow */}
          {activeIsOverflow && !moreOpen && (
            <span
              style={{
                position:        "absolute",
                top:             "6px",
                right:           "calc(50% - 14px)",
                width:           "6px",
                height:          "6px",
                borderRadius:    "50%",
                backgroundColor: "var(--color-primary)",
              }}
            />
          )}
        </button>
      </nav>

      {/* ══════════════════════════════════════════════════════
          MOBILE "MORE" SLIDE-UP SHEET
      ══════════════════════════════════════════════════════ */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden"
            onClick={() => setMoreOpen(false)}
            style={{
              position:        "fixed",
              inset:           0,
              zIndex:          99,
              backgroundColor: "rgba(0,0,0,0.35)",
            }}
          />

          {/* Sheet */}
          <div
            className="md:hidden"
            style={{
              position:        "fixed",
              bottom:          "58px",   // sits above the bottom bar
              left:            0,
              right:           0,
              zIndex:          100,
              backgroundColor: "#fff",
              borderRadius:    "16px 16px 0 0",
              boxShadow:       "0 -4px 24px rgba(0,0,0,0.12)",
              padding:         "1rem 0.75rem 1.25rem",
            }}
          >
            {/* Handle + close */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", padding: "0 0.25rem" }}>
              <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Περισσότερα
              </p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "0.25rem" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Overflow nav items */}
            {OVERFLOW_TABS.map((item) => {
              const Icon   = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  style={{
                    display:         "flex",
                    alignItems:      "center",
                    gap:             "0.875rem",
                    width:           "100%",
                    padding:         "0.75rem 0.875rem",
                    borderRadius:    "10px",
                    border:          "none",
                    cursor:          "pointer",
                    backgroundColor: active ? "var(--color-primary-bg)" : "transparent",
                    color:           active ? "var(--color-primary)" : "var(--color-text)",
                    fontWeight:      active ? 700 : 500,
                    fontSize:        "0.9375rem",
                    fontFamily:      "inherit",
                    textAlign:       "left",
                  }}
                >
                  <Icon size={20} />
                  {item.labelEl}
                </button>
              );
            })}

            <div style={{ borderTop: "1px solid var(--color-border)", marginTop: "0.5rem", paddingTop: "0.5rem" }}>
              {proSlug && (
                <Link
                  href={`/professional/${proSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMoreOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.75rem 0.875rem", borderRadius: "10px", color: "var(--color-text-muted)", fontSize: "0.9375rem", fontWeight: 500, textDecoration: "none" }}
                >
                  <ExternalLink size={20} />
                  Προεπισκόπηση προφίλ
                </Link>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                style={{ display: "flex", alignItems: "center", gap: "0.875rem", width: "100%", padding: "0.75rem 0.875rem", borderRadius: "10px", border: "none", cursor: "pointer", backgroundColor: "transparent", color: "var(--color-text-muted)", fontSize: "0.9375rem", fontWeight: 500, fontFamily: "inherit", textAlign: "left" }}
              >
                <LogOut size={20} />
                Αποσύνδεση
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
