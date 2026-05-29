// =============================================================
// components/dashboard/InviteLinksManager.tsx
// =============================================================
// Client Component rendered inside ReviewsTab.
//
// Lets professionals generate shareable invite links so their
// existing customers can leave a review (type="invitation",
// weight=1.0 — PRD §38).
//
// LIMITS (PRD §38)
//   Max 30 active invitations per professional (checked client-side
//   before insert; enforced server-side via RLS / trigger TBD).
//
// LINK FORMAT
//   https://[origin]/invite/[code]
//   The /invite/[code] page validates the code and redirects to
//   /professional/[slug]?invite=[code] where the modal auto-opens.
//
// OPERATIONS
//   Generate — insert a new row with a random 8-char code
//   Copy     — copy the full URL to clipboard
//   Delete   — delete the row (doesn't affect existing reviews)
// =============================================================

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Copy, Trash2, Check, Loader2, Link2 } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

interface InviteRow {
  id:         string;
  code:       string;
  max_uses:   number;
  used_count: number;
  expires_at: string | null;
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────

/** Generate a random URL-safe code */
function randomCode(len = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

// ── Component ──────────────────────────────────────────────────

export default function InviteLinksManager({
  professionalId,
  proSlug,
}: {
  professionalId: string;
  /** Used to build the full URL shown to the professional */
  proSlug: string | null;
}) {
  const [links,     setLinks]     = useState<InviteRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [creating,  setCreating]  = useState(false);
  const [copiedId,  setCopiedId]  = useState<string | null>(null);
  const [deleteId,  setDeleteId]  = useState<string | null>(null);
  const [errMsg,    setErrMsg]    = useState("");

  // ── Fetch existing links ─────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("review_invitations")
      .select("id, code, max_uses, used_count, expires_at, created_at")
      .eq("professional_id", professionalId)
      .order("created_at", { ascending: false });
    setLinks((data ?? []) as InviteRow[]);
    setLoading(false);
  }, [professionalId]);

  useEffect(() => { load(); }, [load]);

  // ── Generate a new invite link ───────────────────────────────
  async function handleGenerate() {
    if (links.length >= 30) {
      setErrMsg("Έφτασες το όριο των 30 συνδέσμων πρόσκλησης.");
      return;
    }
    setCreating(true);
    setErrMsg("");
    const supabase = createClient();

    // Retry with a new code if there's a unique conflict (very unlikely)
    let inserted = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = randomCode(10);
      const { data, error } = await supabase
        .from("review_invitations")
        .insert({
          professional_id: professionalId,
          code,
          max_uses:   50,  // single link, up to 50 uses
          used_count: 0,
        })
        .select("id, code, max_uses, used_count, expires_at, created_at")
        .single();

      if (!error && data) {
        setLinks(prev => [data as InviteRow, ...prev]);
        inserted = true;
        break;
      }
      if (error && !error.message.includes("unique")) {
        setErrMsg(error.message);
        break;
      }
    }

