// =============================================================
// app/register/professional/page.tsx
// =============================================================
// Multi-step professional registration wizard for Trustia.gr.
// PRD Sections 4.4, 5, 49, 50.
//
// STEPS
//   1. Category     — "Τι δουλειά κάνεις;"
//   2. Booking Mode — "Πώς θέλεις να δέχεσαι κρατήσεις;"
//   3. Plan         — 3/6/12-month plan selection + trial banner
//   4. Profile      — name, phone, email, city, bio, price text
//   5. Terms        — GDPR checkboxes + submit
//
// DB flow on submit:
//   a) Verify auth.users session
//   b) INSERT INTO professionals (profile basics)
//   c) INSERT INTO subscriptions (trial, payment_reference = ''
//      triggers DB function generate_payment_reference())
//   d) Redirect to /dashboard?welcome=1
//
// "Other" category: skips DB inserts, shows a thank-you card
// (admin is notified separately — PRD §4.5).
// =============================================================

"use client";

import React, { useState, useEffect } from "react";
import { useRouter }        from "@/i18n/navigation";
import { useSearchParams }  from "next/navigation";
import {
  ChevronRight, ChevronLeft,
  Check, Phone, CalendarDays, CalendarRange,
  Star, Lock, Sparkles,
} from "lucide-react";

import { createClient }            from "@/lib/supabase/client";
import { CATEGORIES, PLAN_OPTIONS } from "@/lib/constants";
import Button                      from "@/components/ui/Button";
import Input                       from "@/components/ui/Input";
import LocationAutocomplete, {
  type LocationResult,
}                                  from "@/components/ui/LocationAutocomplete";

// ── Types ──────────────────────────────────────────────────────

type Tier        = "light" | "trades" | "specialists";
type BookingMode = "contact" | "date" | "full";
type PlanId      = "monthly" | "semi" | "annual";

interface WizardData {
  // Step 1
  categoryId:    string;   // "" | CATEGORIES[n].id | "other"
  categoryOther: string;   // description when categoryId === "other"
  // Step 2
  bookingMode:   BookingMode;
  // Step 3
  billingPlan:   PlanId;
  // Step 4
  firstName:     string;
  lastName:      string;
  phone:         string;
  email:         string;
  city:          string;   // displayName from LocationAutocomplete
  bio:           string;
  priceText:     string;
  // Step 5
  termsAccepted:    boolean;
  marketingConsent: boolean;
}

const INITIAL_DATA: WizardData = {
  categoryId:       "",
  categoryOther:    "",
  bookingMode:      "contact",   // default per spec
  billingPlan:      "annual",    // default: 12-month, pre-selected per spec
  firstName:        "",
  lastName:         "",
  phone:            "",
  email:            "",
  city:             "",
  bio:              "",
  priceText:        "",
  termsAccepted:    false,
  marketingConsent: false,
};

const TOTAL_STEPS = 5;

// ── Category tier metadata ─────────────────────────────────────
const TIER_META: Record<Tier, { labelEl: string }> = {
  light:       { labelEl: "Ελαφριές Υπηρεσίες" },
  trades:      { labelEl: "Τεχνικά & Ομορφιά" },
  specialists: { labelEl: "Ειδικοί" },
};

// ── Booking mode options ───────────────────────────────────────
const BOOKING_MODES: {
  id: BookingMode; emoji: string; title: string; desc: string; note?: string;
}[] = [
  {
    id:    "contact",
    emoji: "📞",
    title: "Μόνο Τηλέφωνο",
    desc:  "Οι πελάτες βλέπουν τα στοιχεία σας και σας καλούν.",
  },
  {
    id:    "date",
    emoji: "📅",
    title: "Κράτηση Ημερομηνίας",
    desc:  "Οι πελάτες επιλέγουν ημερομηνία, εσείς επιβεβαιώνετε.",
  },
  {
    id:    "full",
    emoji: "🗓️",
    title: "Πλήρες Ημερολόγιο",
    desc:  "Κατάλογος υπηρεσιών, τιμές, ωράριο.",
    note:  "Απαιτεί Επιχειρηματική Σελίδα",
  },
];

// ── Step titles for the progress indicator ─────────────────────
const STEP_LABELS = ["Κατηγορία", "Κράτηση", "Πλάνο", "Προφίλ", "Όροι"];

// ── Format price helper ────────────────────────────────────────
function fmt(n: number) {
  return Number.isInteger(n) ? `€${n}` : `€${n.toFixed(2)}`;
}

