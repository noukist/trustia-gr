// =============================================================
// components/professional/FullCalendarBookingForm.tsx
// =============================================================
// Modal form for "full" booking mode (PRD §22 – Mode 3).
//
// FLOW
//   Step 1 — Select services (checkboxes, running total)
//   Step 2 — Pick date → async load available time slots
//   Step 3 — Review summary + optional description → submit
//
// TIME SLOT GENERATION
//   • Fetches availability_slots for the chosen day_of_week
//   • Checks if the specific date is blocked
//   • Fetches existing pending/confirmed bookings for that date
//   • Generates slots of `totalDuration` minutes every 30 min,
//     skipping any that overlap with existing bookings
//
// BOOKING INSERT
//   booking_mode = 'full', start_time + end_time set,
//   services JSONB array, total_price stored.
// =============================================================

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, CheckCircle2, ChevronLeft, Loader2 }   from "lucide-react";
import { useTranslations, useLocale }               from "next-intl";
import { createClient }                             from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────

export interface ServiceItem {
  id:               string;
  name_el:          string;
  name_en:          string | null;
  duration_minutes: number;
  price:            number;
}

interface FullCalendarBookingFormProps {
  professionalId: string;
  proName:        string;
  services:       ServiceItem[];
  onClose:        () => void;
}

type Step = 1 | 2 | 3;

// ── Helpers ───────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Parse "HH:MM:SS" or "HH:MM" into total minutes since midnight */
function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Format minutes since midnight as "HH:MM" */
function minToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/**
 * Generate all possible start times (as "HH:MM") for a service block of
 * `durationMin` minutes, stepping every 30 min within the availability
 * window, excluding any slot that overlaps with an existing booking.
 */
function generateSlots(
  windowStart:   string,
  windowEnd:     string,
  durationMin:   number,
  booked: Array<{ start_time: string; end_time: string }>,
): string[] {
  const winStart = timeToMin(windowStart);
  const winEnd   = timeToMin(windowEnd);
  const slots: string[] = [];

  for (let s = winStart; s + durationMin <= winEnd; s += 30) {
    const e = s + durationMin;
    const overlaps = booked.some(({ start_time, end_time }) => {
      const bs = timeToMin(start_time);
      const be = timeToMin(end_time);
      return s < be && e > bs; // half-open interval overlap
    });
    if (!overlaps) slots.push(minToTime(s));
  }

  return slots;
}

// ── Component ─────────────────────────────────────────────────

