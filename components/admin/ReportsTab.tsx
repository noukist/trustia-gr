// =============================================================
// components/admin/ReportsTab.tsx
// =============================================================
// Admin tab: lists professional reports (flagged by users).
// Admin can mark each report as reviewed, resolved, or dismissed.
//
// CLIENT COMPONENT — uses Supabase client for mutations so the
// list updates optimistically without a full page reload.
// =============================================================

"use client";

import React, { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Flag, ExternalLink, CheckCircle, XCircle, Eye } from "lucide-react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────
interface Report {
  id:          string;
  reason:      string;
  details:     string | null;
  status:      "pending" | "reviewed" | "resolved" | "dismissed";
  created_at:  string;
  target_id:   string;
  reporter_id: string | null;
  // joined
  professional_name: string | null;
  professional_slug: string | null;
}

interface ReportsTabProps {
  reports: Report[];
}

// ── Reason labels ──────────────────────────────────────────────
const REASON_LABELS: Record<string, string> = {
  fake_info:     "Ψεύτικες πληροφορίες",
  inappropriate: "Ακατάλληλο περιεχόμενο",
  scam:          "Απάτη / Scam",
  spam:          "Spam",
  other:         "Άλλο",
};

// ── Status badge styles ────────────────────────────────────────
const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: "#FEF3C7", color: "#D97706", label: "Εκκρεμεί"     },
  reviewed:  { bg: "#DBEAFE", color: "#1D4ED8", label: "Ελέγχθηκε"   },
  resolved:  { bg: "#D1FAE5", color: "#059669", label: "Επιλύθηκε"   },
  dismissed: { bg: "#F3F4F6", color: "#6B7280", label: "Απορρίφθηκε" },
};

