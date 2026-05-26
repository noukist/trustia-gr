// =============================================================
// components/dashboard/AvailabilityEditor.tsx
// =============================================================
// Dashboard editor for professional availability (working hours
// + blocked dates). Only meaningful when booking_mode = "full"
// since FullCalendarBookingForm reads from availability_slots.
//
// DATA MODEL
//   Recurring slots:   is_blocked=false, day_of_week=N, start_time, end_time
//   Specific blocks:   is_blocked=true,  blocked_date=DATE,
//                      start_time='00:00', end_time='23:59' (required by CHECK)
//
// SAVE STRATEGY
//   Delete all existing rows for this professional, then re-insert
//   the full current state. Simpler than diffing and safe for this
//   table size (max ~20 rows per professional).
//
// UX
//   Weekly schedule: Mon–Sun toggle + one or more time windows per day
//   Blocked dates:   date picker + chip list sorted by date
// =============================================================

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Check, AlertCircle, Loader2, X } from "lucide-react";

// ── Day definitions (Mon-first order) ─────────────────────────
// day_of_week follows JS Date.getDay(): 0=Sun, 1=Mon … 6=Sat

const DAYS: { id: number; label: string }[] = [
  { id: 1, label: "Δευτέρα"    },
  { id: 2, label: "Τρίτη"      },
  { id: 3, label: "Τετάρτη"    },
  { id: 4, label: "Πέμπτη"     },
  { id: 5, label: "Παρασκευή"  },
  { id: 6, label: "Σάββατο"    },
  { id: 0, label: "Κυριακή"    },
];

// ── Types ──────────────────────────────────────────────────────

interface TimeWindow {
  /** Local key only — not stored in DB */
  tempId: string;
  start:  string; // "HH:MM"
  end:    string; // "HH:MM"
}

interface DaySchedule {
  enabled: boolean;
  windows: TimeWindow[];
}

/** week[day_of_week] → DaySchedule */
type WeekSchedule = Record<number, DaySchedule>;

interface BlockedDate {
  tempId: string;
  date:   string; // "YYYY-MM-DD"
}

// ── Helpers ────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2);
}

