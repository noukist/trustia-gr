// =============================================================
// components/admin/AnnouncementsTab.tsx
// =============================================================
// Admin tab: manage announcement bar messages.
//
// Supports:
//   - List all announcements (active first)
//   - Create new announcement (text_el required, text_en optional,
//     link_url optional, starts_at/ends_at optional)
//   - Toggle active/inactive
//   - Delete
//
// CLIENT COMPONENT — all mutations go directly to Supabase.
// =============================================================

"use client";

import React, { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, ToggleLeft, ToggleRight, Megaphone } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────
interface Announcement {
  id:         string;
  text_el:    string;
  text_en:    string | null;
  link_url:   string | null;
  active:     boolean;
  starts_at:  string | null;
  ends_at:    string | null;
  created_at: string;
}

interface AnnouncementsTabProps {
  announcements: Announcement[];
}

const EMPTY_FORM = {
  text_el:   "",
  text_en:   "",
  link_url:  "",
  starts_at: "",
  ends_at:   "",
};

// ── Component ──────────────────────────────────────────────────
export default function AnnouncementsTab({ announcements: initial }: AnnouncementsTabProps) {
  const [items, setItems]       = useState<Announcement[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [, startTrans]          = useTransition();

  const supabase = createClient();

  // ── Create ──────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.text_el.trim()) return;

    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {
      text_el: form.text_el.trim(),
      active:  true,
    };
    if (form.text_en.trim())   payload.text_en   = form.text_en.trim();
    if (form.link_url.trim())  payload.link_url  = form.link_url.trim();
    if (form.starts_at.trim()) payload.starts_at = form.starts_at.trim();
    if (form.ends_at.trim())   payload.ends_at   = form.ends_at.trim();

    const { data, error: err } = await supabase
      .from("announcements")
      .insert(payload)
      .select()
      .single();

    if (err) {
      setError(err.message);
    } else {
      setItems((prev) => [data as Announcement, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    }

    setSaving(false);
  }

  // ── Toggle active ───────────────────────────────────────────
  function toggleActive(id: string, current: boolean) {
    // Optimistic
    setItems((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !current } : a))
    );
    startTrans(async () => {
      await supabase
        .from("announcements")
        .update({ active: !current })
        .eq("id", id);
    });
  }

  // ── Delete ──────────────────────────────────────────────────
  function handleDelete(id: string) {
    if (!confirm("Διαγραφή ανακοίνωσης;")) return;
    setItems((prev) => prev.filter((a) => a.id !== id));
    startTrans(async () => {
      await supabase.from("announcements").delete().eq("id", id);
    });
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text)", margin: "0 0 0.25rem" }}>
            Ανακοινώσεις
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", margin: 0 }}>
            Μηνύματα announcement bar — εμφανίζεται στην κορυφή κάθε σελίδας
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          style={{
            display:         "flex",
            alignItems:      "center",
            gap:             "0.4rem",
            padding:         "0.5rem 1rem",
            backgroundColor: "var(--color-primary)",
            color:           "#fff",
            border:          "none",
            borderRadius:    "10px",
            fontFamily:      "inherit",
            fontSize:        "0.875rem",
            fontWeight:      700,
            cursor:          "pointer",
          }}
        >
          <Plus size={16} />
          Νέα Ανακοίνωση
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{
            backgroundColor: "#fff",
            border:          "1.5px solid var(--color-primary)",
            borderRadius:    "14px",
            padding:         "1.5rem",
            marginBottom:    "1.25rem",
          }}
        >
          <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700, color: "var(--color-text)" }}>
            Νέα Ανακοίνωση
          </h3>

          {/* Greek text (required) */}
          <div style={{ marginBottom: "0.875rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "0.3rem" }}>
              Κείμενο (Ελληνικά) *
            </label>
            <input
              type="text"
              required
              maxLength={200}
              value={form.text_el}
              onChange={(e) => setForm((f) => ({ ...f, text_el: e.target.value }))}
              placeholder="π.χ. Νέα κατηγορία διαθέσιμη!"
              style={{
                width:        "100%",
                boxSizing:    "border-box",
                padding:      "0.6rem 0.875rem",
                border:       "1.5px solid var(--color-border)",
                borderRadius: "8px",
                fontSize:     "0.9rem",
                fontFamily:   "inherit",
                outline:      "none",
              }}
            />
          </div>

          {/* English text */}
          <div style={{ marginBottom: "0.875rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "0.3rem" }}>
              Κείμενο (Αγγλικά)
            </label>
            <input
              type="text"
              maxLength={200}
              value={form.text_en}
              onChange={(e) => setForm((f) => ({ ...f, text_en: e.target.value }))}
              placeholder="e.g. New category available!"
              style={{
                width:        "100%",
                boxSizing:    "border-box",
                padding:      "0.6rem 0.875rem",
                border:       "1.5px solid var(--color-border)",
                borderRadius: "8px",
                fontSize:     "0.9rem",
                fontFamily:   "inherit",
                outline:      "none",
              }}
            />
          </div>

          {/* Link URL */}
          <div style={{ marginBottom: "0.875rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "0.3rem" }}>
              Link URL (προαιρετικό)
            </label>
            <input
              type="url"
              value={form.link_url}
              onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
              placeholder="https://..."
              style={{
                width:        "100%",
                boxSizing:    "border-box",
                padding:      "0.6rem 0.875rem",
                border:       "1.5px solid var(--color-border)",
                borderRadius: "8px",
                fontSize:     "0.9rem",
                fontFamily:   "inherit",
                outline:      "none",
              }}
            />
          </div>

          {/* Date range — stacks to 1-col on narrow screens */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.875rem", marginBottom: "0.875rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "0.3rem" }}>
                Έναρξη (προαιρετικό)
              </label>
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                style={{
                  width:        "100%",
                  boxSizing:    "border-box",
                  padding:      "0.6rem 0.875rem",
                  border:       "1.5px solid var(--color-border)",
                  borderRadius: "8px",
                  fontSize:     "0.875rem",
                  fontFamily:   "inherit",
                  outline:      "none",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "0.3rem" }}>
                Λήξη (προαιρετικό)
              </label>
              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                style={{
                  width:        "100%",
                  boxSizing:    "border-box",
                  padding:      "0.6rem 0.875rem",
                  border:       "1.5px solid var(--color-border)",
                  borderRadius: "8px",
                  fontSize:     "0.875rem",
                  fontFamily:   "inherit",
                  outline:      "none",
                }}
              />
            </div>
          </div>

          {error && (
            <p style={{ color: "#DC2626", fontSize: "0.85rem", margin: "0 0 0.75rem" }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: "0.625rem" }}>
            <button
              type="submit"
              disabled={saving || !form.text_el.trim()}
              style={{
                padding:         "0.55rem 1.25rem",
                backgroundColor: "var(--color-primary)",
                color:           "#fff",
                border:          "none",
                borderRadius:    "8px",
                fontFamily:      "inherit",
                fontSize:        "0.875rem",
                fontWeight:      700,
                cursor:          saving ? "not-allowed" : "pointer",
                opacity:         saving ? 0.65 : 1,
              }}
            >
              {saving ? "Αποθήκευση…" : "Δημιουργία"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setError(null); }}
              style={{
                padding:         "0.55rem 1.25rem",
                backgroundColor: "transparent",
                color:           "var(--color-text-muted)",
                border:          "1.5px solid var(--color-border)",
                borderRadius:    "8px",
                fontFamily:      "inherit",
                fontSize:        "0.875rem",
                fontWeight:      600,
                cursor:          "pointer",
              }}
            >
              Ακύρωση
            </button>
          </div>
        </form>
      )}

      {/* Announcements list */}
      {items.length === 0 ? (
        <div
          style={{
            backgroundColor: "#fff",
            border:          "1.5px solid var(--color-border)",
            borderRadius:    "16px",
            padding:         "3rem",
            textAlign:       "center",
            color:           "var(--color-text-muted)",
          }}
        >
          <Megaphone size={32} style={{ margin: "0 auto 0.75rem", opacity: 0.35 }} />
          <p style={{ margin: 0, fontWeight: 600 }}>Δεν υπάρχουν ανακοινώσεις</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {items.map((a) => (
            <div
              key={a.id}
              style={{
                backgroundColor: "#fff",
                border:          `1.5px solid ${a.active ? "var(--color-primary)" : "var(--color-border)"}`,
                borderRadius:    "14px",
                padding:         "1.125rem 1.25rem",
                display:         "flex",
                alignItems:      "flex-start",
                gap:             "1rem",
                flexWrap:        "wrap",
              }}
            >
              {/* Content */}
              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--color-text)" }}>
                    {a.text_el}
                  </span>
                  {a.active && (
                    <span style={{ padding: "0.15rem 0.5rem", borderRadius: "99px", backgroundColor: "#D1FAE5", color: "#059669", fontSize: "0.7rem", fontWeight: 700 }}>
                      Ενεργή
                    </span>
                  )}
                </div>
                {a.text_en && (
                  <p style={{ margin: "0 0 0.25rem", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                    EN: {a.text_en}
                  </p>
                )}
                {a.link_url && (
                  <p style={{ margin: "0 0 0.25rem", fontSize: "0.775rem", color: "var(--color-primary)" }}>
                    🔗 {a.link_url}
                  </p>
                )}
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  {new Date(a.created_at).toLocaleDateString("el-GR")}
                  {a.ends_at && ` · Λήγει ${new Date(a.ends_at).toLocaleDateString("el-GR")}`}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => toggleActive(a.id, a.active)}
                  title={a.active ? "Απενεργοποίηση" : "Ενεργοποίηση"}
                  style={{
                    display:         "flex",
                    alignItems:      "center",
                    gap:             "0.35rem",
                    padding:         "0.375rem 0.75rem",
                    border:          "1.5px solid var(--color-border)",
                    borderRadius:    "8px",
                    backgroundColor: "transparent",
                    color:           a.active ? "#D97706" : "#059669",
                    fontSize:        "0.8rem",
                    fontWeight:      700,
                    fontFamily:      "inherit",
                    cursor:          "pointer",
                  }}
                >
                  {a.active
                    ? <><ToggleRight size={15} /> Απενεργ.</>
                    : <><ToggleLeft  size={15} /> Ενεργοπ.</>
                  }
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  title="Διαγραφή"
                  style={{
                    display:         "flex",
                    alignItems:      "center",
                    justifyContent:  "center",
                    width:           "34px",
                    height:          "34px",
                    border:          "1.5px solid #FEE2E2",
                    borderRadius:    "8px",
                    backgroundColor: "transparent",
                    color:           "#DC2626",
                    cursor:          "pointer",
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
