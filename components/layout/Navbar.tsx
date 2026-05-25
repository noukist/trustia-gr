// =============================================================
// components/layout/Navbar.tsx
// =============================================================
// Sticky top navigation bar for Trustia.gr.
//
// "use client" is required because this component:
//   - Tracks scroll position to add a shadow when the user scrolls
//   - Manages the mobile drawer open/close state
//   - Reads auth state from Supabase
//   - Has the LanguageSwitcher (EL/EN toggle)
//
// Structure:
//   <header>            — sticky wrapper with scroll shadow
//     <nav>             — centered container (max-w 1200px)
//       Logo            — TRUSTIA.GR, links to /
//       Desktop Links   — hidden on mobile (md:flex)
//       LanguageSwitcher— EL / EN pill
//       Desktop CTA     — Σύνδεση button, hidden on mobile
//       Hamburger       — visible only on mobile (md:hidden)
//   Backdrop            — dark overlay behind the open drawer
//   Drawer              — slides in from the right on mobile
// =============================================================

"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Menu, X, LogIn, LayoutDashboard, LogOut, ChevronDown, User as UserIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import Logo         from "@/components/ui/Logo";
import Button       from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { signOut }      from "@/lib/auth/helpers";

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
export default function Navbar() {
  const t = useTranslations("nav");

  // Whether the mobile drawer is open
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Whether the user has scrolled down (used to add shadow / border)
  const [scrolled, setScrolled] = useState(false);
  // Authenticated Supabase user (null = logged out)
  const [user, setUser] = useState<User | null>(null);
  // Whether the logged-in user has a professionals row
  const [isPro, setIsPro] = useState(false);

  // Navigation links — translated
  const NAV_LINKS = [
    { href: "/services",      label: t("services") },
    { href: "/professionals", label: t("forProfessionals") },
    { href: "/how-it-works",  label: t("howItWorks") },
  ];

  // Listen for scroll to apply the sticky shadow effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  // ── Auth state ─────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();

    async function checkPro(userId: string) {
      const { data } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      setIsPro(!!data);
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (data.user) checkPro(data.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) checkPro(session.user.id);
        else setIsPro(false);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      {/* ── Sticky header ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "#ffffff",
          borderBottom: `1px solid ${scrolled ? "var(--color-border)" : "transparent"}`,
          boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,0.07)" : "none",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        }}
      >
        {/* Max-width container */}
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 1.5rem",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1.5rem",
          }}
        >
          {/* ── Logo ── */}
          <div style={{ flexShrink: 0 }}>
            <Logo size="md" linkToHome />
          </div>

          {/* ── Desktop nav links (hidden on mobile) ── */}
          <nav
            aria-label={t("mainNav")}
            className="hidden md:flex"
            style={{ alignItems: "center", gap: "2rem", flex: 1 }}
          >
            {NAV_LINKS.map(({ href, label }) => (
              <NavLink key={href} href={href}>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* ── Desktop right group: Language switcher + CTA ── */}
          <div
            className="hidden md:flex"
            style={{ alignItems: "center", gap: "0.75rem", flexShrink: 0 }}
          >
            <LanguageSwitcher />
            {user ? (
              <UserMenu user={user} isPro={isPro} t={t} />
            ) : (
              <Button variant="outline" size="sm" href="/login" icon={LogIn}>
                {t("login")}
              </Button>
            )}
          </div>

          {/* ── Mobile hamburger button (hidden on desktop) ── */}
          <button
            className="md:hidden"
            aria-label={drawerOpen ? t("closeMenu") : t("openMenu")}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((v) => !v)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.375rem",
              color: "var(--color-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              flexShrink: 0,
            }}
          >
            {drawerOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* ── Mobile backdrop ── */}
      <div
        aria-hidden="true"
        onClick={closeDrawer}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 48,
          backgroundColor: "rgba(0, 0, 0, 0.35)",
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* ── Mobile slide-out drawer ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("navMenu")}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 49,
          width: "min(320px, 85vw)",
          backgroundColor: "#ffffff",
          boxShadow: "-4px 0 32px rgba(0, 0, 0, 0.12)",
          display: "flex",
          flexDirection: "column",
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Drawer header: logo + close button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <Logo size="sm" linkToHome onClick={closeDrawer} />
          <button
            aria-label={t("closeMenu")}
            onClick={closeDrawer}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-muted)",
              padding: "0.25rem",
              display: "flex",
              alignItems: "center",
              borderRadius: "6px",
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Drawer nav links */}
        <nav
          aria-label={t("navMenu")}
          style={{ flex: 1, overflowY: "auto", padding: "0.5rem 0" }}
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={closeDrawer}
              style={{
                display: "block",
                padding: "0.9rem 1.25rem",
                color: "var(--color-text)",
                textDecoration: "none",
                fontSize: "1rem",
                fontWeight: 500,
                borderBottom: "1px solid var(--color-bg-light)",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-primary-bg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {label}
            </Link>
          ))}

          {/* Language switcher in drawer */}
          <div style={{ padding: "0.9rem 1.25rem", borderBottom: "1px solid var(--color-bg-light)" }}>
            <LanguageSwitcher />
          </div>
        </nav>

        {/* Drawer footer: auth-aware CTA */}
        <div
          style={{
            padding: "1.25rem",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          {user ? (
            <DrawerUserFooter user={user} isPro={isPro} onClose={closeDrawer} t={t} />
          ) : (
            <Button
              variant="outline"
              size="md"
              href="/login"
              icon={LogIn}
              fullWidth
              onClick={closeDrawer as React.MouseEventHandler<HTMLButtonElement>}
            >
              {t("login")}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------

// ── Language switcher ─────────────────────────────────────────
function LanguageSwitcher() {
  const locale   = useLocale();
  const router   = useRouter();
  const pathname = usePathname();

  const switchTo = (newLocale: string) => {
    router.push(pathname, { locale: newLocale });
  };

  return (
    <div
      style={{
        display:         "flex",
        alignItems:      "center",
        border:          "1.5px solid var(--color-border)",
        borderRadius:    "999px",
        overflow:        "hidden",
        fontSize:        "0.8125rem",
        fontWeight:      600,
      }}
    >
      {(["el", "en"] as const).map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => switchTo(loc)}
          disabled={locale === loc}
          style={{
            padding:         "0.25rem 0.625rem",
            border:          "none",
            cursor:          locale === loc ? "default" : "pointer",
            fontFamily:      "inherit",
            fontSize:        "inherit",
            fontWeight:      "inherit",
            backgroundColor: locale === loc ? "var(--color-primary)" : "transparent",
            color:           locale === loc ? "#fff" : "var(--color-text-muted)",
            transition:      "background-color 0.15s, color 0.15s",
          }}
          aria-label={`Switch to ${loc === "el" ? "Greek" : "English"}`}
          aria-pressed={locale === loc}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────

/** Derive two-letter initials from a Supabase User */
function getInitials(u: User): string {
  const name: string =
    (u.user_metadata?.full_name as string | undefined) ||
    (u.user_metadata?.name    as string | undefined) ||
    u.email ||
    "?";
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

/** Derive display name for the dropdown header */
function getDisplayName(u: User): string {
  return (
    (u.user_metadata?.full_name as string | undefined) ||
    (u.user_metadata?.name    as string | undefined) ||
    u.email ||
    "Χρήστης"
  );
}

// ── Avatar circle (image or initials fallback) ────────────────
function AvatarCircle({ user, size = 34 }: { user: User; size?: number }) {
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const initials  = getInitials(user);

  if (avatarUrl) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={avatarUrl}
        alt={getDisplayName(user)}
        referrerPolicy="no-referrer"
        style={{
          width:        size,
          height:       size,
          borderRadius: "50%",
          objectFit:    "cover",
          border:       "2px solid var(--color-primary)",
          display:      "block",
          flexShrink:   0,
        }}
      />
    );
  }

  const palette = ["var(--color-primary)", "#1A6F6F", "#D4A039", "#27AE60", "#8B5CF6"];
  const idx     = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % palette.length;

  return (
    <div
      aria-label={initials}
      style={{
        width:           size,
        height:          size,
        borderRadius:    "50%",
        backgroundColor: palette[idx],
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        color:           "#fff",
        fontSize:        size * 0.38,
        fontWeight:      800,
        userSelect:      "none",
        flexShrink:      0,
        border:          "2px solid var(--color-primary)",
      }}
    >
      {initials}
    </div>
  );
}

// ── Desktop user menu (avatar + dropdown) ─────────────────────
function UserMenu({ user, isPro, t }: { user: User; isPro: boolean; t: ReturnType<typeof useTranslations<"nav">> }) {
  const [open, setOpen]         = useState(false);
  const containerRef            = useRef<HTMLDivElement>(null);
  const displayName             = getDisplayName(user);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    window.location.href = "/";
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          display:         "flex",
          alignItems:      "center",
          gap:             "0.375rem",
          background:      "none",
          border:          "none",
          cursor:          "pointer",
          padding:         "0.25rem 0.375rem",
          borderRadius:    "99px",
          transition:      "background-color 0.15s",
          backgroundColor: open ? "var(--color-primary-bg)" : "transparent",
        }}
      >
        <AvatarCircle user={user} size={34} />
        <ChevronDown
          size={14}
          style={{
            color:     "var(--color-text-muted)",
            transition:"transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position:        "absolute",
            top:             "calc(100% + 8px)",
            right:           0,
            minWidth:        "220px",
            backgroundColor: "#fff",
            border:          "1.5px solid var(--color-border)",
            borderRadius:    "14px",
            boxShadow:       "0 8px 32px rgba(0,0,0,0.12)",
            overflow:        "hidden",
            zIndex:          200,
          }}
        >
          {/* User info header */}
          <div
            style={{
              padding:      "0.875rem 1rem",
              borderBottom: "1px solid var(--color-border)",
              display:      "flex",
              alignItems:   "center",
              gap:          "0.625rem",
            }}
          >
            <AvatarCircle user={user} size={32} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {displayName}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </p>
            </div>
          </div>

          {/* Menu items */}
          <div style={{ padding: "0.375rem" }}>
            {isPro ? (
              <DropdownItem
                href="/dashboard"
                icon={<LayoutDashboard size={15} />}
                label={t("dashboard")}
                onClick={() => setOpen(false)}
              />
            ) : (
              <DropdownItem
                href="/profile"
                icon={<UserIcon size={15} />}
                label={t("myProfile")}
                onClick={() => setOpen(false)}
              />
            )}
            <div style={{ height: "1px", backgroundColor: "var(--color-border)", margin: "0.375rem 0" }} />
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              style={{
                display:         "flex",
                alignItems:      "center",
                gap:             "0.625rem",
                width:           "100%",
                padding:         "0.5rem 0.75rem",
                border:          "none",
                borderRadius:    "8px",
                background:      "none",
                cursor:          "pointer",
                fontSize:        "0.875rem",
                fontFamily:      "inherit",
                color:           "#E74C3C",
                fontWeight:      500,
                textAlign:       "left",
                transition:      "background-color 0.12s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#FEF2F2"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <LogOut size={15} />
              {t("logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Single item inside the dropdown */
function DropdownItem({
  href,
  icon,
  label,
  onClick,
}: {
  href:    string;
  icon:    React.ReactNode;
  label:   string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      style={{
        display:        "flex",
        alignItems:     "center",
        gap:            "0.625rem",
        padding:        "0.5rem 0.75rem",
        borderRadius:   "8px",
        color:          "var(--color-text)",
        textDecoration: "none",
        fontSize:       "0.875rem",
        fontWeight:     500,
        transition:     "background-color 0.12s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-primary-bg)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
    >
      <span style={{ color: "var(--color-primary)", display: "flex" }}>{icon}</span>
      {label}
    </Link>
  );
}

// ── Mobile drawer: logged-in footer ───────────────────────────
function DrawerUserFooter({
  user,
  isPro,
  onClose,
  t,
}: {
  user: User;
  isPro: boolean;
  onClose: () => void;
  t: ReturnType<typeof useTranslations<"nav">>;
}) {
  const displayName = getDisplayName(user);

  async function handleSignOut() {
    onClose();
    await signOut();
    window.location.href = "/";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
      <div
        style={{
          display:         "flex",
          alignItems:      "center",
          gap:             "0.625rem",
          padding:         "0.625rem 0.75rem",
          backgroundColor: "var(--color-bg-light)",
          borderRadius:    "10px",
        }}
      >
        <AvatarCircle user={user} size={36} />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email}
          </p>
        </div>
      </div>

      <Link
        href={isPro ? "/dashboard" : "/profile"}
        onClick={onClose}
        style={{
          display:         "flex",
          alignItems:      "center",
          gap:             "0.5rem",
          padding:         "0.75rem",
          backgroundColor: "var(--color-primary)",
          color:           "#fff",
          borderRadius:    "10px",
          fontWeight:      700,
          fontSize:        "0.9375rem",
          textDecoration:  "none",
        }}
      >
        {isPro ? <LayoutDashboard size={17} /> : <UserIcon size={17} />}
        {isPro ? t("dashboard") : t("myProfile")}
      </Link>

      <button
        type="button"
        onClick={handleSignOut}
        style={{
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          gap:             "0.5rem",
          padding:         "0.625rem",
          border:          "1.5px solid #FECACA",
          borderRadius:    "10px",
          backgroundColor: "#FEF2F2",
          color:           "#991B1B",
          fontSize:        "0.875rem",
          fontWeight:      600,
          cursor:          "pointer",
          fontFamily:      "inherit",
        }}
      >
        <LogOut size={15} />
        {t("logout")}
      </button>
    </div>
  );
}

// ── Desktop nav link with hover color change ──────────────────
function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        color: "var(--color-text-muted)",
        textDecoration: "none",
        fontSize: "0.9375rem",
        fontWeight: 500,
        whiteSpace: "nowrap",
        transition: "color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--color-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--color-text-muted)";
      }}
    >
      {children}
    </Link>
  );
}
