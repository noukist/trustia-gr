// =============================================================
// components/admin/AdminNav.tsx
// =============================================================
// Left sidebar + mobile bottom tabs for the admin panel.
// Same visual pattern as DashboardNav but for admin sections.
// =============================================================

"use client";

import React             from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Flag,
  Megaphone,
  Settings,
  LogOut,
} from "lucide-react";
import { signOut } from "@/lib/auth/helpers";

// ── Types ──────────────────────────────────────────────────────
interface NavItem {
  id:      string;
  labelEl: string;
  shortEl: string;
  icon:    React.ComponentType<{ size?: number }>;
}

interface AdminNavProps {
  tab: string;
}

// ── Nav items ──────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  { id: "overview",       labelEl: "Επισκόπηση",     shortEl: "Αρχική",   icon: LayoutDashboard },
  { id: "professionals",  labelEl: "Επαγγελματίες",  shortEl: "Επαγγ.",   icon: Users           },
  { id: "reports",        labelEl: "Αναφορές",       shortEl: "Αναφορές", icon: Flag            },
  { id: "announcements",  labelEl: "Ανακοινώσεις",   shortEl: "Ανακ.",    icon: Megaphone       },
  { id: "settings",       labelEl: "Ρυθμίσεις",      shortEl: "Ρυθμ.",    icon: Settings        },
];

// ── Component ──────────────────────────────────────────────────
export default function AdminNav({ tab }: AdminNavProps) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  function navigate(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    router.push(`${pathname}?${params.toString()}`);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  // ── Sidebar item ───────────────────────────────────────────
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
      </button>
    );
  }

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          DESKTOP SIDEBAR
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
        {/* Header */}
        <div
          style={{
            padding:      "0 0.25rem 1rem",
            borderBottom: "1px solid var(--color-border)",
            marginBottom: "0.75rem",
          }}
        >
          <p
            style={{
              margin:     0,
              fontWeight: 800,
              fontSize:   "0.8rem",
              color:      "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Admin Panel
          </p>
        </div>

        {/* Nav items */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.125rem", flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <SidebarItem key={item.id} item={item} />
          ))}
        </nav>

        {/* Sign out */}
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "0.75rem", marginTop: "0.75rem" }}>
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              display:         "flex",
              alignItems:      "center",
              gap:             "0.75rem",
              padding:         "0.625rem 0.875rem",
              borderRadius:    "10px",
              border:          "none",
              cursor:          "pointer",
              backgroundColor: "transparent",
              color:           "var(--color-text-muted)",
              fontSize:        "0.875rem",
              fontWeight:      500,
              fontFamily:      "inherit",
              textAlign:       "left",
              width:           "100%",
            }}
          >
            <LogOut size={16} />
            Αποσύνδεση
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════
          MOBILE BOTTOM TABS
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
