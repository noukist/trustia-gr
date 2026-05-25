// =============================================================
// components/dashboard/ServicesEditor.tsx
// =============================================================
// Client component — full CRUD for a professional's service catalog.
//
// LAYOUT
//   - Section header with title, subtitle, and "New Service" button
//   - Table of existing services (name | duration | price | actions)
//   - Each row has Edit and Delete buttons
//   - Editing a row replaces it with an inline form
//   - "New Service" button reveals an add form below the list
//   - Delete asks for confirmation inline before committing
//
// DATA
//   professional_services table — filtered by professional_id, active=true,
//   deleted_at IS NULL, ordered by sort_order.
//
// MUTATIONS
//   Add:    INSERT with auto-incremented sort_order
//   Edit:   UPDATE name_el, duration_minutes, price
//   Delete: Soft-delete — UPDATE active=false, deleted_at=now()
//
// RLS
//   The Supabase client is session-authenticated. The professional_services
//   RLS policy must allow mutations where professional_id maps to the
//   authenticated user's professional row.
// =============================================================

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Pencil, Trash2, Check, X, Loader2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient }    from "@/lib/supabase/client";

// ── Types ──────────────────────────────────────────────────────
interface Service {
  id:               string;
  name_el:          string;
  duration_minutes: number;
  price:            number | null;
  sort_order:       number;
}

interface ServicesEditorProps {
  professionalId: string;
}

// ── Duration options (minutes) ─────────────────────────────────
const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 150, 180, 240];

// ── Shared input style ─────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width:        "100%",
  padding:      "0.5rem 0.75rem",
  border:       "1.5px solid var(--color-border)",
  borderRadius: "8px",
  fontSize:     "0.875rem",
  fontFamily:   "inherit",
  outline:      "none",
  color:        "var(--color-text)",
  boxSizing:    "border-box",
};

