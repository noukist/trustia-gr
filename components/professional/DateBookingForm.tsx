// =============================================================
// components/professional/DateBookingForm.tsx
// =============================================================
// Modal form for "date" booking mode (PRD §22 – Mode 2).
//
// FLOW
//   1. Customer picks a date and optionally writes a note
//   2. On submit:
//      a. Upsert a customers row for the logged-in user (in case
//         they registered as a professional and have no customer row)
//      b. INSERT into bookings with status = 'pending'
//   3. Success screen — professional sees the request in BookingsTab
//
// RLS: bookings_customer_insert requires
//   customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
//   so we always resolve/create the customer row first.
// =============================================================

"use client";

import React, { useState }  from "react";
import { X, CalendarDays, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useTranslations }   from "next-intl";
import { createClient }      from "@/lib/supabase/client";
import { sendBookingEmails } from "@/app/actions/emailActions";

// ── Props ──────────────────────────────────────────────────────
interface DateBookingFormProps {
  professionalId: string;
  proName:        string;   // full name — "Νίκος Παπαδόπουλος"
  onClose:        () => void;
}

// ── Today as YYYY-MM-DD (min value for date picker) ────────────
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// =============================================================
export default function DateBookingForm({
  professionalId,
  proName,
  onClose,
}: DateBookingFormProps) {
  const t          = useTranslations("profile");
  const firstName  = proName.split(" ")[0];

  const [date,        setDate]        = useState("");
  const [description, setDescription] = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState("");

  // ── Submit ─────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!date) {
      setError(t("bookingErrorDate"));
      return;
    }
    if (date < todayISO()) {
      setError(t("bookingErrorPast"));
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();

      // ── Step 1: Resolve the customer row ──────────────────
      // The logged-in user may have registered as a professional
      // and never created a customer row — upsert to be safe.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("not authenticated");

      // Try to get existing customer row first
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let customerId: string;

      if (existing) {
        customerId = existing.id;
      } else {
        // Create customer row (happens when a professional books someone else's service)
        const { data: created, error: createErr } = await supabase
          .from("customers")
          .insert({
            user_id:      user.id,
            email:        user.email ?? null,
            display_name: user.user_metadata?.full_name ?? null,
          })
          .select("id")
          .single();

        if (createErr || !created) throw createErr ?? new Error("customer create failed");
        customerId = created.id;
      }

      // ── Step 2: Insert the booking ────────────────────────
      const { data: newBooking, error: bookingErr } = await supabase
        .from("bookings")
        .insert({
          professional_id: professionalId,
          customer_id:     customerId,
          booking_date:    date,
          booking_mode:    "date",
          description:     description.trim() || null,
          status:          "pending",
        })
        .select("id")
        .single();

      if (bookingErr) throw bookingErr;

      // ── Step 3: Send confirmation + alert emails (non-blocking) ──
      if (newBooking?.id) {
        sendBookingEmails(newBooking.id).catch((e) =>
          console.warn("[DateBookingForm] email send failed:", e),
        );
      }

      setSuccess(true);
    } catch (err: unknown) {
      console.error("[DateBookingForm] submit error:", err);
      setError(t("bookingErrorFail"));
    } finally {
      setSubmitting(false);
    }
  }

  // ── Overlay + card wrapper ─────────────────────────────────
  return (
    <div
      onClick={onClose}
      style={{
        position:        "fixed",
        inset:           0,
        backgroundColor: "rgba(0,0,0,0.55)",
        zIndex:          500,
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        padding:         "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#fff",
          borderRadius:    "16px",
          padding:         "2rem",
          maxWidth:        "440px",
          width:           "100%",
          position:        "relative",
          boxShadow:       "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position:  "absolute",
            top:       "1rem",
            right:     "1rem",
            background:"none",
            border:    "none",
            cursor:    "pointer",
            color:     "var(--color-text-muted)",
            display:   "flex",
            padding:   "0.25rem",
          }}
        >
          <X size={20} />
        </button>

        {/* ── Success state ── */}
        {success ? (
          <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
            <CheckCircle2 size={52} style={{ color: "#27AE60", marginBottom: "1rem" }} />
            <h2
              style={{
                fontSize:     "1.125rem",
                fontWeight:   800,
                color:        "var(--color-text)",
                margin:       "0 0 0.5rem",
              }}
            >
              {t("bookingSuccessTitle")}
            </h2>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", margin: "0 0 0.375rem", lineHeight: 1.6 }}>
              {t("bookingSuccessDesc", { firstName })}
            </p>
            <p
              style={{
                fontSize:        "0.8125rem",
                color:           "var(--color-primary)",
                fontWeight:      600,
                margin:          "0 0 1.5rem",
                backgroundColor: "var(--color-primary-bg)",
                padding:         "0.5rem 0.875rem",
                borderRadius:    "8px",
                display:         "inline-block",
              }}
            >
              ⏱ {t("bookingSuccessNote")}
            </p>
            <br />
            <button
              type="button"
              onClick={onClose}
              style={{
                padding:         "0.625rem 1.75rem",
                backgroundColor: "var(--color-primary)",
                color:           "#fff",
                border:          "none",
                borderRadius:    "10px",
                fontWeight:      700,
                fontSize:        "0.9375rem",
                cursor:          "pointer",
                fontFamily:      "inherit",
              }}
            >
              OK
            </button>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            {/* Header */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  display:         "inline-flex",
                  alignItems:      "center",
                  justifyContent:  "center",
                  width:           "44px",
                  height:          "44px",
                  backgroundColor: "var(--color-primary-bg)",
                  borderRadius:    "12px",
                  marginBottom:    "0.875rem",
                }}
              >
                <CalendarDays size={22} style={{ color: "var(--color-primary)" }} />
              </div>
              <h2
                style={{
                  fontSize:   "1.125rem",
                  fontWeight: 800,
                  color:      "var(--color-text)",
                  margin:     "0 0 0.375rem",
                }}
              >
                {t("bookingDateTitle")}
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: 0 }}>
                {t("bookingDateSub", { firstName })}
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>

              {/* Error banner */}
              {error && (
                <div
                  style={{
                    display:         "flex",
                    alignItems:      "flex-start",
                    gap:             "0.5rem",
                    padding:         "0.75rem 1rem",
                    backgroundColor: "rgba(231,76,60,0.08)",
                    border:          "1px solid rgba(231,76,60,0.3)",
                    borderRadius:    "8px",
                    color:           "#991B1B",
                    fontSize:        "0.875rem",
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
                  {error}
                </div>
              )}

              {/* Date picker */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label
                  htmlFor="booking-date"
                  style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text)" }}
                >
                  {t("bookingDateLabel")}
                </label>
                <input
                  id="booking-date"
                  type="date"
                  value={date}
                  onChange={(e) => { setDate(e.target.value); setError(""); }}
                  min={todayISO()}
                  required
                  style={{
                    padding:      "0.625rem 0.875rem",
                    border:       `1.5px solid ${error && !date ? "#E74C3C" : "var(--color-border)"}`,
                    borderRadius: "8px",
                    fontSize:     "0.9rem",
                    fontFamily:   "inherit",
                    outline:      "none",
                    color:        "var(--color-text)",
                    width:        "100%",
                    boxSizing:    "border-box",
                  }}
                />
              </div>

              {/* Description textarea */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label
                  htmlFor="booking-desc"
                  style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text)" }}
                >
                  {t("bookingDescLabel")}
                </label>
                <textarea
                  id="booking-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("bookingDescPlaceholder")}
                  rows={3}
                  maxLength={500}
                  style={{
                    padding:      "0.625rem 0.875rem",
                    border:       "1.5px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize:     "0.875rem",
                    fontFamily:   "inherit",
                    lineHeight:   1.6,
                    resize:       "vertical",
                    outline:      "none",
                    color:        "var(--color-text)",
                    width:        "100%",
                    boxSizing:    "border-box",
                  }}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  display:         "flex",
                  alignItems:      "center",
                  justifyContent:  "center",
                  gap:             "0.5rem",
                  width:           "100%",
                  padding:         "0.875rem",
                  backgroundColor: "var(--color-primary)",
                  color:           "#fff",
                  border:          "none",
                  borderRadius:    "10px",
                  fontSize:        "1rem",
                  fontWeight:      700,
                  fontFamily:      "inherit",
                  cursor:          submitting ? "wait" : "pointer",
                  marginTop:       "0.25rem",
                }}
              >
                {submitting
                  ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> {t("bookingSubmitting")}</>
                  : <><CalendarDays size={17} /> {t("bookingSubmit")}</>
                }
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