// ── Component ──────────────────────────────────────────────────
export default function ReportsTab({ reports: initial }: ReportsTabProps) {
  const [reports, setReports]   = useState<Report[]>(initial);
  const [filter, setFilter]     = useState<"all" | "pending">("pending");
  const [isPending, startTrans] = useTransition();

  const supabase = createClient();

  // Update a report's status optimistically
  async function updateStatus(id: string, status: Report["status"]) {
    // Optimistic update
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );

    startTrans(async () => {
      const { error } = await supabase
        .from("reports")
        .update({ status })
        .eq("id", id);

      if (error) {
        console.error("[ReportsTab] update error:", error.message);
        // Revert on failure — re-fetch would be cleaner but this is fine for now
      }
    });
  }

  const visible = filter === "pending"
    ? reports.filter((r) => r.status === "pending")
    : reports;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text)", margin: "0 0 0.25rem" }}>
            Αναφορές Χρηστών
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", margin: 0 }}>
            {reports.filter((r) => r.status === "pending").length} εκκρεμείς αναφορές
          </p>
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["pending", "all"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              style={{
                padding:         "0.375rem 1rem",
                borderRadius:    "99px",
                fontSize:        "0.85rem",
                fontWeight:      600,
                cursor:          "pointer",
                fontFamily:      "inherit",
                backgroundColor: filter === f ? "var(--color-primary)" : "#fff",
                color:           filter === f ? "#fff" : "var(--color-text)",
                border:          `1.5px solid ${filter === f ? "var(--color-primary)" : "var(--color-border)"}`,
              }}
            >
              {f === "pending" ? "Εκκρεμείς" : "Όλες"}
            </button>
          ))}
        </div>
      </div>

      {/* Reports list */}
      {visible.length === 0 ? (
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
          <Flag size={32} style={{ margin: "0 auto 0.75rem", opacity: 0.35 }} />
          <p style={{ margin: 0, fontWeight: 600 }}>Δεν υπάρχουν αναφορές</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {visible.map((report) => {
            const badge = STATUS_BADGE[report.status] ?? STATUS_BADGE.pending;
            return (
              <div
                key={report.id}
                style={{
                  backgroundColor: "#fff",
                  border:          "1.5px solid var(--color-border)",
                  borderRadius:    "14px",
                  padding:         "1.25rem 1.5rem",
                  display:         "flex",
                  gap:             "1rem",
                  alignItems:      "flex-start",
                  flexWrap:        "wrap",
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width:           "38px",
                    height:          "38px",
                    borderRadius:    "10px",
                    backgroundColor: "#FEF2F2",
                    display:         "flex",
                    alignItems:      "center",
                    justifyContent:  "center",
                    flexShrink:      0,
                  }}
                >
                  <Flag size={18} style={{ color: "#DC2626" }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap", marginBottom: "0.375rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--color-text)" }}>
                      {REASON_LABELS[report.reason] ?? report.reason}
                    </span>
                    <span
                      style={{
                        padding:         "0.175rem 0.5rem",
                        borderRadius:    "99px",
                        fontSize:        "0.725rem",
                        fontWeight:      700,
                        backgroundColor: badge.bg,
                        color:           badge.color,
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Professional link */}
                  {report.professional_name && (
                    <p style={{ margin: "0 0 0.25rem", fontSize: "0.8375rem", color: "var(--color-text-muted)" }}>
                      Επαγγελματίας:{" "}
                      {report.professional_slug ? (
                        <Link
                          href={`/professional/${report.professional_slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}
                        >
                          {report.professional_name} <ExternalLink size={11} style={{ display: "inline", verticalAlign: "middle" }} />
                        </Link>
                      ) : (
                        <span style={{ fontWeight: 600 }}>{report.professional_name}</span>
                      )}
                    </p>
                  )}

                  {/* Details */}
                  {report.details && (
                    <p
                      style={{
                        margin:          "0.375rem 0 0",
                        fontSize:        "0.8375rem",
                        color:           "var(--color-text-muted)",
                        backgroundColor: "var(--color-bg-light)",
                        borderRadius:    "8px",
                        padding:         "0.5rem 0.75rem",
                        fontStyle:       "italic",
                      }}
                    >
                      {report.details}
                    </p>
                  )}

                  <p style={{ margin: "0.375rem 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {new Date(report.created_at).toLocaleString("el-GR")}
                  </p>
                </div>

                {/* Actions */}
                {report.status === "pending" && (
                  <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => updateStatus(report.id, "reviewed")}
                      disabled={isPending}
                      title="Επισήμανση ως ελεγχθέν"
                      style={{
                        display:         "flex",
                        alignItems:      "center",
                        gap:             "0.35rem",
                        padding:         "0.375rem 0.75rem",
                        border:          "1.5px solid #1D4ED8",
                        borderRadius:    "8px",
                        backgroundColor: "transparent",
                        color:           "#1D4ED8",
                        fontSize:        "0.8rem",
                        fontWeight:      700,
                        fontFamily:      "inherit",
                        cursor:          "pointer",
                      }}
                    >
                      <Eye size={14} />
                      Έλεγχος
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(report.id, "resolved")}
                      disabled={isPending}
                      title="Επίλυση"
                      style={{
                        display:         "flex",
                        alignItems:      "center",
                        gap:             "0.35rem",
                        padding:         "0.375rem 0.75rem",
                        border:          "1.5px solid #059669",
                        borderRadius:    "8px",
                        backgroundColor: "transparent",
                        color:           "#059669",
                        fontSize:        "0.8rem",
                        fontWeight:      700,
                        fontFamily:      "inherit",
                        cursor:          "pointer",
                      }}
                    >
                      <CheckCircle size={14} />
                      Επίλυση
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(report.id, "dismissed")}
                      disabled={isPending}
                      title="Απόρριψη"
                      style={{
                        display:         "flex",
                        alignItems:      "center",
                        gap:             "0.35rem",
                        padding:         "0.375rem 0.75rem",
                        border:          "1.5px solid var(--color-border)",
                        borderRadius:    "8px",
                        backgroundColor: "transparent",
                        color:           "var(--color-text-muted)",
                        fontSize:        "0.8rem",
                        fontWeight:      700,
                        fontFamily:      "inherit",
                        cursor:          "pointer",
                      }}
                    >
                      <XCircle size={14} />
                      Απόρριψη
                    </button>
                  </div>
                )}

                {/* Already-actioned: show change status dropdown alternative */}
                {report.status !== "pending" && (
                  <button
                    type="button"
                    onClick={() => updateStatus(report.id, "pending")}
                    style={{
                      padding:         "0.375rem 0.75rem",
                      border:          "1.5px solid var(--color-border)",
                      borderRadius:    "8px",
                      backgroundColor: "transparent",
                      color:           "var(--color-text-muted)",
                      fontSize:        "0.775rem",
                      fontWeight:      600,
                      fontFamily:      "inherit",
                      cursor:          "pointer",
                      flexShrink:      0,
                    }}
                  >
                    Επαναφορά
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
