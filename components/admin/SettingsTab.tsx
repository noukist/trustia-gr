// =============================================================
// components/admin/SettingsTab.tsx
// =============================================================
// Admin tab: edit platform_settings key-value store.
//
// The table stores JSONB values.  This UI treats them as strings
// (JSON.stringify / JSON.parse) so the admin can edit any type.
//
// CLIENT COMPONENT — inline editing with save per row.
// =============================================================

"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Save, Settings } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────
interface Setting {
  key:         string;
  value:       unknown;         // JSONB — could be any type
  description: string | null;
}

interface SettingsTabProps {
  settings: Setting[];
}

// ── Component ──────────────────────────────────────────────────
export default function SettingsTab({ settings: initial }: SettingsTabProps) {
  // editing[key] = current draft string value
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving,  setSaving]  = useState<Record<string, boolean>>({});
  const [saved,   setSaved]   = useState<Record<string, boolean>>({});
  const [errors,  setErrors]  = useState<Record<string, string>>({});

  const supabase = createClient();

  function getDraft(key: string, originalValue: unknown): string {
    if (key in editing) return editing[key];
    // Format the original value as JSON string for display
    if (typeof originalValue === "string") return originalValue;
    return JSON.stringify(originalValue, null, 2);
  }

  function setDraft(key: string, val: string) {
    setEditing((prev) => ({ ...prev, [key]: val }));
    // Clear saved/error indicators when editing
    setSaved((prev) => ({ ...prev, [key]: false }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  async function saveKey(key: string, originalValue: unknown) {
    const draft = getDraft(key, originalValue);

    // Parse the draft back to JSON value
    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(draft);
    } catch {
      // If not valid JSON, treat as raw string
      parsedValue = draft;
    }

    setSaving((prev) => ({ ...prev, [key]: true }));

    const { error } = await supabase
      .from("platform_settings")
      .update({ value: parsedValue, updated_at: new Date().toISOString() })
      .eq("key", key);

    if (error) {
      setErrors((prev) => ({ ...prev, [key]: error.message }));
    } else {
      setSaved((prev) => ({ ...prev, [key]: true }));
      // Clear the saved indicator after 2s
      setTimeout(() => setSaved((prev) => ({ ...prev, [key]: false })), 2000);
    }

    setSaving((prev) => ({ ...prev, [key]: false }));
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text)", margin: "0 0 0.25rem" }}>
          Ρυθμίσεις Πλατφόρμας
        </h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", margin: 0 }}>
          Επεξεργασία διαμορφώσιμων παραμέτρων — τιμές σε JSON format
        </p>
      </div>

      {initial.length === 0 ? (
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
          <Settings size={32} style={{ margin: "0 auto 0.75rem", opacity: 0.35 }} />
          <p style={{ margin: 0, fontWeight: 600 }}>Δεν βρέθηκαν ρυθμίσεις</p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#fff",
            border:          "1.5px solid var(--color-border)",
            borderRadius:    "16px",
            overflow:        "hidden",
          }}
        >
          {initial.map((s, idx) => {
            const isLast  = idx === initial.length - 1;
            const draft   = getDraft(s.key, s.value);
            const isMulti = draft.includes("\n") || draft.length > 60;

            return (
              <div
                key={s.key}
                style={{
                  padding:      "1.125rem 1.5rem",
                  borderBottom: isLast ? "none" : "1px solid var(--color-border)",
                  display:      "flex",
                  gap:          "1rem",
                  alignItems:   "flex-start",
                  flexWrap:     "wrap",
                }}
              >
                {/* Key + description */}
                <div style={{ minWidth: "220px", flex: "0 0 220px" }}>
                  <p
                    style={{
                      margin:     "0 0 0.2rem",
                      fontFamily: "monospace",
                      fontSize:   "0.8375rem",
                      fontWeight: 700,
                      color:      "var(--color-text)",
                    }}
                  >
                    {s.key}
                  </p>
                  {s.description && (
                    <p style={{ margin: 0, fontSize: "0.775rem", color: "var(--color-text-muted)", lineHeight: 1.4 }}>
                      {s.description}
                    </p>
                  )}
                </div>

                {/* Value editor */}
                <div style={{ flex: 1, minWidth: "180px" }}>
                  {isMulti ? (
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(s.key, e.target.value)}
                      rows={3}
                      style={{
                        width:        "100%",
                        boxSizing:    "border-box",
                        padding:      "0.5rem 0.75rem",
                        border:       `1.5px solid ${errors[s.key] ? "#DC2626" : "var(--color-border)"}`,
                        borderRadius: "8px",
                        fontFamily:   "monospace",
                        fontSize:     "0.825rem",
                        outline:      "none",
                        resize:       "vertical",
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={draft}
                      onChange={(e) => setDraft(s.key, e.target.value)}
                      style={{
                        width:        "100%",
                        boxSizing:    "border-box",
                        padding:      "0.5rem 0.75rem",
                        border:       `1.5px solid ${errors[s.key] ? "#DC2626" : "var(--color-border)"}`,
                        borderRadius: "8px",
                        fontFamily:   "monospace",
                        fontSize:     "0.825rem",
                        outline:      "none",
                      }}
                    />
                  )}
                  {errors[s.key] && (
                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.775rem", color: "#DC2626" }}>
                      {errors[s.key]}
                    </p>
                  )}
                </div>

                {/* Save button */}
                <button
                  type="button"
                  onClick={() => saveKey(s.key, s.value)}
                  disabled={saving[s.key]}
                  style={{
                    display:         "flex",
                    alignItems:      "center",
                    gap:             "0.35rem",
                    padding:         "0.45rem 0.875rem",
                    backgroundColor: saved[s.key] ? "#D1FAE5" : "var(--color-primary)",
                    color:           saved[s.key] ? "#059669" : "#fff",
                    border:          "none",
                    borderRadius:    "8px",
                    fontFamily:      "inherit",
                    fontSize:        "0.8rem",
                    fontWeight:      700,
                    cursor:          saving[s.key] ? "not-allowed" : "pointer",
                    opacity:         saving[s.key] ? 0.65 : 1,
                    flexShrink:      0,
                    transition:      "background-color 0.2s, color 0.2s",
                  }}
                >
                  <Save size={14} />
                  {saving[s.key] ? "…" : saved[s.key] ? "✓" : "Αποθήκευση"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