// =============================================================
// STEP 1 — Category Selection
// =============================================================
function Step1({
  data,
  onChange,
}: {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
}) {
  // Categories pre-split by tier so the render stays clean
  const byTier = (tier: Tier) => CATEGORIES.filter((c) => c.tier === tier);
  const [showOther, setShowOther] = useState(data.categoryId === "other");

  function selectCategory(id: string) {
    if (id === "other") {
      setShowOther(true);
      onChange({ categoryId: "other", categoryOther: data.categoryOther });
    } else {
      setShowOther(false);
      onChange({ categoryId: id, categoryOther: "" });
    }
  }

  return (
    <div>
      <h2 style={styles.stepTitle}>Τι δουλειά κάνεις;</h2>
      <p style={styles.stepSubtitle}>
        Επίλεξε την κύρια κατηγορία υπηρεσιών σου.
      </p>

      {/* Three tier sections */}
      {(["light", "trades", "specialists"] as Tier[]).map((tier) => (
        <div key={tier} style={{ marginBottom: "1.5rem" }}>
          <p style={styles.tierLabel}>{TIER_META[tier].labelEl}</p>

          {/* Responsive grid: 3 cols desktop, 2 cols mobile */}
          <div style={styles.categoryGrid}>
            {byTier(tier).map((cat) => {
              const isSelected = data.categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => selectCategory(cat.id)}
                  style={{
                    ...styles.categoryCard,
                    backgroundColor: isSelected
                      ? "var(--color-primary)"
                      : "#fff",
                    borderColor: isSelected
                      ? "var(--color-primary)"
                      : "var(--color-border)",
                    color: isSelected ? "#fff" : "var(--color-text)",
                  }}
                >
                  <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>
                    {cat.emoji}
                  </span>
                  <span
                    style={{
                      fontSize:   "0.8rem",
                      fontWeight: 500,
                      lineHeight: 1.3,
                      textAlign:  "center",
                    }}
                  >
                    {cat.nameEl}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* "Other" option */}
      <button
        type="button"
        onClick={() => selectCategory("other")}
        style={{
          ...styles.categoryCard,
          width:           "100%",
          flexDirection:   "row",
          justifyContent:  "center",
          gap:             "0.5rem",
          backgroundColor: data.categoryId === "other" ? "var(--color-primary-bg)" : "#fff",
          borderColor:     data.categoryId === "other" ? "var(--color-primary)" : "var(--color-border)",
          color:           data.categoryId === "other" ? "var(--color-primary)" : "var(--color-text-muted)",
          fontWeight:      500,
          fontSize:        "0.9rem",
        }}
      >
        ❓ Δεν βρίσκω την κατηγορία μου
      </button>

      {showOther && (
        <div style={{ marginTop: "0.875rem" }}>
          <textarea
            placeholder="Περίγραψε σύντομα τι δουλειά κάνεις (π.χ. «Τεχνικός κλιματιστικών ειδικευμένος σε ηλιακά»)…"
            value={data.categoryOther}
            onChange={(e) =>
              onChange({ categoryOther: e.target.value })
            }
            rows={3}
            style={styles.textarea}
          />
          <p
            style={{
              fontSize: "0.8125rem",
              color:    "var(--color-text-muted)",
              margin:   "0.375rem 0 0",
            }}
          >
            Θα αξιολογήσουμε το αίτημά σου εντός 48 ωρών και θα σε ειδοποιήσουμε.
          </p>
        </div>
      )}
    </div>
  );
}

// =============================================================
// STEP 2 — Booking Mode
// =============================================================
function Step2({
  data,
  onChange,
}: {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
}) {
  return (
    <div>
      <h2 style={styles.stepTitle}>Πώς θέλεις να δέχεσαι κρατήσεις;</h2>
      <p style={styles.stepSubtitle}>
        Μπορείς να το αλλάξεις ανά πάσα στιγμή από τον πίνακα ελέγχου.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {BOOKING_MODES.map((mode) => {
          const isSelected = data.bookingMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onChange({ bookingMode: mode.id })}
              style={{
                display:         "flex",
                alignItems:      "flex-start",
                gap:             "1rem",
                padding:         "1rem 1.125rem",
                border:          `2px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
                borderRadius:    "12px",
                backgroundColor: isSelected ? "var(--color-primary-bg)" : "#fff",
                cursor:          "pointer",
                textAlign:       "left",
                width:           "100%",
                transition:      "border-color 0.15s, background-color 0.15s",
              }}
            >
              {/* Selection indicator */}
              <span
                style={{
                  width:           "20px",
                  height:          "20px",
                  borderRadius:    "50%",
                  border:          `2px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
                  backgroundColor: isSelected ? "var(--color-primary)" : "transparent",
                  flexShrink:      0,
                  display:         "flex",
                  alignItems:      "center",
                  justifyContent:  "center",
                  marginTop:       "1px",
                }}
              >
                {isSelected && <Check size={11} color="#fff" strokeWidth={3} />}
              </span>

              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin:     0,
                    fontWeight: 700,
                    fontSize:   "0.9375rem",
                    color:      "var(--color-text)",
                  }}
                >
                  {mode.emoji} {mode.title}
                </p>
                <p
                  style={{
                    margin:   "0.25rem 0 0",
                    fontSize: "0.875rem",
                    color:    "var(--color-text-muted)",
                  }}
                >
                  {mode.desc}
                </p>
                {mode.note && (
                  <p
                    style={{
                      margin:          "0.375rem 0 0",
                      fontSize:        "0.775rem",
                      color:           "var(--color-accent-dark)",
                      backgroundColor: "var(--color-accent-bg)",
                      display:         "inline-block",
                      padding:         "0.15rem 0.5rem",
                      borderRadius:    "6px",
                      fontWeight:      500,
                    }}
                  >
                    {mode.note}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================
// STEP 3 — Pricing & Plan Selection
// =============================================================
function Step3({
  data,
  tier,
  onChange,
}: {
  data:     WizardData;
  tier:     Tier;
  onChange: (d: Partial<WizardData>) => void;
}) {
  return (
    <div>
      <h2 style={styles.stepTitle}>Επίλεξε πλάνο συνδρομής</h2>

      {/* Tier badge */}
      <p style={{ margin: "0 0 1rem", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
        Κατηγορία σου:{" "}
        <strong style={{ color: "var(--color-primary)" }}>
          {TIER_META[tier].labelEl}
        </strong>
        {" · "}
        <span
          style={{
            backgroundColor: "var(--color-accent-bg)",
            color:           "var(--color-accent-dark)",
            padding:         "0.1rem 0.5rem",
            borderRadius:    "6px",
            fontSize:        "0.8rem",
            fontWeight:      600,
          }}
        >
          Τιμή Γνωριμίας ★
        </span>
      </p>

      {/* Free trial banner */}
      <div
        style={{
          background:    "linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))",
          borderRadius:  "12px",
          padding:       "1rem 1.25rem",
          marginBottom:  "1.5rem",
          color:         "#fff",
          display:       "flex",
          alignItems:    "center",
          gap:           "0.75rem",
        }}
      >
        <Sparkles size={22} style={{ flexShrink: 0 }} />
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9375rem" }}>
            3 μήνες ΔΩΡΕΑΝ — Ξεκινήστε χωρίς πληρωμή!
          </p>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", opacity: 0.85 }}>
            Επιλέξτε το πλάνο που θέλετε μετά τη δωρεάν περίοδο.
          </p>
        </div>
      </div>

      {/* Plan cards — horizontal scroll on mobile */}
      <div style={styles.planGrid}>
        {PLAN_OPTIONS.map((plan) => {
          const isSelected  = data.billingPlan === plan.id;
          const isAnnual    = plan.id === "annual";
          const total       = plan.total[tier];
          const perMo       = plan.perMonth[tier];

          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onChange({ billingPlan: plan.id })}
              style={{
                position:        "relative",
                display:         "flex",
                flexDirection:   "column",
                alignItems:      "center",
                textAlign:       "center",
                gap:             "0.5rem",
                padding:         isAnnual ? "1.5rem 1rem 1.25rem" : "1.25rem 1rem",
                border:          `2px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
                borderRadius:    "14px",
                backgroundColor: isSelected
                  ? "var(--color-primary-bg)"
                  : isAnnual
                    ? "#FAFFFE"
                    : "#fff",
                cursor:          "pointer",
                flex:            "1 1 0",
                minWidth:        "120px",
                transition:      "border-color 0.15s, background-color 0.15s",
                boxShadow:       isSelected ? "0 0 0 3px var(--color-primary-bg)" : "none",
              }}
            >
              {/* "Δημοφιλέστερο" ribbon for annual */}
              {isAnnual && (
                <span
                  style={{
                    position:        "absolute",
                    top:             "-1px",
                    left:            "50%",
                    transform:       "translateX(-50%)",
                    backgroundColor: "var(--color-accent)",
                    color:           "#1a1a1a",
                    fontSize:        "0.7rem",
                    fontWeight:      700,
                    padding:         "0.2rem 0.7rem",
                    borderRadius:    "0 0 8px 8px",
                    whiteSpace:      "nowrap",
                  }}
                >
                  Δημοφιλέστερο
                </span>
              )}

              {/* Duration */}
              <p
                style={{
                  margin:     0,
                  fontWeight: 700,
                  fontSize:   "1rem",
                  color:      isSelected ? "var(--color-primary)" : "var(--color-text)",
                  marginTop:  isAnnual ? "0.5rem" : 0,
                }}
              >
                {plan.labelEl}
              </p>

              {/* Total price */}
              <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text)" }}>
                {fmt(total)}
              </p>

              {/* Per-month equivalent */}
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                {fmt(perMo)} / μήνα
              </p>

              {/* Lock badge for annual */}
              {isAnnual && (
                <span
                  style={{
                    display:         "inline-flex",
                    alignItems:      "center",
                    gap:             "0.25rem",
                    backgroundColor: "var(--color-primary-bg)",
                    color:           "var(--color-primary-dark)",
                    fontSize:        "0.7rem",
                    fontWeight:      600,
                    padding:         "0.2rem 0.5rem",
                    borderRadius:    "6px",
                    marginTop:       "0.25rem",
                  }}
                >
                  <Lock size={10} />
                  Κλείδωμα Τιμής Γνωριμίας
                </span>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <span
                  style={{
                    position:        "absolute",
                    top:             "0.5rem",
                    right:           "0.5rem",
                    width:           "20px",
                    height:          "20px",
                    borderRadius:    "50%",
                    backgroundColor: "var(--color-primary)",
                    display:         "flex",
                    alignItems:      "center",
                    justifyContent:  "center",
                  }}
                >
                  <Check size={11} color="#fff" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Founding note */}
      <p
        style={{
          marginTop: "1rem",
          fontSize:  "0.8125rem",
          color:     "var(--color-text-muted)",
          textAlign: "center",
        }}
      >
        <Star size={12} style={{ verticalAlign: "middle", marginRight: "4px", color: "var(--color-accent)" }} />
        Οι πρώτοι 50 επαγγελματίες κλειδώνουν αυτή την τιμή για πάντα
      </p>
    </div>
  );
}

// =============================================================
// STEP 4 — Profile Details
// =============================================================
function Step4({
  data,
  onChange,
}: {
  data:     WizardData;
  onChange: (d: Partial<WizardData>) => void;
}) {
  const BIO_MAX = 500;

  function handleLocationSelect(loc: LocationResult) {
    onChange({ city: loc.displayName });
  }

  return (
    <div>
      <h2 style={styles.stepTitle}>Στοιχεία προφίλ</h2>
      <p style={styles.stepSubtitle}>
        Αυτά θα εμφανίζονται στο προφίλ σου για τους πελάτες.
      </p>

      {/* Name row */}
      <div style={styles.fieldRow}>
        <Input
          label="Όνομα *"
          placeholder="Νίκος"
          value={data.firstName}
          onChange={(e) => onChange({ firstName: e.target.value })}
          autoComplete="given-name"
        />
        <Input
          label="Επώνυμο *"
          placeholder="Παπαδόπουλος"
          value={data.lastName}
          onChange={(e) => onChange({ lastName: e.target.value })}
          autoComplete="family-name"
        />
      </div>

      {/* Phone + Email */}
      <div style={{ ...styles.fieldRow, marginTop: "0.875rem" }}>
        <Input
          label="Τηλέφωνο *"
          placeholder="69XXXXXXXX"
          type="tel"
          value={data.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          autoComplete="tel"
          inputMode="tel"
        />
        <Input
          label="Email *"
          placeholder="nikos@example.com"
          type="email"
          value={data.email}
          onChange={(e) => onChange({ email: e.target.value })}
          autoComplete="email"
        />
      </div>

      {/* City — LocationAutocomplete */}
      <div style={{ marginTop: "0.875rem" }}>
        <label className="ui-field-label">Πόλη / Περιοχή *</label>
        <div style={{ marginTop: "0.375rem" }}>
          <LocationAutocomplete
            placeholder="π.χ. Θεσσαλονίκη"
            defaultValue={data.city}
            onSelect={handleLocationSelect}
          />
        </div>
      </div>

      {/* Price text (optional) */}
      <div style={{ marginTop: "0.875rem" }}>
        <Input
          label="Τιμή (προαιρετικό)"
          placeholder='Από €30/ώρα'
          value={data.priceText}
          onChange={(e) => onChange({ priceText: e.target.value })}
        />
      </div>

      {/* Bio textarea */}
      <div style={{ marginTop: "0.875rem" }} className="ui-field">
        <label className="ui-field-label">
          Βιογραφικό (προαιρετικό)
        </label>
        <textarea
          placeholder="Λίγα λόγια για σένα, την εμπειρία σου και τις υπηρεσίες που προσφέρεις…"
          value={data.bio}
          maxLength={BIO_MAX}
          rows={4}
          onChange={(e) => onChange({ bio: e.target.value })}
          style={styles.textarea}
        />
        <p
          style={{
            fontSize:  "0.775rem",
            color:     data.bio.length >= BIO_MAX * 0.9
              ? "var(--color-warning)"
              : "var(--color-text-muted)",
            textAlign: "right",
            margin:    "0.25rem 0 0",
          }}
        >
          {data.bio.length}/{BIO_MAX}
        </p>
      </div>
    </div>
  );
}

// =============================================================
// STEP 5 — Terms & Submit
// =============================================================
function Step5({
  data,
  onChange,
  submitError,
}: {
  data:        WizardData;
  onChange:    (d: Partial<WizardData>) => void;
  submitError: string | null;
}) {
  // Find the selected category and plan for the summary
  const category = CATEGORIES.find((c) => c.id === data.categoryId);
  const plan     = PLAN_OPTIONS.find((p) => p.id === data.billingPlan);
  const tier     = category?.tier ?? "trades";
  const modeMeta = BOOKING_MODES.find((m) => m.id === data.bookingMode);

  return (
    <div>
      <h2 style={styles.stepTitle}>Επισκόπηση & Αποδοχή</h2>

      {/* Summary card */}
      <div
        style={{
          border:       "1.5px solid var(--color-border)",
          borderRadius: "12px",
          padding:      "1.125rem",
          marginBottom: "1.5rem",
          fontSize:     "0.875rem",
        }}
      >
        <SummaryRow label="Κατηγορία">
          {category ? `${category.emoji} ${category.nameEl}` : data.categoryOther}
        </SummaryRow>
        <SummaryRow label="Κράτηση">
          {modeMeta?.emoji} {modeMeta?.title}
        </SummaryRow>
        <SummaryRow label="Πλάνο">
          {plan?.labelEl} —{" "}
          {plan ? fmt(plan.total[tier]) : "—"} (μετά τη δωρεάν περίοδο)
        </SummaryRow>
        <SummaryRow label="Όνομα">
          {data.firstName} {data.lastName}
        </SummaryRow>
        <SummaryRow label="Τηλέφωνο">{data.phone}</SummaryRow>
        <SummaryRow label="Πόλη">{data.city}</SummaryRow>

        {/* Trial reminder */}
        <div
          style={{
            marginTop:       "0.875rem",
            padding:         "0.625rem 0.875rem",
            backgroundColor: "var(--color-primary-bg)",
            borderRadius:    "8px",
            color:           "var(--color-primary-dark)",
            fontSize:        "0.8rem",
            fontWeight:      500,
          }}
        >
          🎉 Οι πρώτοι 3 μήνες είναι ΔΩΡΕΑΝ. Δεν απαιτείται πληρωμή σήμερα.
        </div>
      </div>

      {/* GDPR checkbox — required */}
      <label style={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={data.termsAccepted}
          onChange={(e) => onChange({ termsAccepted: e.target.checked })}
          style={{ width: "16px", height: "16px", flexShrink: 0, marginTop: "2px" }}
        />
        <span>
          Αποδέχομαι τους{" "}
          <a href="/terms" target="_blank" style={styles.link}>Όρους Χρήσης</a>
          {" "}και τη{" "}
          <a href="/subscription-agreement" target="_blank" style={styles.link}>
            Συμφωνία Συνδρομής
          </a>
          {" "}
          <span style={{ color: "var(--color-danger)" }}>*</span>
        </span>
      </label>

      {/* Marketing checkbox — optional */}
      <label style={{ ...styles.checkboxLabel, marginTop: "0.875rem" }}>
        <input
          type="checkbox"
          checked={data.marketingConsent}
          onChange={(e) => onChange({ marketingConsent: e.target.checked })}
          style={{ width: "16px", height: "16px", flexShrink: 0, marginTop: "2px" }}
        />
        <span style={{ color: "var(--color-text-muted)" }}>
          Θέλω να λαμβάνω ενημερώσεις, προσφορές και διαφημίσεις από το Trustia.gr
          και συνεργαζόμενες επιχειρήσεις.
        </span>
      </label>

      {/* Error display */}
      {submitError && (
        <p
          role="alert"
          style={{
            marginTop:    "1rem",
            padding:      "0.75rem",
            borderRadius: "8px",
            backgroundColor: "rgba(231,76,60,0.08)",
            color:        "var(--color-danger)",
            fontSize:     "0.875rem",
          }}
        >
          {submitError}
        </p>
      )}
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────
function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display:       "flex",
        justifyContent:"space-between",
        gap:           "1rem",
        padding:       "0.4rem 0",
        borderBottom:  "1px solid var(--color-bg-light)",
      }}
    >
      <span style={{ color: "var(--color-text-muted)", flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: "right" }}>{children}</span>
    </div>
  );
}

// ── Thank-you screen for "other" category ─────────────────────
function ThankYouOther() {
  const router = useRouter();
  return (
    <div style={{ ...styles.card, textAlign: "center", paddingBlock: "3rem" }}>
      <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>📬</p>
      <h2 style={{ fontSize: "1.375rem", fontWeight: 700, marginBottom: "0.75rem" }}>
        Λάβαμε το αίτημά σου!
      </h2>
      <p style={{ color: "var(--color-text-muted)", maxWidth: "380px", margin: "0 auto 2rem" }}>
        Θα αξιολογήσουμε την κατηγορία σου και θα επικοινωνήσουμε μαζί σου
        εντός 48 ωρών.
      </p>
      <Button variant="primary" href="/">Επιστροφή στην Αρχική</Button>
    </div>
  );
}

// =============================================================
// MAIN COMPONENT
// =============================================================
export default function ProfessionalRegistrationPage() {
  const router       = useRouter();
  const supabase     = createClient();
  const searchParams = useSearchParams();

  // ?ref= captures the referrer's slug so we can record the referral after sign-up
  const refSlug = searchParams.get("ref");

  const [step,         setStep]         = useState(1);
  const [data,         setData]         = useState<WizardData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError,  setSubmitError]  = useState<string | null>(null);
  const [thankYou,     setThankYou]     = useState(false);

  // ── Pre-fill email from the auth session ──────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setData((prev) =>
          prev.email ? prev : { ...prev, email: user.email! },
        );
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Partial data update helper ────────────────────────────
  function update(partial: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  // ── Step validation ───────────────────────────────────────
  function isStepValid(s: number): boolean {
    switch (s) {
      case 1:
        return (
          data.categoryId !== "" &&
          (data.categoryId !== "other" || data.categoryOther.trim() !== "")
        );
      case 2: return true; // always has a default
      case 3: return true; // always has a default
      case 4:
        return (
          data.firstName.trim() !== "" &&
          data.lastName.trim()  !== "" &&
          data.phone.trim()     !== "" &&
          data.city             !== ""
        );
      case 5: return data.termsAccepted;
      default: return false;
    }
  }

  // ── Navigation ────────────────────────────────────────────
  function goNext() {
    if (step < TOTAL_STEPS && isStepValid(step)) {
      setStep((s) => s + 1);
      setSubmitError(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function goBack() {
    if (step > 1) {
      setStep((s) => s - 1);
      setSubmitError(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // ── Submit ────────────────────────────────────────────────
  async function handleSubmit() {
    if (!isStepValid(5) || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    // 1. Verify session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?next=/register/professional");
      return;
    }

    // 2. "Other" category — skip DB inserts
    if (data.categoryId === "other") {
      setThankYou(true);
      setIsSubmitting(false);
      return;
    }

    try {
      const category = CATEGORIES.find((c) => c.id === data.categoryId)!;
      const tier     = category.tier as Tier;
      const plan     = PLAN_OPTIONS.find((p) => p.id === data.billingPlan)!;

      // Trial period: 3 months from today
      const now       = new Date();
      const trialEnds = new Date(now);
      trialEnds.setMonth(trialEnds.getMonth() + 3);

      // 3. Insert professional record
      // The slug is auto-generated by trg_professional_slug (DB trigger).
      // status = 'pending' until admin or onboarding checklist verifies completion.
      const { data: professional, error: proError } = await supabase
        .from("professionals")
        .insert({
          user_id:          user.id,
          first_name:       data.firstName.trim(),
          last_name:        data.lastName.trim(),
          phone:            data.phone.trim(),
          email:            data.email.trim() || user.email || "",
          category_id:      data.categoryId,
          tier,
          account_type:     "solo",
          booking_mode:     data.bookingMode,
          booking_enabled:  false,          // enabled once profile is complete
          bio:              data.bio.trim() || null,
          price_text:       data.priceText.trim() || null,
          city:             data.city,
          billing_plan:     data.billingPlan,
          status:           "pending",
          profile_complete: false,
        })
        .select("id")
        .single();

      if (proError) {
        // Handle duplicate registration (unique constraint on user_id)
        if (proError.code === "23505") {
          throw new Error("Φαίνεται ότι έχεις ήδη λογαριασμό επαγγελματία.");
        }
        throw proError;
      }

      // 4. Insert subscription (free trial)
      // payment_reference = '' → triggers trg_payment_reference which
      // auto-generates the TRS-YYYY-XXXX code (see DB trigger definition).
      // payment_status = 'pending' → no payment collected during trial.
      const { error: subError } = await supabase
        .from("subscriptions")
        .insert({
          professional_id:   professional.id,
          tier,
          billing_plan:      data.billingPlan,
          account_type:      "solo",
          monthly_price:     plan.perMonth[tier],
          total_amount:      plan.total[tier],
          payment_reference: "",    // DB trigger generates TRS-YYYY-XXXX
          payment_status:    "pending",
          starts_at:         now.toISOString(),
          ends_at:           trialEnds.toISOString(),
          is_founding:       true,  // Mark as founding member (admin can revise)
        });

      if (subError) throw subError;

      // 5. Claim referral if the user arrived via ?ref=SLUG
      // Non-fatal: if the referral RPC fails we still redirect to dashboard.
      if (refSlug) {
        const { error: refError } = await supabase.rpc("claim_referral", {
          ref_slug:   refSlug,
          new_pro_id: professional.id,
        });
        if (refError) {
          console.warn("[register] claim_referral error:", refError.message);
        }
      }

      // 6. Success → redirect to dashboard
      router.push("/dashboard?welcome=1");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Σφάλμα εγγραφής. Παρακαλώ δοκιμάστε ξανά.";
      setSubmitError(message);
      setIsSubmitting(false);
    }
  }

  // ── Derive tier from selected category ────────────────────
  const selectedTier: Tier =
    (CATEGORIES.find((c) => c.id === data.categoryId)?.tier as Tier) ?? "trades";

  // ── Render: "other" thank-you screen ─────────────────────
  if (thankYou) return <ThankYouOther />;

  // ── Render: wizard ────────────────────────────────────────
  return (
    <div
      style={{
        minHeight:       "100vh",
        backgroundColor: "var(--color-bg-light)",
        padding:         "2rem 1rem 4rem",
      }}
    >
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <p
            style={{
              fontSize:        "0.8rem",
              fontWeight:      700,
              letterSpacing:   "0.08em",
              textTransform:   "uppercase",
              color:           "var(--color-primary)",
              marginBottom:    "0.375rem",
            }}
          >
            Εγγραφή Επαγγελματία
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>
            Βήμα {step} από {TOTAL_STEPS} — {STEP_LABELS[step - 1]}
          </p>
        </div>

        {/* ── Progress bar ── */}
        <div
          style={{
            height:          "4px",
            backgroundColor: "var(--color-border)",
            borderRadius:    "999px",
            marginBottom:    "2rem",
            overflow:        "hidden",
          }}
        >
          <div
            style={{
              height:          "100%",
              width:           `${(step / TOTAL_STEPS) * 100}%`,
              backgroundColor: "var(--color-primary)",
              borderRadius:    "999px",
              transition:      "width 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>

        {/* ── Step dots ── */}
        <div
          style={{
            display:        "flex",
            justifyContent: "space-between",
            marginBottom:   "1.75rem",
            padding:        "0 0.25rem",
          }}
        >
          {STEP_LABELS.map((label, i) => {
            const n         = i + 1;
            const isDone    = n < step;
            const isCurrent = n === step;
            return (
              <div
                key={n}
                style={{
                  display:       "flex",
                  flexDirection: "column",
                  alignItems:    "center",
                  gap:           "0.375rem",
                }}
              >
                <span
                  style={{
                    width:           "28px",
                    height:          "28px",
                    borderRadius:    "50%",
                    backgroundColor: isDone
                      ? "var(--color-primary)"
                      : isCurrent
                        ? "var(--color-primary)"
                        : "var(--color-border)",
                    color:           isDone || isCurrent ? "#fff" : "var(--color-text-muted)",
                    display:         "flex",
                    alignItems:      "center",
                    justifyContent:  "center",
                    fontSize:        "0.75rem",
                    fontWeight:      700,
                    transition:      "background-color 0.25s",
                  }}
                >
                  {isDone ? <Check size={13} strokeWidth={3} /> : n}
                </span>
                <span
                  style={{
                    fontSize:  "0.65rem",
                    fontWeight: isCurrent ? 600 : 400,
                    color:     isCurrent ? "var(--color-primary)" : "var(--color-text-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Main card ── */}
        <div style={styles.card}>
          {step === 1 && <Step1 data={data} onChange={update} />}
          {step === 2 && <Step2 data={data} onChange={update} />}
          {step === 3 && (
            <Step3 data={data} tier={selectedTier} onChange={update} />
          )}
          {step === 4 && <Step4 data={data} onChange={update} />}
          {step === 5 && (
            <Step5 data={data} onChange={update} submitError={submitError} />
          )}

          {/* ── Navigation row ── */}
          <div
            style={{
              display:         "flex",
              justifyContent:  step === 1 ? "flex-end" : "space-between",
              alignItems:      "center",
              marginTop:       "2rem",
              paddingTop:      "1.25rem",
              borderTop:       "1px solid var(--color-border)",
            }}
          >
            {step > 1 && (
              <Button
                variant="ghost"
                size="md"
                icon={ChevronLeft}
                onClick={goBack}
              >
                Πίσω
              </Button>
            )}

            {step < TOTAL_STEPS ? (
              <Button
                variant="primary"
                size="md"
                icon={ChevronRight}
                iconPosition="right"
                disabled={!isStepValid(step)}
                onClick={goNext}
              >
                Επόμενο
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                loading={isSubmitting}
                disabled={!isStepValid(5) || isSubmitting}
                onClick={handleSubmit}
              >
                Ολοκλήρωση Εγγραφής
              </Button>
            )}
          </div>
        </div>

        {/* Already a customer? */}
        <p
          style={{
            textAlign:  "center",
            marginTop:  "1.5rem",
            fontSize:   "0.8125rem",
            color:      "var(--color-text-muted)",
          }}
        >
          Εγγραφή ως πελάτης;{" "}
          <a href="/register" style={styles.link}>Εδώ →</a>
        </p>
      </div>
    </div>
  );
}

// =============================================================
// SHARED STYLES (object literals — all inline for RSC-safe reuse)
// =============================================================
const styles = {
  card: {
    backgroundColor: "#fff",
    borderRadius:    "16px",
    padding:         "2rem",
    boxShadow:       "0 2px 24px rgba(0,0,0,0.07)",
  } satisfies React.CSSProperties,

  stepTitle: {
    fontSize:     "1.25rem",
    fontWeight:   700,
    color:        "var(--color-text)",
    margin:       "0 0 0.375rem",
  } satisfies React.CSSProperties,

  stepSubtitle: {
    fontSize:     "0.875rem",
    color:        "var(--color-text-muted)",
    margin:       "0 0 1.5rem",
    lineHeight:   1.55,
  } satisfies React.CSSProperties,

  tierLabel: {
    fontSize:     "0.8rem",
    fontWeight:   700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color:        "var(--color-text-muted)",
    margin:       "0 0 0.625rem",
  } satisfies React.CSSProperties,

  categoryGrid: {
    display:             "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap:                 "0.5rem",
  } satisfies React.CSSProperties,

  categoryCard: {
    display:        "flex",
    flexDirection:  "column" as const,
    alignItems:     "center",
    gap:            "0.375rem",
    padding:        "0.75rem 0.5rem",
    border:         "1.5px solid",
    borderRadius:   "10px",
    cursor:         "pointer",
    transition:     "border-color 0.15s, background-color 0.15s",
    background:     "none",
  } satisfies React.CSSProperties,

  planGrid: {
    display:   "flex",
    gap:       "0.75rem",
    flexWrap:  "wrap" as const,
  } satisfies React.CSSProperties,

  textarea: {
    width:        "100%",
    padding:      "0.625rem 0.875rem",
    border:       "1.5px solid var(--color-border)",
    borderRadius: "10px",
    fontSize:     "0.9375rem",
    fontFamily:   "inherit",
    color:        "var(--color-text)",
    outline:      "none",
    resize:       "vertical" as const,
    lineHeight:   1.55,
    boxSizing:    "border-box" as const,
  } satisfies React.CSSProperties,

  fieldRow: {
    display:             "grid",
    gridTemplateColumns: "1fr 1fr",
    gap:                 "0.75rem",
  } satisfies React.CSSProperties,

  checkboxLabel: {
    display:    "flex",
    gap:        "0.625rem",
    alignItems: "flex-start",
    cursor:     "pointer",
    fontSize:   "0.875rem",
    lineHeight: 1.5,
    color:      "var(--color-text)",
  } satisfies React.CSSProperties,

  link: {
    color:          "var(--color-primary)",
    textDecoration: "underline",
  } satisfies React.CSSProperties,
} as const;
