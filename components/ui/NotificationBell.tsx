// =============================================================
// components/ui/NotificationBell.tsx
// =============================================================
// Bell icon with unread count badge + dropdown for the logged-in user.
//
// FLOW
//   • Fetches the 10 most recent notifications on mount.
//   • Shows a red badge with unread count.
//   • Opening the dropdown marks all visible notifications as read.
//   • Clicking a notification navigates to its `link` (locale-aware).
//   • Closes on outside click or Escape.
//
// ONLY RENDERED FOR LOGGED-IN USERS.
// The outer <NotificationBell> short-circuits to null when user is null,
// letting the inner component use hooks unconditionally.
// =============================================================

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell }               from "lucide-react";
import { useRouter }          from "@/i18n/navigation";
import { createClient }       from "@/lib/supabase/client";
import type { User }          from "@supabase/supabase-js";

// ── DB row ────────────────────────────────────────────────────
interface DbNotification {
  id:         string;
  title:      string;
  body:       string;
  link:       string | null;
  read:       boolean;
  created_at: string;
}

// ── Relative time (Greek short form) ─────────────────────────
function relTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1)  return "τώρα";
  if (mins < 60) return `${mins}λ`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}ω`;
  return `${Math.floor(hrs / 24)}μ`;
}

// ── Inner component (hooks always run) ───────────────────────
function NotificationBellInner() {
  const router         = useRouter();
  const containerRef   = useRef<HTMLDivElement>(null);
  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [loading,       setLoading]       = useState(true);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Fetch ─────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("id, title, body, link, read, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setNotifications(data as DbNotification[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // ── Mark all as read ──────────────────────────────────────
  async function markAllRead() {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unread.map((n) => n.id));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  // ── Toggle dropdown ───────────────────────────────────────
  function handleToggle() {
    if (!open) {
      setOpen(true);
      markAllRead();
    } else {
      setOpen(false);
    }
  }

  // ── Close on outside click ────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  // ── Close on Escape ───────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // ── Navigate to link ──────────────────────────────────────
  function handleItemClick(n: DbNotification) {
    setOpen(false);
    if (n.link) {
      // useRouter from @/i18n/navigation auto-prepends the current locale
      router.push(n.link as Parameters<typeof router.push>[0]);
    }
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div ref={containerRef} style={{ position: "relative" }}>

      {/* ── Bell button ── */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={`Ειδοποιήσεις${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
        aria-expanded={open}
        style={{
          position:        "relative",
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          width:           "36px",
          height:          "36px",
          background:      open ? "var(--color-primary-bg)" : "none",
          border:          "none",
          borderRadius:    "50%",
          cursor:          "pointer",
          color:           open ? "var(--color-primary)" : "var(--color-text-muted)",
          transition:      "background-color 0.15s, color 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.backgroundColor = "var(--color-bg-light)";
            e.currentTarget.style.color = "var(--color-text)";
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--color-text-muted)";
          }
        }}
      >
        <Bell size={19} />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            style={{
              position:        "absolute",
              top:             "3px",
              right:           "3px",
              minWidth:        "16px",
              height:          "16px",
              padding:         "0 3px",
              backgroundColor: "#E74C3C",
              color:           "#fff",
              borderRadius:    "99px",
              fontSize:        "0.625rem",
              fontWeight:      800,
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              lineHeight:      1,
              border:          "2px solid #fff",
              boxSizing:       "border-box",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          role="dialog"
          aria-label="Ειδοποιήσεις"
          style={{
            position:        "absolute",
            top:             "calc(100% + 8px)",
            right:           0,
            width:           "min(320px, 90vw)",
            backgroundColor: "#fff",
            border:          "1.5px solid var(--color-border)",
            borderRadius:    "14px",
            boxShadow:       "0 8px 32px rgba(0,0,0,0.12)",
            overflow:        "hidden",
            zIndex:          300,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding:        "0.75rem 1rem",
              borderBottom:   "1px solid var(--color-border)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize:   "0.9rem",
                color:      "var(--color-text)",
              }}
            >
              Ειδοποιήσεις
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                color:    "var(--color-text-muted)",
              }}
            >
              {notifications.length === 0
                ? ""
                : unreadCount === 0
                  ? "Όλες διαβασμένες"
                  : `${unreadCount} νέες`}
            </span>
          </div>

          {/* Content */}
          <div style={{ maxHeight: "380px", overflowY: "auto" }}>
            {loading ? (
              <div
                style={{
                  padding:   "2rem",
                  textAlign: "center",
                  color:     "var(--color-text-muted)",
                  fontSize:  "0.875rem",
                }}
              >
                Φόρτωση…
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: "2.5rem 1.5rem", textAlign: "center" }}>
                <p style={{ fontSize: "2rem", margin: "0 0 0.625rem" }}>🔔</p>
                <p
                  style={{
                    fontSize:   "0.875rem",
                    color:      "var(--color-text-muted)",
                    margin:     0,
                    lineHeight: 1.5,
                  }}
                >
                  Δεν υπάρχουν ειδοποιήσεις ακόμα
                </p>
              </div>
            ) : (
              notifications.map((n, i) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleItemClick(n)}
                  style={{
                    display:         "flex",
                    width:           "100%",
                    gap:             "0.625rem",
                    padding:         "0.75rem 1rem",
                    borderBottom:    i < notifications.length - 1
                      ? "1px solid var(--color-bg-light)"
                      : "none",
                    backgroundColor: n.read ? "transparent" : "rgba(42,143,143,0.05)",
                    cursor:          n.link ? "pointer" : "default",
                    textAlign:       "left",
                    border:          "none",
                    fontFamily:      "inherit",
                    transition:      "background-color 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    if (n.link) e.currentTarget.style.backgroundColor = "var(--color-bg-light)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      n.read ? "transparent" : "rgba(42,143,143,0.05)";
                  }}
                >
                  {/* Unread dot */}
                  <div
                    style={{
                      width:           "7px",
                      height:          "7px",
                      borderRadius:    "50%",
                      backgroundColor: n.read ? "transparent" : "var(--color-primary)",
                      flexShrink:      0,
                      marginTop:       "6px",
                    }}
                  />

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontWeight:  n.read ? 500 : 700,
                        fontSize:    "0.8125rem",
                        color:       "var(--color-text)",
                        margin:      "0 0 0.2rem",
                        lineHeight:  1.4,
                      }}
                    >
                      {n.title}
                    </p>
                    <p
                      style={{
                        fontSize:              "0.775rem",
                        color:                 "var(--color-text-muted)",
                        margin:                0,
                        lineHeight:            1.4,
                        overflow:              "hidden",
                        display:               "-webkit-box",
                        WebkitLineClamp:       2,
                        WebkitBoxOrient:       "vertical" as const,
                      }}
                    >
                      {n.body}
                    </p>
                  </div>

                  {/* Time */}
                  <span
                    style={{
                      fontSize:  "0.7rem",
                      color:     "var(--color-text-muted)",
                      flexShrink: 0,
                      marginTop: "3px",
                    }}
                  >
                    {relTime(n.created_at)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Public export — null if no user ──────────────────────────
export default function NotificationBell({ user }: { user: User | null }) {
  if (!user) return null;
  return <NotificationBellInner />;
}