export default function FullCalendarBookingForm({
  professionalId,
  proName,
  services,
  onClose,
}: FullCalendarBookingFormProps) {
  const t      = useTranslations("profile");
  const locale = useLocale();
  const firstName = proName.split(" ")[0];

  // ── State ─────────────────────────────────────────────────
  const [step,             setStep]             = useState<Step>(1);
  const [selectedIds,      setSelectedIds]      = useState<Set<string>>(new Set());
  const [selectedDate,     setSelectedDate]     = useState("");
  const [availableSlots,   setAvailableSlots]   = useState<string[]>([]);
  const [loadingSlots,     setLoadingSlots]     = useState(false);
  const [selectedSlot,     setSelectedSlot]     = useState<string | null>(null);
  const [description,      setDescription]      = useState("");
  const [submitting,       setSubmitting]       = useState(false);
  const [success,          setSuccess]          = useState(false);
  const [error,            setError]            = useState("");
  const [validationMsg,    setValidationMsg]    = useState("");

  // ── Derived totals ────────────────────────────────────────
  const selectedServices = services.filter((s) => selectedIds.has(s.id));
  const totalDuration    = selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalPrice       = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);

  // ── Close on Escape ───────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ── Prevent body scroll ───────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // ── Fetch slots when date or services change (on step 2) ──
  const fetchSlots = useCallback(async (date: string) => {
    if (!date || totalDuration === 0) {
      setAvailableSlots([]);
      return;
    }
    setLoadingSlots(true);
    setAvailableSlots([]);
    setSelectedSlot(null);

    try {
      const supabase     = createClient();
      const dayOfWeek    = new Date(date + "T12:00:00").getDay(); // use noon to avoid TZ issues

      // Parallel: availability windows, date blocks, existing bookings
      const [availRes, blockedRes, bookedRes] = await Promise.all([
        // Recurring availability windows for this day of week
        supabase
          .from("availability_slots")
          .select("start_time, end_time")
          .eq("professional_id", professionalId)
          .eq("day_of_week", dayOfWeek)
          .eq("is_blocked", false),
        // Specific-date blocks (professional marked this day off)
        supabase
          .from("availability_slots")
          .select("id")
          .eq("professional_id", professionalId)
          .eq("blocked_date", date)
          .eq("is_blocked", true),
        // Existing pending/confirmed bookings on this date with a time slot
        supabase
          .from("bookings")
          .select("start_time, end_time")
          .eq("professional_id", professionalId)
          .eq("booking_date", date)
          .in("status", ["pending", "confirmed"])
          .not("start_time", "is", null),
      ]);

      // If the date is specifically blocked, no slots available
      if ((blockedRes.data?.length ?? 0) > 0) {
        setAvailableSlots([]);
        setLoadingSlots(false);
        return;
      }

      const windows = availRes.data ?? [];
      const booked  = (bookedRes.data ?? []) as Array<{ start_time: string; end_time: string }>;

      // Generate available slots across all availability windows
      const slots: string[] = [];
      for (const w of windows) {
        slots.push(...generateSlots(w.start_time, w.end_time, totalDuration, booked));
      }

      // Deduplicate (two overlapping windows could produce the same slot)
      const unique = [...new Set(slots)].sort();
      setAvailableSlots(unique);
    } catch (err) {
      console.error("[FullCalendarBookingForm] fetchSlots error:", err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [professionalId, totalDuration]);

  // Refetch when date changes (only if on step 2)
  useEffect(() => {
    if (step === 2 && selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [step, selectedDate, fetchSlots]);

  // ── Toggle service selection ──────────────────────────────
  function toggleService(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    // Slots must be re-fetched if duration changes
    setSelectedSlot(null);
  }

  // ── Navigation ────────────────────────────────────────────
  function goToStep2() {
    if (selectedIds.size === 0) {
      setValidationMsg(t("bookingFullSelectMin"));
      return;
    }
    setValidationMsg("");
    setStep(2);
  }

  function goToStep3() {
    if (!selectedDate) {
      setValidationMsg(t("bookingErrorDate"));
      return;
    }
    if (!selectedSlot) {
      setValidationMsg(t("bookingFullPickTime"));
      return;
    }
    setValidationMsg("");
    setStep(3);
  }

  // ── Submit ────────────────────────────────────────────────
  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    try {
      const supabase = createClient();

      // Auth check
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("not authenticated");

      // Resolve / create customer row
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let customerId: string;
      if (existing) {
        customerId = existing.id;
      } else {
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

      // Calculate end time from selected slot + total duration
      const startMin  = timeToMin(selectedSlot!);
      const endTime   = minToTime(startMin + totalDuration);

      // Build services JSONB (matches the bookings.services column shape)
      const servicesPayload = selectedServices.map((s) => ({
        service_id: s.id,
        name:       locale === "en" && s.name_en ? s.name_en : s.name_el,
        duration:   s.duration_minutes,
        price:      Number(s.price),
      }));

      const { error: bookingErr } = await supabase
        .from("bookings")
        .insert({
          professional_id: professionalId,
          customer_id:     customerId,
          booking_date:    selectedDate,
          start_time:      selectedSlot,
          end_time:        endTime,
          // booking_time mirrors start_time — column exists in live DB without a migration
          booking_time:    selectedSlot,
          booking_mode:    "full",
          status:          "pending",
          services:        servicesPayload,
          total_price:     totalPrice,
          description:     description.trim() || null,
        });

      if (bookingErr) throw bookingErr;
      setSuccess(true);
    } catch (err: unknown) {
      console.error("[FullCalendarBookingForm] submit error:", err);
      setError(t("bookingErrorFail"));
    } finally {
      setSubmitting(false);
    }
  }

  // ── Format date for display ───────────────────────────────
  const formattedDate = selectedDate
    ? new Date(selectedDate + "T12:00:00").toLocaleDateString(
        locale === "en" ? "en-GB" : "el-GR",
        { weekday: "long", day: "numeric", month: "long" },
      )
    : "";

  // ── Shared styles ─────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.625rem 0.875rem",
    border: "1.5px solid var(--color-border)", borderRadius: "8px",
    fontSize: "0.95rem", fontFamily: "inherit", color: "var(--color-text)",
    backgroundColor: "#fff", outline: "none", boxSizing: "border-box",
  };

  // ─────────────────────────────────────────────────────────
  // SUCCESS SCREEN
  // ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <Overlay onClose={onClose}>
        <Card onClose={onClose}>
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <CheckCircle2 size={56} style={{ color: "var(--color-primary)", marginBottom: "1rem" }} />
            <h2 style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--color-text)", margin: "0 0 0.5rem" }}>
              {t("bookingFullSuccessTitle")}
            </h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", lineHeight: 1.6, margin: "0 0 1.5rem" }}>
              {t("bookingFullSuccessDesc", { firstName })}
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
              📅 {formattedDate} · ⏰ {selectedSlot}
            </p>
            <button
              onClick={onClose}
              style={{
                padding: "0.625rem 1.75rem", backgroundColor: "var(--color-primary)",
                color: "#fff", border: "none", borderRadius: "10px",
                fontWeight: 700, fontSize: "0.9375rem", fontFamily: "inherit", cursor: "pointer",
              }}
            >
              {t("bookingFullClose")}
            </button>
          </div>
        </Card>
      </Overlay>
    );
  }

  // ─────────────────────────────────────────────────────────
  // STEP INDICATOR
  // ─────────────────────────────────────────────────────────
  const STEPS = [t("bookingFullStep1"), t("bookingFullStep2"), t("bookingFullStep3")];

  const stepIndicator = (
    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "1.5rem" }}>
      {STEPS.map((label, i) => {
        const n = (i + 1) as Step;
        const active    = step === n;
        const completed = step > n;
        return (
          <React.Fragment key={label}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <div
                style={{
                  width:           "22px", height: "22px", borderRadius: "50%",
                  backgroundColor: completed || active ? "var(--color-primary)" : "var(--color-border)",
                  color:           "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize:        "0.7rem", fontWeight: 700, flexShrink: 0,
                }}
              >
                {completed ? "✓" : n}
              </div>
              <span
                style={{
                  fontSize: "0.75rem", fontWeight: active ? 700 : 400,
                  color: active ? "var(--color-text)" : "var(--color-text-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)", minWidth: "8px" }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // STEP 1 — Service selection
  // ─────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <Overlay onClose={onClose}>
        <Card onClose={onClose} title={t("bookingFullStep1")}>
          {stepIndicator}

          {services.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "2rem 0" }}>
              {t("bookingFullNoServices")}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
              {services.map((s) => {
                const isChecked = selectedIds.has(s.id);
                const name = locale === "en" && s.name_en ? s.name_en : s.name_el;
                return (
                  <label
                    key={s.id}
                    style={{
                      display:         "flex", alignItems: "center", gap: "0.875rem",
                      padding:         "0.875rem 1rem",
                      border:          `1.5px solid ${isChecked ? "var(--color-primary)" : "var(--color-border)"}`,
                      borderRadius:    "10px",
                      cursor:          "pointer",
                      backgroundColor: isChecked ? "var(--color-primary-bg)" : "#fff",
                      transition:      "border-color 0.12s, background-color 0.12s",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleService(s.id)}
                      style={{ width: "16px", height: "16px", accentColor: "var(--color-primary)", flexShrink: 0, cursor: "pointer" }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text)", margin: 0 }}>
                        {name}
                      </p>
                      <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0.15rem 0 0" }}>
                        {s.duration_minutes} {t("bookingFullMin")}
                      </p>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--color-primary)", flexShrink: 0 }}>
                      {s.price > 0 ? `€${Number(s.price).toFixed(2)}` : t("bookingFullFree")}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {/* Running total */}
          {selectedIds.size > 0 && (
            <div
              style={{
                display: "flex", justifyContent: "space-between",
                padding: "0.75rem 1rem",
                backgroundColor: "var(--color-primary-bg)",
                borderRadius: "10px", marginBottom: "1.25rem",
              }}
            >
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                {t("bookingFullDuration")}: <strong style={{ color: "var(--color-text)" }}>{totalDuration} {t("bookingFullMin")}</strong>
              </span>
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                {t("bookingFullTotal")}: <strong style={{ color: "var(--color-primary)" }}>
                  {totalPrice > 0 ? `€${totalPrice.toFixed(2)}` : t("bookingFullFree")}
                </strong>
              </span>
            </div>
          )}

          {validationMsg && (
            <p style={{ color: "#DC2626", fontSize: "0.8rem", margin: "0 0 0.75rem" }}>{validationMsg}</p>
          )}

          <button
            onClick={goToStep2}
            disabled={services.length === 0}
            style={{
              width: "100%", padding: "0.75rem",
              backgroundColor: services.length === 0 ? "var(--color-border)" : "var(--color-primary)",
              color: "#fff", border: "none", borderRadius: "10px",
              fontWeight: 700, fontSize: "0.9375rem", fontFamily: "inherit",
              cursor: services.length === 0 ? "default" : "pointer",
            }}
          >
            {t("bookingFullNextStep")}
          </button>
        </Card>
      </Overlay>
    );
  }

  // ─────────────────────────────────────────────────────────
  // STEP 2 — Date & time slot
  // ─────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <Overlay onClose={onClose}>
        <Card onClose={onClose} title={t("bookingFullStep2")}>
          {stepIndicator}

          {/* Date picker */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)", marginBottom: "0.5rem" }}>
              {t("bookingDateLabel")}
            </label>
            <input
              type="date"
              value={selectedDate}
              min={todayISO()}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedSlot(null);
                setValidationMsg("");
              }}
              style={inputStyle}
            />
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)", marginBottom: "0.625rem" }}>
                {t("bookingFullPickTime")}
              </label>
              {loadingSlots ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  {t("bookingFullLoadingSlots")}
                </div>
              ) : availableSlots.length === 0 ? (
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: 0 }}>
                  {t("bookingFullNoSlots")}
                </p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => { setSelectedSlot(slot); setValidationMsg(""); }}
                        style={{
                          padding:         "0.5rem 0.875rem",
                          border:          `1.5px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
                          borderRadius:    "8px",
                          backgroundColor: isSelected ? "var(--color-primary)" : "#fff",
                          color:           isSelected ? "#fff" : "var(--color-text)",
                          fontWeight:      isSelected ? 700 : 500,
                          fontSize:        "0.875rem",
                          fontFamily:      "inherit",
                          cursor:          "pointer",
                          transition:      "all 0.1s",
                        }}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {validationMsg && (
            <p style={{ color: "#DC2626", fontSize: "0.8rem", margin: "0 0 0.75rem" }}>{validationMsg}</p>
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={() => { setStep(1); setValidationMsg(""); }}
              style={{
                display: "flex", alignItems: "center", gap: "0.375rem",
                padding: "0.75rem 1rem", border: "1.5px solid var(--color-border)",
                borderRadius: "10px", backgroundColor: "#fff", color: "var(--color-text)",
                fontWeight: 600, fontSize: "0.875rem", fontFamily: "inherit", cursor: "pointer",
              }}
            >
              <ChevronLeft size={16} /> {t("bookingFullBack")}
            </button>
            <button
              onClick={goToStep3}
              style={{
                flex: 1, padding: "0.75rem",
                backgroundColor: "var(--color-primary)",
                color: "#fff", border: "none", borderRadius: "10px",
                fontWeight: 700, fontSize: "0.9375rem", fontFamily: "inherit", cursor: "pointer",
              }}
            >
              {t("bookingFullNextStep")}
            </button>
          </div>
        </Card>
      </Overlay>
    );
  }

  // ─────────────────────────────────────────────────────────
  // STEP 3 — Confirm
  // ─────────────────────────────────────────────────────────
  return (
    <Overlay onClose={onClose}>
      <Card onClose={onClose} title={t("bookingFullStep3")}>
        {stepIndicator}

        {/* Summary */}
        <div
          style={{
            backgroundColor: "var(--color-bg-light)", borderRadius: "12px",
            padding: "1rem", marginBottom: "1.25rem",
            display: "flex", flexDirection: "column", gap: "0.5rem",
          }}
        >
          {selectedServices.map((s) => {
            const name = locale === "en" && s.name_en ? s.name_en : s.name_el;
            return (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                <span style={{ color: "var(--color-text)" }}>{name}</span>
                <span style={{ color: "var(--color-text-muted)" }}>
                  {s.price > 0 ? `€${Number(s.price).toFixed(2)}` : t("bookingFullFree")}
                </span>
              </div>
            );
          })}
          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "0.5rem", display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
            <span style={{ color: "var(--color-text-muted)" }}>
              📅 {formattedDate} · ⏰ {selectedSlot}
            </span>
            <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>
              {totalPrice > 0 ? `€${totalPrice.toFixed(2)}` : t("bookingFullFree")}
            </span>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)", marginBottom: "0.5rem" }}>
            {t("bookingDescLabel")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={t("bookingDescPlaceholder")}
            disabled={submitting}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
          />
        </div>

        {error && (
          <p style={{ color: "#DC2626", fontSize: "0.875rem", margin: "0 0 0.75rem" }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={() => { setStep(2); setError(""); }}
            disabled={submitting}
            style={{
              display: "flex", alignItems: "center", gap: "0.375rem",
              padding: "0.75rem 1rem", border: "1.5px solid var(--color-border)",
              borderRadius: "10px", backgroundColor: "#fff", color: "var(--color-text)",
              fontWeight: 600, fontSize: "0.875rem", fontFamily: "inherit",
              cursor: submitting ? "default" : "pointer",
            }}
          >
            <ChevronLeft size={16} /> {t("bookingFullBack")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              flex: 1, padding: "0.75rem",
              backgroundColor: submitting ? "var(--color-border)" : "var(--color-primary)",
              color: "#fff", border: "none", borderRadius: "10px",
              fontWeight: 700, fontSize: "0.9375rem", fontFamily: "inherit",
              cursor: submitting ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            }}
          >
            {submitting && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
            {submitting ? t("bookingFullConfirming") : t("bookingFullConfirm")}
          </button>
        </div>
      </Card>
    </Overlay>
  );
}

// ── Shared wrapper components ─────────────────────────────────

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
    >
      {children}
    </div>
  );
}

function Card({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose:  () => void;
  title?:   string;
}) {
  const tc = useTranslations("common");
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        backgroundColor: "#fff", borderRadius: "20px",
        width: "min(480px, 94vw)", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 64px rgba(0,0,0,0.2)", position: "relative",
      }}
    >
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border)",
          position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1,
        }}
      >
        <h2 style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--color-text)", margin: 0, letterSpacing: "-0.01em" }}>
          {title ?? "Κράτηση"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={tc("close")}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "0.375rem", borderRadius: "8px", color: "var(--color-text-muted)", display: "flex",
          }}
        >
          <X size={20} />
        </button>
      </div>
      <div style={{ padding: "1.5rem" }}>
        {children}
      </div>
    </div>
  );
}
