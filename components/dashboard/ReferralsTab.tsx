// =============================================================
// components/dashboard/ReferralsTab.tsx
// =============================================================
// Professional dashboard tab: referral program.
//
// Shows:
//   - The professional's unique shareable referral link
//     (trustia.gr/register/professional?ref={proSlug})
//   - Copy-to-clipboard button
//   - Stats strip: total referrals, active (subscription verified), rewards earned
//   - Table of referred professionals with their status
//
// CLIENT COMPONENT — reads referral rows via Supabase client.
// =============================================================

"use client";

import React, { useState, useEffect } from "react";
import { createClient }  from "@/lib/supabase/client";
import { Copy, Check, Users, Gift, TrendingUp } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────
interface ReferralRow {
  id:           string;
  status:       "pending" | "active" | "expired" | "rewarded";
  reward_amount: number | null;
  created_at:   string;
  referred: {
    first_name: string;
    last_name:  string;
    category_id: string;
    status:     string;
  } | null;
}

interface ReferralsTabProps {
  proId:   string;
  proSlug: string | null;
}

// ── Status badge ───────────────────────────────────────────────
const STATUS: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: "#FEF3C7", color: "#D97706", label: "Εκκρεμεί"    },
  active:   { bg: "#D1FAE5", color: "#059669", label: "Ενεργός"     },
  expired:  { bg: "#F3F4F6", color: "#6B7280", label: "Έληξε"       },
  rewarded: { bg: "#EDE9FE", color: "#7C3AED", label: "Αμείφθηκε"   },
};

