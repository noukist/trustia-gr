// =============================================================
// components/admin/AnnouncementsTab.tsx
// =============================================================
// Admin tab: manage announcement bar messages.
//
// Simple model: create → live immediately, delete → gone.
// No scheduling, no active toggle.
// =============================================================

"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Megaphone } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────
interface Announcement {
  id:         string;
  text_el:    string;
  text_en:    string | null;
  link_url:   string | null;
  created_at: string;
}

interface AnnouncementsTabProps {
  announcements: Announcement[];
}

const EMPTY_FORM = { text_el: "", text_en: "", link_url: "" };

// ── Component ──────────────────────────────────────────────────
export default function AnnouncementsTab({ announcements: initial }: AnnouncementsTabProps) {
  const [items, setItems]       = useState<Announcement[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);

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
    if (form.text_en.trim())  payload.text_en  = form.text_en.trim();
    if (form.link_url.trim()) payload.link_url = form.link_url.trim();

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

  // ── Delete ──────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm("Διαγραφή ανακοίνωσης;")) return;

    setDeleting(id);
    const snapshot = items;
    setItems((prev) => prev.filter((a) => a.id !== id));

    const { error: err } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id);

    if (err) {
      setItems(snapshot);
      setError(`Σφάλμα διαγραφής: ${err.message}`);
    }

    setDeleting(null);
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
          <div style={{ marginBottom: "1rem" }}>
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

      {/* Error banner (outside form, for delete errors) */}
      {error && !showForm && (
        <p style={{ color: "#DC2626", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
          {error}
        </p>
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
                border:          "1.5px solid var(--color-primary)",
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
                  <span style={{ padding: "0.15rem 0.5rem", borderRadius: "99px", backgroundColor: "#D1FAE5", color: "#059669", fontSize: "0.7rem", fontWeight: 700 }}>
                    Ενεργή
                  </span>
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
                </p>
              </div>

              {/* Delete action */}
              <button
                type="button"
                onClick={() => handleDelete(a.id)}
                disabled={deleting === a.id}
                title="Διαγραφή"
                style={{
                  display:         "flex",
                  alignItems:      "center",
                  justifyContent:  "center",
                  width:           "34px",
                  height:          "34px",
                  flexShrink:      0,
                  border:          "1.5px solid #FEE2E2",
                  borderRadius:    "8px",
                  backgroundColor: "transparent",
                  color:           "#DC2626",
                  cursor:          deleting === a.id ? "not-allowed" : "pointer",
                  opacity:         deleting === a.id ? 0.5 : 1,
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