// ── Format a duration in minutes to a Greek-friendly label ─────
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} λ.`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return h === 1 ? "1 ώρα" : `${h} ώρες`;
  return `${h}:${String(m).padStart(2, "0")} ώρα`;
}

// ── Format a price: null or 0 shows "Δωρεάν / Free" ───────────
function formatPrice(price: number | null, freeLabel: string): string {
  if (price === null || price === 0) return freeLabel;
  return `€${price.toFixed(2)}`;
}

// =============================================================
// MAIN COMPONENT
// =============================================================
export default function ServicesEditor({ professionalId }: ServicesEditorProps) {
  const t        = useTranslations("dashboard");
  const supabase = useMemo(() => createClient(), []);

  // ── State ──────────────────────────────────────────────────
  const [services,    setServices]    = useState<Service[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [globalError, setGlobalError] = useState("");

  // Add-form state
  const [showAdd,    setShowAdd]    = useState(false);
  const [addName,    setAddName]    = useState("");
  const [addDur,     setAddDur]     = useState(60);
  const [addPrice,   setAddPrice]   = useState("");
  const [addSaving,  setAddSaving]  = useState(false);

  // Edit-row state (one row at a time)
  const [editId,      setEditId]      = useState<string | null>(null);
  const [editName,    setEditName]    = useState("");
  const [editDur,     setEditDur]     = useState(60);
  const [editPrice,   setEditPrice]   = useState("");
  const [editSaving,  setEditSaving]  = useState(false);

  // Delete-confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────
  const fetchServices = useCallback(async () => {
    const { data } = await supabase
      .from("professional_services")
      .select("id, name_el, duration_minutes, price, sort_order")
      .eq("professional_id", professionalId)
      .eq("active", true)
      .is("deleted_at", null)
      .order("sort_order");
    setServices((data ?? []) as Service[]);
    setLoading(false);
  }, [professionalId, supabase]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  // ── Add ────────────────────────────────────────────────────
  async function handleAdd() {
    if (!addName.trim()) return;
    setAddSaving(true);
    setGlobalError("");

    const maxOrder = services.length > 0
      ? Math.max(...services.map((s) => s.sort_order)) + 1
      : 0;

    const { error } = await supabase
      .from("professional_services")
      .insert({
        professional_id:  professionalId,
        name_el:          addName.trim(),
        duration_minutes: addDur,
        price:            addPrice !== "" ? parseFloat(addPrice) : null,
        sort_order:       maxOrder,
        active:           true,
      });

    if (error) {
      setGlobalError(t("services.errorSave"));
    } else {
      // Reset form and close
      setAddName(""); setAddDur(60); setAddPrice(""); setShowAdd(false);
      await fetchServices();
    }
    setAddSaving(false);
  }

  // ── Edit ───────────────────────────────────────────────────
  function startEdit(svc: Service) {
    setEditId(svc.id);
    setEditName(svc.name_el);
    setEditDur(svc.duration_minutes);
    setEditPrice(svc.price !== null ? String(svc.price) : "");
    setGlobalError("");
    setDeleteId(null);   // cancel any pending delete
    setShowAdd(false);   // close add form
  }

  function cancelEdit() {
    setEditId(null);
    setGlobalError("");
  }

  async function handleSaveEdit() {
    if (!editName.trim() || !editId) return;
    setEditSaving(true);
    setGlobalError("");

    const { error } = await supabase
      .from("professional_services")
      .update({
        name_el:          editName.trim(),
        duration_minutes: editDur,
        price:            editPrice !== "" ? parseFloat(editPrice) : null,
      })
      .eq("id", editId);

    if (error) {
      setGlobalError(t("services.errorSave"));
    } else {
      setEditId(null);
      await fetchServices();
    }
    setEditSaving(false);
  }

  // ── Delete ─────────────────────────────────────────────────
  async function handleDelete(id: string) {
    setGlobalError("");

    const { error } = await supabase
      .from("professional_services")
      .update({ deleted_at: new Date().toISOString(), active: false })
      .eq("id", id);

    if (error) {
      setGlobalError(t("services.errorDelete"));
    } else {
      setDeleteId(null);
      await fetchServices();
    }
  }

  // ── Shared ghost button style ──────────────────────────────
  const ghostBtn = (color = "var(--color-text-muted)"): React.CSSProperties => ({
    display:     "inline-flex",
    alignItems:  "center",
    gap:         "0.3rem",
    background:  "none",
    border:      "none",
    cursor:      "pointer",
    padding:     "0.25rem 0.5rem",
    borderRadius:"6px",
    fontSize:    "0.8125rem",
    fontFamily:  "inherit",
    color,
    whiteSpace:  "nowrap",
  });

  // ── Small primary action button ────────────────────────────
  const actionBtn = (bg = "var(--color-primary)"): React.CSSProperties => ({
    display:         "inline-flex",
    alignItems:      "center",
    gap:             "0.3rem",
    padding:         "0.45rem 0.875rem",
    backgroundColor: bg,
    color:           "#fff",
    border:          "none",
    borderRadius:    "8px",
    fontSize:        "0.8125rem",
    fontWeight:      700,
    fontFamily:      "inherit",
    cursor:          "pointer",
    whiteSpace:      "nowrap",
  });

  // ── Render ─────────────────────────────────────────────────
  return (
    <div
      style={{
        marginTop:       "1.5rem",
        backgroundColor: "#fff",
        border:          "1.5px solid var(--color-border)",
        borderRadius:    "14px",
        padding:         "1.5rem",
      }}
    >
      {/* ── Section header ── */}
      <div
        style={{
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "flex-start",
          gap:            "1rem",
          marginBottom:   "1.25rem",
          paddingBottom:  "1rem",
          borderBottom:   "1px solid var(--color-border)",
          flexWrap:       "wrap",
        }}
      >
        <div>
          <p
            style={{
              fontWeight:   700,
              fontSize:     "0.9375rem",
              color:        "var(--color-text)",
              margin:       "0 0 0.25rem",
            }}
          >
            {t("services.title")}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>
            {t("services.subtitle")}
          </p>
        </div>

        {/* Add button — hide while add form is open */}
        {!showAdd && (
          <button
            type="button"
            onClick={() => { setShowAdd(true); setEditId(null); setDeleteId(null); }}
            style={actionBtn()}
          >
            <Plus size={14} />
            {t("services.addBtn")}
          </button>
        )}
      </div>

      {/* ── Global error banner ── */}
      {globalError && (
        <div
          style={{
            display:         "flex",
            alignItems:      "center",
            gap:             "0.5rem",
            padding:         "0.625rem 0.875rem",
            backgroundColor: "rgba(231,76,60,0.08)",
            border:          "1px solid rgba(231,76,60,0.3)",
            borderRadius:    "8px",
            color:           "#991B1B",
            fontSize:        "0.8125rem",
            marginBottom:    "1rem",
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          {globalError}
        </div>
      )}

      {/* ── Loading ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem 0" }}>
          <Loader2 size={24} style={{ color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
        </div>
      ) : services.length === 0 && !showAdd ? (

        /* ── Empty state ── */
        <div
          style={{
            textAlign:  "center",
            padding:    "2rem 1rem",
            color:      "var(--color-text-muted)",
          }}
        >
          <p style={{ fontSize: "2rem", margin: "0 0 0.75rem" }}>🛠️</p>
          <p
            style={{
              fontWeight:   700,
              color:        "var(--color-text)",
              margin:       "0 0 0.375rem",
              fontSize:     "0.9375rem",
            }}
          >
            {t("services.empty")}
          </p>
          <p style={{ fontSize: "0.8125rem", margin: 0, lineHeight: 1.6 }}>
            {t("services.emptyHint")}
          </p>
        </div>

      ) : (

        /* ── Service list ── */
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

          {/* Table header */}
          {services.length > 0 && (
            <div
              style={{
                display:             "grid",
                gridTemplateColumns: "1fr 100px 80px 80px",
                gap:                 "0.5rem",
                padding:             "0.375rem 0.5rem 0.5rem",
                fontSize:            "0.72rem",
                fontWeight:          700,
                textTransform:       "uppercase",
                letterSpacing:       "0.06em",
                color:               "var(--color-text-muted)",
                borderBottom:        "2px solid var(--color-border)",
                marginBottom:        "0.25rem",
              }}
            >
              <span>{t("services.colService")}</span>
              <span style={{ textAlign: "center" }}>{t("services.colDuration")}</span>
              <span style={{ textAlign: "right" }}>{t("services.colPrice")}</span>
              <span />
            </div>
          )}

          {/* Rows */}
          {services.map((svc) =>
            editId === svc.id ? (

              /* ── Inline edit form ── */
              <div
                key={svc.id}
                style={{
                  backgroundColor: "var(--color-primary-bg)",
                  border:          "1.5px solid var(--color-primary)",
                  borderRadius:    "10px",
                  padding:         "0.875rem",
                  marginBottom:    "0.5rem",
                  display:         "flex",
                  flexDirection:   "column",
                  gap:             "0.75rem",
                }}
              >
                <div
                  style={{
                    display:             "grid",
                    gridTemplateColumns: "1fr 120px 110px",
                    gap:                 "0.625rem",
                    alignItems:          "end",
                  }}
                >
                  {/* Name */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {t("services.nameLabel")}
                    </label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder={t("services.namePlaceholder")}
                      maxLength={100}
                      style={inputStyle}
                    />
                  </div>

                  {/* Duration */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {t("services.durationLabel")}
                    </label>
                    <select
                      value={editDur}
                      onChange={(e) => setEditDur(Number(e.target.value))}
                      style={inputStyle}
                    >
                      {DURATION_OPTIONS.map((d) => (
                        <option key={d} value={d}>{formatDuration(d)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {t("services.priceLabel")}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.50"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      placeholder={t("services.pricePlaceholder")}
                      style={inputStyle}
                    />
                    <span style={{ fontSize: "0.69rem", color: "var(--color-text-muted)" }}>
                      {t("services.priceFreeHint")}
                    </span>
                  </div>
                </div>

                {/* Save / Cancel */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={editSaving || !editName.trim()}
                    style={{
                      ...actionBtn(),
                      opacity: editSaving || !editName.trim() ? 0.6 : 1,
                      cursor:  editSaving || !editName.trim() ? "not-allowed" : "pointer",
                    }}
                  >
                    {editSaving
                      ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                      : <Check size={13} />
                    }
                    {editSaving ? t("services.saving") : t("services.saveBtn")}
                  </button>
                  <button type="button" onClick={cancelEdit} style={ghostBtn()}>
                    <X size={13} />
                    {t("services.cancelBtn")}
                  </button>
                </div>
              </div>

            ) : deleteId === svc.id ? (

              /* ── Delete confirmation row ── */
              <div
                key={svc.id}
                style={{
                  display:         "flex",
                  alignItems:      "center",
                  justifyContent:  "space-between",
                  padding:         "0.75rem 0.75rem",
                  backgroundColor: "rgba(231,76,60,0.05)",
                  border:          "1.5px solid rgba(231,76,60,0.3)",
                  borderRadius:    "10px",
                  marginBottom:    "0.375rem",
                  gap:             "1rem",
                  flexWrap:        "wrap",
                }}
              >
                <span style={{ fontSize: "0.875rem", color: "#991B1B", fontWeight: 600 }}>
                  {t("services.confirmDelete")} — {svc.name_el}
                </span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => handleDelete(svc.id)}
                    style={actionBtn("#DC2626")}
                  >
                    <Trash2 size={13} />
                    {t("services.deleteBtn")}
                  </button>
                  <button type="button" onClick={() => setDeleteId(null)} style={ghostBtn()}>
                    <X size={13} />
                    {t("services.cancelBtn")}
                  </button>
                </div>
              </div>

            ) : (

              /* ── Normal display row ── */
              <div
                key={svc.id}
                style={{
                  display:             "grid",
                  gridTemplateColumns: "1fr 100px 80px 80px",
                  gap:                 "0.5rem",
                  padding:             "0.75rem 0.5rem",
                  borderBottom:        "1px solid var(--color-border)",
                  alignItems:          "center",
                }}
              >
                {/* Service name */}
                <span
                  style={{
                    fontSize:   "0.9375rem",
                    fontWeight: 500,
                    color:      "var(--color-text)",
                    overflow:   "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {svc.name_el}
                </span>

                {/* Duration */}
                <span
                  style={{
                    fontSize:  "0.8125rem",
                    color:     "var(--color-text-muted)",
                    textAlign: "center",
                  }}
                >
                  {formatDuration(svc.duration_minutes)}
                </span>

                {/* Price */}
                <span
                  style={{
                    fontSize:   "0.875rem",
                    fontWeight: 600,
                    color:      svc.price ? "var(--color-text)" : "var(--color-text-muted)",
                    textAlign:  "right",
                  }}
                >
                  {formatPrice(svc.price, t("services.free"))}
                </span>

                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.125rem" }}>
                  <button
                    type="button"
                    onClick={() => startEdit(svc)}
                    style={ghostBtn()}
                    title={t("services.editBtn")}
                    aria-label={t("services.editBtn")}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDeleteId(svc.id); setEditId(null); }}
                    style={ghostBtn("#DC2626")}
                    title={t("services.deleteBtn")}
                    aria-label={t("services.deleteBtn")}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* ── Add form ── */}
      {showAdd && (
        <div
          style={{
            backgroundColor: "var(--color-bg-light)",
            border:          "1.5px dashed var(--color-primary)",
            borderRadius:    "10px",
            padding:         "0.875rem",
            marginTop:       services.length > 0 ? "0.75rem" : 0,
            display:         "flex",
            flexDirection:   "column",
            gap:             "0.75rem",
          }}
        >
          <div
            style={{
              display:             "grid",
              gridTemplateColumns: "1fr 120px 110px",
              gap:                 "0.625rem",
              alignItems:          "end",
            }}
          >
            {/* Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t("services.nameLabel")} *
              </label>
              <input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder={t("services.namePlaceholder")}
                maxLength={100}
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                style={inputStyle}
              />
            </div>

            {/* Duration */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t("services.durationLabel")}
              </label>
              <select
                value={addDur}
                onChange={(e) => setAddDur(Number(e.target.value))}
                style={inputStyle}
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>{formatDuration(d)}</option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t("services.priceLabel")}
              </label>
              <input
                type="number"
                min="0"
                step="0.50"
                value={addPrice}
                onChange={(e) => setAddPrice(e.target.value)}
                placeholder={t("services.pricePlaceholder")}
                style={inputStyle}
              />
              <span style={{ fontSize: "0.69rem", color: "var(--color-text-muted)" }}>
                {t("services.priceFreeHint")}
              </span>
            </div>
          </div>

          {/* Save / Cancel */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={handleAdd}
              disabled={addSaving || !addName.trim()}
              style={{
                ...actionBtn(),
                opacity: addSaving || !addName.trim() ? 0.6 : 1,
                cursor:  addSaving || !addName.trim() ? "not-allowed" : "pointer",
              }}
            >
              {addSaving
                ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                : <Plus size={13} />
              }
              {addSaving ? t("services.saving") : t("services.saveBtn")}
            </button>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setAddName(""); setAddDur(60); setAddPrice(""); }}
              style={ghostBtn()}
            >
              <X size={13} />
              {t("services.cancelBtn")}
            </button>
          </div>
        </div>
      )}

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