// ── Component ──────────────────────────────────────────────────
export default function ReferralsTab({ proId, proSlug }: ReferralsTabProps) {
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [copied, setCopied]       = useState(false);

  const supabase = createClient();

  // Build the referral link from the professional's slug
  const origin      = typeof window !== "undefined" ? window.location.origin : "https://trustia.gr";
  const referralUrl = proSlug
    ? `${origin}/register/professional?ref=${proSlug}`
    : null;

  // ── Fetch referrals ────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data } = await supabase
        .from("referrals")
        .select(`
          id, status, reward_amount, created_at,
          referred:referred_id (
            first_name, last_name, category_id, status
          )
        `)
        .eq("referrer_id", proId)
        .order("created_at", { ascending: false });

      setReferrals((data as ReferralRow[] | null) ?? []);
      setLoading(false);
    }

    load();
  }, [proId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Copy link ──────────────────────────────────────────────
  async function handleCopy() {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text in input
    }
  }

  // ── Derived stats ──────────────────────────────────────────
  const total   = referrals.length;
  const active  = referrals.filter((r) => r.status === "active" || r.status === "rewarded").length;
  const rewards = referrals
    .filter((r) => r.reward_amount != null)
    .reduce((sum, r) => sum + (r.reward_amount ?? 0), 0);

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Referral link card ── */}
      <div
        style={{
          backgroundColor: "var(--color-primary)",
          borderRadius:    "16px",
          padding:         "1.75rem",
          color:           "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.625rem" }}>
          <Gift size={20} />
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: "1.0625rem" }}>
            Πρόγραμμα Παραπομπών
          </h3>
        </div>
        <p style={{ margin: "0 0 1.25rem", fontSize: "0.9rem", opacity: 0.88, lineHeight: 1.6 }}>
          Κάλεσε έναν επαγγελματία να εγγραφεί στο Trustia.gr χρησιμοποιώντας τον προσωπικό σου σύνδεσμο.
          Κερδίζεις ανταμοιβή όταν ο λογαριασμός του ενεργοποιηθεί.
        </p>

        {referralUrl ? (
          <div style={{ display: "flex", gap: "0.625rem", alignItems: "stretch" }}>
            <input
              readOnly
              value={referralUrl}
              style={{
                flex:         1,
                padding:      "0.6rem 0.875rem",
                borderRadius: "8px",
                border:       "none",
                fontSize:     "0.8375rem",
                fontFamily:   "inherit",
                color:        "var(--color-text)",
                backgroundColor: "#fff",
                outline:      "none",
                minWidth:     0,
              }}
            />
            <button
              type="button"
              onClick={handleCopy}
              style={{
                display:         "flex",
                alignItems:      "center",
                gap:             "0.4rem",
                padding:         "0.6rem 1rem",
                backgroundColor: copied ? "#D1FAE5" : "#fff",
                color:           copied ? "#059669" : "var(--color-primary)",
                border:          "none",
                borderRadius:    "8px",
                fontFamily:      "inherit",
                fontSize:        "0.875rem",
                fontWeight:      700,
                cursor:          "pointer",
                flexShrink:      0,
                transition:      "background-color 0.15s, color 0.15s",
              }}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Αντιγράφηκε!" : "Αντιγραφή"}
            </button>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: "0.875rem", opacity: 0.8 }}>
            Ολοκλήρωσε το προφίλ σου για να αποκτήσεις σύνδεσμο παραπομπής.
          </p>
        )}
      </div>

      {/* ── Stats strip ── */}
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap:                 "0.875rem",
        }}
      >
        {[
          {
            icon:  <Users size={18} style={{ color: "var(--color-primary)" }} />,
            value: total,
            label: "Συνολικές Παραπομπές",
          },
          {
            icon:  <TrendingUp size={18} style={{ color: "#059669" }} />,
            value: active,
            label: "Ενεργοί Επαγγελματίες",
          },
          {
            icon:  <Gift size={18} style={{ color: "var(--color-accent)" }} />,
            value: rewards > 0 ? `€${rewards.toFixed(2)}` : "€0",
            label: "Ανταμοιβές",
          },
        ].map(({ icon, value, label }) => (
          <div
            key={label}
            style={{
              backgroundColor: "#fff",
              border:          "1.5px solid var(--color-border)",
              borderRadius:    "12px",
              padding:         "1.125rem 1.25rem",
            }}
          >
            <div style={{ marginBottom: "0.5rem" }}>{icon}</div>
            <p style={{ margin: "0 0 0.2rem", fontWeight: 800, fontSize: "1.625rem", color: "var(--color-text)", lineHeight: 1 }}>
              {value}
            </p>
            <p style={{ margin: 0, fontSize: "0.775rem", color: "var(--color-text-muted)" }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Referrals list ── */}
      <div>
        <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text)", margin: "0 0 0.875rem" }}>
          Οι Παραπομπές μου
        </h3>

        {loading ? (
          <div
            style={{
              backgroundColor: "#fff",
              border:          "1.5px solid var(--color-border)",
              borderRadius:    "14px",
              padding:         "2.5rem",
              textAlign:       "center",
              color:           "var(--color-text-muted)",
              fontSize:        "0.9rem",
            }}
          >
            Φόρτωση…
          </div>
        ) : referrals.length === 0 ? (
          <div
            style={{
              backgroundColor: "#fff",
              border:          "1.5px dashed var(--color-border)",
              borderRadius:    "14px",
              padding:         "2.5rem",
              textAlign:       "center",
            }}
          >
            <Users size={32} style={{ margin: "0 auto 0.75rem", color: "var(--color-text-muted)", opacity: 0.4 }} />
            <p style={{ fontWeight: 700, color: "var(--color-text)", margin: "0 0 0.3rem", fontSize: "0.9375rem" }}>
              Δεν υπάρχουν παραπομπές ακόμα
            </p>
            <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.875rem" }}>
              Μοιράσου τον σύνδεσμό σου και αρχίζεις να κερδίζεις!
            </p>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: "#fff",
              border:          "1.5px solid var(--color-border)",
              borderRadius:    "14px",
              overflow:        "hidden",
            }}
          >
            {referrals.map((ref, idx) => {
              const badge   = STATUS[ref.status] ?? STATUS.pending;
              const isLast  = idx === referrals.length - 1;
              const refName = ref.referred
                ? `${ref.referred.first_name} ${ref.referred.last_name}`
                : "—";

              return (
                <div
                  key={ref.id}
                  style={{
                    display:      "flex",
                    alignItems:   "center",
                    gap:          "1rem",
                    padding:      "0.875rem 1.25rem",
                    borderBottom: isLast ? "none" : "1px solid var(--color-border)",
                    flexWrap:     "wrap",
                  }}
                >
                  {/* Avatar placeholder */}
                  <div
                    style={{
                      width:           "36px",
                      height:          "36px",
                      borderRadius:    "50%",
                      backgroundColor: "var(--color-primary-bg)",
                      display:         "flex",
                      alignItems:      "center",
                      justifyContent:  "center",
                      fontWeight:      800,
                      fontSize:        "0.8rem",
                      color:           "var(--color-primary)",
                      flexShrink:      0,
                    }}
                  >
                    {ref.referred
                      ? `${ref.referred.first_name[0]}${ref.referred.last_name[0]}`.toUpperCase()
                      : "?"}
                  </div>

                  {/* Name + date */}
                  <div style={{ flex: 1, minWidth: "120px" }}>
                    <p style={{ margin: "0 0 0.1rem", fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text)" }}>
                      {refName}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      {new Date(ref.created_at).toLocaleDateString("el-GR")}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span
                    style={{
                      padding:         "0.2rem 0.6rem",
                      borderRadius:    "99px",
                      fontSize:        "0.725rem",
                      fontWeight:      700,
                      backgroundColor: badge.bg,
                      color:           badge.color,
                      whiteSpace:      "nowrap",
                    }}
                  >
                    {badge.label}
                  </span>

                  {/* Reward amount */}
                  {ref.reward_amount != null && (
                    <span
                      style={{
                        fontSize:   "0.8375rem",
                        fontWeight: 700,
                        color:      "#7C3AED",
                        whiteSpace: "nowrap",
                      }}
                    >
                      +€{ref.reward_amount.toFixed(2)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── How it works ── */}
      <div
        style={{
          backgroundColor: "#fff",
          border:          "1.5px solid var(--color-border)",
          borderRadius:    "14px",
          padding:         "1.25rem 1.5rem",
        }}
      >
        <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text)", margin: "0 0 0.875rem" }}>
          Πώς λειτουργεί
        </h3>
        <ol
          style={{
            margin:     0,
            padding:    "0 0 0 1.25rem",
            fontSize:   "0.875rem",
            color:      "var(--color-text-muted)",
            lineHeight: 1.75,
          }}
        >
          <li>Αντίγραψε τον προσωπικό σου σύνδεσμο παραπομπής από πάνω.</li>
          <li>Στείλε τον σε επαγγελματίες που γνωρίζεις.</li>
          <li>Όταν εγγραφούν μέσω του συνδέσμου σου, καταχωρείται η παραπομπή.</li>
          <li>Μόλις ο λογαριασμός τους ενεργοποιηθεί, κερδίζεις ανταμοιβή.</li>
        </ol>
      </div>

    </div>
  );
}