function emptyDay(): DaySchedule {
  return { enabled: false, windows: [{ tempId: uid(), start: "09:00", end: "17:00" }] };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Component ──────────────────────────────────────────────────

export default function AvailabilityEditor({
  professionalId,
}: {
  professionalId: string;
}) {
  // ── State ───────────────────────────────────────────────────
  const [schedule, setSchedule] = useState<WeekSchedule>(() => {
    const s: WeekSchedule = {};
    for (const d of DAYS) s[d.id] = emptyDay();
    return s;
  });
  const [blocked,  setBlocked]  = useState<BlockedDate[]>([]);
  const [newDate,  setNewDate]  = useState("");
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [status,   setStatus]   = useState<"idle" | "success" | "error">("idle");
  const [errMsg,   setErrMsg]   = useState("");

  // ── Load existing slots from DB ──────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("availability_slots")
      .select("id, day_of_week, start_time, end_time, is_blocked, blocked_date")
      .eq("professional_id", professionalId);

    // Rebuild week schedule
    const newSched: WeekSchedule = {};
    for (const d of DAYS) newSched[d.id] = emptyDay();

    const newBlocked: BlockedDate[] = [];

    for (const row of data ?? []) {
      if (row.is_blocked) {
        // Specific blocked date
        if (row.blocked_date) {
          newBlocked.push({ tempId: uid(), date: row.blocked_date });
        }
      } else {
        // Recurring availability window
        const dayId = row.day_of_week as number;
        if (!(dayId in newSched)) continue;
        const win: TimeWindow = {
          tempId: uid(),
          start:  (row.start_time as string).slice(0, 5),
          end:    (row.end_time   as string).slice(0, 5),
        };
        if (!newSched[dayId].enabled) {
          // First window for this day — activate and replace default
          newSched[dayId] = { enabled: true, windows: [win] };
        } else {
          newSched[dayId].windows.push(win);
        }
      }
    }

    setSchedule(newSched);
    setBlocked(newBlocked);
    setLoading(false);
  }, [professionalId]);

  useEffect(() => { load(); }, [load]);

  // ── Day toggle ───────────────────────────────────────────────
  function toggleDay(dayId: number) {
    setSchedule(prev => ({
      ...prev,
      [dayId]: { ...prev[dayId], enabled: !prev[dayId].enabled },
    }));
  }

  // ── Window CRUD ─────────────────────────────────────────────
  function addWindow(dayId: number) {
    setSchedule(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        windows: [
          ...prev[dayId].windows,
          { tempId: uid(), start: "09:00", end: "17:00" },
        ],
      },
    }));
  }

  function removeWindow(dayId: number, tempId: string) {
    setSchedule(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        windows: prev[dayId].windows.filter(w => w.tempId !== tempId),
      },
    }));
  }

  function updateWindow(
    dayId:  number,
    tempId: string,
    field:  "start" | "end",
    value:  string,
  ) {
    setSchedule(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        windows: prev[dayId].windows.map(w =>
          w.tempId === tempId ? { ...w, [field]: value } : w,
        ),
      },
    }));
  }

  // ── Blocked dates ────────────────────────────────────────────
  function addBlockedDate() {
    if (!newDate) return;
    if (blocked.some(b => b.date === newDate)) return; // already added
    setBlocked(prev => [...prev, { tempId: uid(), date: newDate }]);
    setNewDate("");
  }

  function removeBlockedDate(tempId: string) {
    setBlocked(prev => prev.filter(b => b.tempId !== tempId));
  }

  // ── Save ─────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setStatus("idle");
    setErrMsg("");

    const supabase = createClient();

    // Step 1: delete all existing rows
    const { error: delErr } = await supabase
      .from("availability_slots")
      .delete()
      .eq("professional_id", professionalId);

    if (delErr) {
      setErrMsg(delErr.message);
      setStatus("error");
      setSaving(false);
      return;
    }

    // Step 2: build insert payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = [];

    for (const d of DAYS) {
      const day = schedule[d.id];
      if (!day.enabled) continue;
      for (const w of day.windows) {
        if (!w.start || !w.end || w.start >= w.end) continue; // skip invalid
        rows.push({
          professional_id: professionalId,
          day_of_week:     d.id,
          start_time:      w.start,
          end_time:        w.end,
          is_blocked:      false,
        });
      }
    }

    for (const b of blocked) {
      rows.push({
        professional_id: professionalId,
        day_of_week:     null,
        start_time:      "00:00",
        end_time:        "23:59",
        is_blocked:      true,
        blocked_date:    b.date,
      });
    }

    if (rows.length > 0) {
      const { error: insErr } = await supabase
        .from("availability_slots")
        .insert(rows);

      if (insErr) {
        setErrMsg(insErr.message);
        setStatus("error");
        setSaving(false);
        return;
      }
    }

    setStatus("success");
    setSaving(false);
    setTimeout(() => setStatus("idle"), 3500);
  }

  // ── Loading skeleton ─────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          padding:        "4rem",
          color:          "var(--color-text-muted)",
        }}
      >
        <Loader2
          size={26}
          style={{ animation: "spin 1s linear infinite", color: "var(--color-primary)" }}
        />
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "680px" }}>

      {/* ── Card: Weekly schedule ─────────────────────────── */}
      <div
        style={{
          backgroundColor: "#fff",
          border:          "1.5px solid var(--color-border)",
          borderRadius:    "16px",
          overflow:        "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding:      "1.125rem 1.5rem",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <h3
            style={{
              margin:     0,
              fontWeight: 700,
              fontSize:   "1rem",
              color:      "var(--color-text)",
            }}
          >
            🗓 Εβδομαδιαίο Πρόγραμμα
          </h3>
          <p
            style={{
              margin:    "0.25rem 0 0",
              fontSize:  "0.8375rem",
              color:     "var(--color-text-muted)",
            }}
          >
            Ορίστε τις ώρες εργασίας σας για κάθε μέρα της εβδομάδας.
          </p>
        </div>

        {/* Day rows */}
        <div style={{ padding: "0.25rem 1.5rem" }}>
          {DAYS.map((day, idx) => {
            const ds = schedule[day.id];
            return (
              <div
                key={day.id}
                style={{
                  padding:      "0.875rem 0",
                  borderBottom: idx < DAYS.length - 1
                    ? "1px solid var(--color-bg-light)"
                    : "none",
                }}
              >
                {/* Day toggle row */}
                <div
                  style={{
                    display:       "flex",
                    alignItems:    "center",
                    gap:           "0.75rem",
                    marginBottom:  ds.enabled ? "0.75rem" : 0,
                  }}
                >
                  {/* Toggle switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={ds.enabled}
                    aria-label={`${day.label} ${ds.enabled ? "ανοιχτά" : "κλειστά"}`}
                    onClick={() => toggleDay(day.id)}
                    style={{
                      width:           "40px",
                      height:          "22px",
                      borderRadius:    "999px",
                      backgroundColor: ds.enabled
                        ? "var(--color-primary)"
                        : "var(--color-border)",
                      position:        "relative",
                      cursor:          "pointer",
                      border:          "none",
                      transition:      "background-color 0.2s",
                      flexShrink:      0,
                    }}
                  >
                    <span
                      style={{
                        position:        "absolute",
                        top:             "3px",
                        left:            ds.enabled ? "21px" : "3px",
                        width:           "16px",
                        height:          "16px",
                        borderRadius:    "50%",
                        backgroundColor: "#fff",
                        transition:      "left 0.2s",
                        boxShadow:       "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    />
                  </button>

                  {/* Day name */}
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize:   "0.9rem",
                      color:      ds.enabled
                        ? "var(--color-text)"
                        : "var(--color-text-muted)",
                      width:      "100px",
                      flexShrink: 0,
                    }}
                  >
                    {day.label}
                  </span>

                  {/* "Κλειστά" label when disabled */}
                  {!ds.enabled && (
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        color:    "var(--color-text-muted)",
                      }}
                    >
                      Κλειστά
                    </span>
                  )}
                </div>

                {/* Time windows (shown when enabled) */}
                {ds.enabled && (
                  <div
                    style={{
                      marginLeft:     "52px",
                      display:        "flex",
                      flexDirection:  "column",
                      gap:            "0.5rem",
                    }}
                  >
                    {ds.windows.map(w => (
                      <div
                        key={w.tempId}
                        style={{
                          display:    "flex",
                          alignItems: "center",
                          gap:        "0.5rem",
                          flexWrap:   "wrap",
                        }}
                      >
                        {/* Start time */}
                        <input
                          type="time"
                          value={w.start}
                          onChange={e =>
                            updateWindow(day.id, w.tempId, "start", e.target.value)
                          }
                          style={timeInputStyle}
                        />
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color:    "var(--color-text-muted)",
                          }}
                        >
                          —
                        </span>
                        {/* End time */}
                        <input
                          type="time"
                          value={w.end}
                          onChange={e =>
                            updateWindow(day.id, w.tempId, "end", e.target.value)
                          }
                          style={{
                            ...timeInputStyle,
                            borderColor: w.start >= w.end ? "#E74C3C" : undefined,
                          }}
                        />
                        {/* Validation hint */}
                        {w.start >= w.end && (
                          <span style={{ fontSize: "0.75rem", color: "#E74C3C" }}>
                            Η ώρα λήξης πρέπει να είναι μεταγενέστερη
                          </span>
                        )}
                        {/* Remove window (only if more than one) */}
                        {ds.windows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeWindow(day.id, w.tempId)}
                            aria-label="Αφαίρεση χρονικού παραθύρου"
                            style={iconBtnStyle}
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Add time window */}
                    <button
                      type="button"
                      onClick={() => addWindow(day.id)}
                      style={{
                        display:    "inline-flex",
                        alignItems: "center",
                        gap:        "0.25rem",
                        background: "none",
                        border:     "none",
                        cursor:     "pointer",
                        padding:    "0.25rem 0",
                        fontSize:   "0.8rem",
                        color:      "var(--color-primary)",
                        fontWeight: 600,
                        fontFamily: "inherit",
                        width:      "fit-content",
                      }}
                    >
                      <Plus size={12} />
                      Προσθήκη παραθύρου
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Card: Blocked dates ───────────────────────────── */}
      <div
        style={{
          backgroundColor: "#fff",
          border:          "1.5px solid var(--color-border)",
          borderRadius:    "16px",
          overflow:        "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding:      "1.125rem 1.5rem",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <h3
            style={{
              margin:     0,
              fontWeight: 700,
              fontSize:   "1rem",
              color:      "var(--color-text)",
            }}
          >
            🚫 Αποκλεισμένες Ημερομηνίες
          </h3>
          <p
            style={{
              margin:   "0.25rem 0 0",
              fontSize: "0.8375rem",
              color:    "var(--color-text-muted)",
            }}
          >
            Αργίες, διακοπές ή συγκεκριμένες ημέρες που δεν εργάζεστε.
          </p>
        </div>

        <div
          style={{
            padding:       "1.25rem 1.5rem",
            display:       "flex",
            flexDirection: "column",
            gap:           "1rem",
          }}
        >
          {/* Add date row */}
          <div
            style={{
              display:    "flex",
              alignItems: "center",
              gap:        "0.75rem",
              flexWrap:   "wrap",
            }}
          >
            <input
              type="date"
              value={newDate}
              min={todayISO()}
              onChange={e => setNewDate(e.target.value)}
              style={timeInputStyle}
            />
            <button
              type="button"
              onClick={addBlockedDate}
              disabled={!newDate}
              style={{
                display:         "inline-flex",
                alignItems:      "center",
                gap:             "0.375rem",
                padding:         "0.45rem 1rem",
                backgroundColor: newDate
                  ? "var(--color-primary)"
                  : "var(--color-border)",
                color:           "#fff",
                border:          "none",
                borderRadius:    "8px",
                cursor:          newDate ? "pointer" : "not-allowed",
                fontSize:        "0.875rem",
                fontWeight:      600,
                fontFamily:      "inherit",
                transition:      "background-color 0.15s",
              }}
            >
              <Plus size={14} />
              Προσθήκη
            </button>
          </div>

          {/* Blocked date chips */}
          {blocked.length === 0 ? (
            <p
              style={{
                fontSize: "0.8375rem",
                color:    "var(--color-text-muted)",
                margin:   0,
              }}
            >
              Δεν υπάρχουν αποκλεισμένες ημερομηνίες.
            </p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {[...blocked]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map(b => (
                  <div
                    key={b.tempId}
                    style={{
                      display:         "inline-flex",
                      alignItems:      "center",
                      gap:             "0.375rem",
                      padding:         "0.3rem 0.5rem 0.3rem 0.75rem",
                      backgroundColor: "#FEF2F2",
                      border:          "1.5px solid #FECACA",
                      borderRadius:    "8px",
                      fontSize:        "0.8125rem",
                      color:           "#991B1B",
                      fontWeight:      500,
                    }}
                  >
                    {new Date(b.date + "T12:00:00").toLocaleDateString("el-GR", {
                      day:   "2-digit",
                      month: "short",
                      year:  "numeric",
                    })}
                    <button
                      type="button"
                      onClick={() => removeBlockedDate(b.tempId)}
                      aria-label="Αφαίρεση"
                      style={{
                        background: "none",
                        border:     "none",
                        cursor:     "pointer",
                        padding:    0,
                        display:    "flex",
                        color:      "#991B1B",
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Status banners ───────────────────────────────────── */}
      {status === "success" && (
        <div
          style={{
            display:         "flex",
            alignItems:      "center",
            gap:             "0.5rem",
            padding:         "0.75rem 1rem",
            backgroundColor: "rgba(39,174,96,0.1)",
            border:          "1.5px solid rgba(39,174,96,0.4)",
            borderRadius:    "10px",
            color:           "#15803D",
            fontSize:        "0.875rem",
            fontWeight:      600,
          }}
        >
          <Check size={16} />
          Αποθηκεύτηκε επιτυχώς!
        </div>
      )}
      {status === "error" && (
        <div
          style={{
            display:         "flex",
            alignItems:      "center",
            gap:             "0.5rem",
            padding:         "0.75rem 1rem",
            backgroundColor: "#FEF2F2",
            border:          "1.5px solid #FECACA",
            borderRadius:    "10px",
            color:           "#991B1B",
            fontSize:        "0.875rem",
          }}
        >
          <AlertCircle size={16} />
          {errMsg || "Κάτι πήγε στραβά. Δοκίμασε ξανά."}
        </div>
      )}

      {/* ── Save button ──────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={{
          display:         "inline-flex",
          alignItems:      "center",
          justifyContent:  "center",
          gap:             "0.5rem",
          padding:         "0.75rem 2rem",
          backgroundColor: "var(--color-primary)",
          color:           "#fff",
          border:          "none",
          borderRadius:    "10px",
          fontWeight:      700,
          fontSize:        "0.9375rem",
          fontFamily:      "inherit",
          cursor:          saving ? "not-allowed" : "pointer",
          opacity:         saving ? 0.7 : 1,
          alignSelf:       "flex-start",
          transition:      "opacity 0.15s",
        }}
      >
        {saving
          ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
          : <Check size={16} />
        }
        {saving ? "Αποθήκευση…" : "Αποθήκευση Προγράμματος"}
      </button>
    </div>
  );
}

// ── Style constants ────────────────────────────────────────────

const timeInputStyle: React.CSSProperties = {
  padding:         "0.4rem 0.625rem",
  border:          "1.5px solid var(--color-border)",
  borderRadius:    "8px",
  fontSize:        "0.875rem",
  fontFamily:      "inherit",
  color:           "var(--color-text)",
  outline:         "none",
  cursor:          "pointer",
  backgroundColor: "#fff",
};

const iconBtnStyle: React.CSSProperties = {
  background:   "none",
  border:       "1px solid var(--color-border)",
  borderRadius: "6px",
  cursor:       "pointer",
  padding:      "0.2rem",
  display:      "flex",
  alignItems:   "center",
  color:        "var(--color-text-muted)",
};