    if (!inserted && !errMsg) {
      setErrMsg("Δεν ήταν δυνατή η δημιουργία συνδέσμου. Δοκίμασε ξανά.");
    }
    setCreating(false);
  }

  // ── Copy URL to clipboard ────────────────────────────────────
  async function handleCopy(code: string, id: string) {
    const url = `${window.location.origin}/invite/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for browsers that block clipboard
      window.prompt("Αντίγραψε τον σύνδεσμο:", url);
    }
  }

  // ── Delete a link ────────────────────────────────────────────
  async function handleDelete(id: string) {
    setDeleteId(id);
    const supabase = createClient();
    const { error } = await supabase
      .from("review_invitations")
      .delete()
      .eq("id", id);
    if (!error) {
      setLinks(prev => prev.filter(l => l.id !== id));
    }
    setDeleteId(null);
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div
      style={{
        backgroundColor: "#fff",
        border:          "1.5px solid var(--color-border)",
        borderRadius:    "14px",
        overflow:        "hidden",
        marginBottom:    "1rem",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding:         "1.125rem 1.5rem",
          borderBottom:    "1px solid var(--color-border)",
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "space-between",
          gap:             "1rem",
          flexWrap:        "wrap",
        }}
      >
        <div>
          <h3
            style={{
              margin:     0,
              fontWeight: 700,
              fontSize:   "1rem",
              color:      "var(--color-text)",
              display:    "flex",
              alignItems: "center",
              gap:        "0.5rem",
            }}
          >
            <Link2 size={16} style={{ color: "var(--color-primary)" }} />
            Σύνδεσμοι Πρόσκλησης
          </h3>
          <p
            style={{
              margin:   "0.2rem 0 0",
              fontSize: "0.8125rem",
              color:    "var(--color-text-muted)",
            }}
          >
            Στείλε σε παλιούς πελάτες για να αφήσουν κριτική (βαρύτητα ×1.0).
          </p>
        </div>

        {/* Generate button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={creating || links.length >= 30}
          style={{
            display:         "inline-flex",
            alignItems:      "center",
            gap:             "0.375rem",
            padding:         "0.5rem 1rem",
            backgroundColor: creating || links.length >= 30
              ? "var(--color-border)"
              : "var(--color-primary)",
            color:           "#fff",
            border:          "none",
            borderRadius:    "8px",
            cursor:          creating || links.length >= 30 ? "not-allowed" : "pointer",
            fontSize:        "0.875rem",
            fontWeight:      600,
            fontFamily:      "inherit",
            flexShrink:      0,
            transition:      "background-color 0.15s",
          }}
        >
          {creating
            ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
            : <Plus size={14} />
          }
          Νέος Σύνδεσμος
        </button>
      </div>

      {/* Error */}
      {errMsg && (
        <div
          style={{
            padding:         "0.625rem 1.5rem",
            backgroundColor: "#FEF2F2",
            color:           "#991B1B",
            fontSize:        "0.8125rem",
            borderBottom:    "1px solid var(--color-border)",
          }}
        >
          {errMsg}
        </div>
      )}

      {/* Body */}
      <div style={{ padding: "1rem 1.5rem" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem" }}>
            <Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: "var(--color-primary)" }} />
          </div>
        ) : links.length === 0 ? (
          <p style={{ fontSize: "0.8375rem", color: "var(--color-text-muted)", margin: 0, textAlign: "center", padding: "1rem 0" }}>
            Δεν υπάρχουν σύνδεσμοι ακόμα. Δημιούργησε τον πρώτο!
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {links.map(link => {
              const url      = `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${link.code}`;
              const isCopied = copiedId === link.id;
              const isDeleting = deleteId === link.id;
              const usageColor = link.used_count >= link.max_uses ? "#E74C3C" : "#27AE60";

              return (
                <div
                  key={link.id}
                  style={{
                    display:         "flex",
                    alignItems:      "center",
                    gap:             "0.75rem",
                    padding:         "0.625rem 0.875rem",
                    backgroundColor: "var(--color-bg-light)",
                    borderRadius:    "10px",
                    border:          "1px solid var(--color-border)",
                    flexWrap:        "wrap",
                  }}
                >
                  {/* Code + URL (truncated) */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin:       0,
                        fontSize:     "0.8125rem",
                        fontWeight:   600,
                        color:        "var(--color-text)",
                        overflow:     "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace:   "nowrap",
                        fontFamily:   "monospace",
                      }}
                    >
                      /invite/{link.code}
                    </p>
                    <p
                      style={{
                        margin:    "0.1rem 0 0",
                        fontSize:  "0.75rem",
                        color:     "var(--color-text-muted)",
                      }}
                    >
                      {new Date(link.created_at).toLocaleDateString("el-GR")}
                      {" · "}
                      <span style={{ color: usageColor, fontWeight: 600 }}>
                        {link.used_count}/{link.max_uses} χρήσεις
                      </span>
                    </p>
                  </div>

                  {/* Copy button */}
                  <button
                    type="button"
                    onClick={() => handleCopy(link.code, link.id)}
                    aria-label="Αντιγραφή συνδέσμου"
                    style={{
                      display:         "inline-flex",
                      alignItems:      "center",
                      gap:             "0.25rem",
                      padding:         "0.35rem 0.625rem",
                      backgroundColor: isCopied ? "rgba(39,174,96,0.1)" : "#fff",
                      border:          `1px solid ${isCopied ? "rgba(39,174,96,0.4)" : "var(--color-border)"}`,
                      borderRadius:    "6px",
                      cursor:          "pointer",
                      fontSize:        "0.75rem",
                      fontWeight:      600,
                      fontFamily:      "inherit",
                      color:           isCopied ? "#15803D" : "var(--color-text)",
                      transition:      "all 0.15s",
                      flexShrink:      0,
                    }}
                  >
                    {isCopied ? <Check size={12} /> : <Copy size={12} />}
                    {isCopied ? "Αντιγράφηκε!" : "Αντιγραφή"}
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(link.id)}
                    disabled={isDeleting}
                    aria-label="Διαγραφή συνδέσμου"
                    style={{
                      display:         "flex",
                      alignItems:      "center",
                      padding:         "0.35rem",
                      backgroundColor: "transparent",
                      border:          "1px solid var(--color-border)",
                      borderRadius:    "6px",
                      cursor:          isDeleting ? "not-allowed" : "pointer",
                      color:           "var(--color-text-muted)",
                      flexShrink:      0,
                    }}
                  >
                    {isDeleting
                      ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                      : <Trash2 size={13} />
                    }
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Limit badge */}
        {links.length > 0 && (
          <p
            style={{
              marginTop:  "0.875rem",
              fontSize:   "0.75rem",
              color:      "var(--color-text-muted)",
              textAlign:  "right",
            }}
          >
            {links.length}/30 σύνδεσμοι
          </p>
        )}
      </div>
    </div>
  );
}
