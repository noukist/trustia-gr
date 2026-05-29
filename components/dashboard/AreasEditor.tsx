// =============================================================
// components/dashboard/AreasEditor.tsx
// =============================================================
// Dashboard editor for the areas a professional serves.
//
// DATA MODEL
//   professional_areas (professional_id, area_id) — junction table.
//   RLS: pro_areas_manage_own allows the professional to INSERT/DELETE
//   their own rows.
//
// UX
//   Areas are grouped by region. Each region has a header with a
//   "select all" toggle. Individual area chips can be toggled.
//   Save replaces all rows (delete + insert).
// =============================================================

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient }  from "@/lib/supabase/client";
import { REGIONS }       from "@/lib/constants";
import { Check, Loader2, AlertCircle, MapPin } from "lucide-react";

export default function AreasEditor({
  professionalId,
}: {
  professionalId: string;
}) {
  // Set of area IDs currently selected
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [loading,  setLoading]    = useState(true);
  const [saving,   setSaving]     = useState(false);
  const [status,   setStatus]     = useState<"idle" | "success" | "error">("idle");
  const [errMsg,   setErrMsg]     = useState("");

  // ── Load existing areas ──────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("professional_areas")
      .select("area_id")
      .eq("professional_id", professionalId);

    setSelected(new Set((data ?? []).map((r) => r.area_id as string)));
    setLoading(false);
  }, [professionalId]);

  useEffect(() => { load(); }, [load]);

  // ── Toggle a single area ─────────────────────────────────────
  function toggleArea(areaId: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(areaId) ? next.delete(areaId) : next.add(areaId);
      return next;
    });
  }

  // ── Toggle all areas in a region ────────────────────────────
  function toggleRegion(regionId: string) {
    const regionAreaIds = REGIONS
      .find(r => r.id === regionId)
      ?.municipalities.flatMap(m => m.areas.map(a => a.id)) ?? [];

    const allSelected = regionAreaIds.every(id => selected.has(id));

    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) {
        regionAreaIds.forEach(id => next.delete(id));
      } else {
        regionAreaIds.forEach(id => next.add(id));
      }
      return next;
    });
  }

  // ── Save ─────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setStatus("idle");
    setErrMsg("");

    const supabase = createClient();

    // Delete all existing rows for this professional
    const { error: delErr } = await supabase
      .from("professional_areas")
      .delete()
      .eq("professional_id", professionalId);

    if (delErr) {
      setErrMsg(delErr.message);
      setStatus("error");
      setSaving(false);
      return;
    }

    // Insert selected areas
    if (selected.size > 0) {
      const rows = [...selected].map(areaId => ({
        professional_id: professionalId,
        area_id:         areaId,
      }));

      const { error: insErr } = await supabase
        .from("professional_areas")
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--color-primary)" }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* ── Intro ── */}
      <div
        style={{
          backgroundColor: "var(--color-primary-bg)",
          border:          "1.5px solid var(--color-primary)",
          borderRadius:    "12px",
          padding:         "0.875rem 1rem",
          display:         "flex",
          gap:             "0.625rem",
          alignItems:      "flex-start",
        }}
      >
        <MapPin size={16} style={{ color: "var(--color-primary)", flexShrink: 0, marginTop: "2px" }} />
        <p style={{ fontSize: "0.8375rem", color: "var(--color-primary)", margin: 0, lineHeight: 1.5 }}>
          Επίλεξε τις περιοχές που εξυπηρετείς. Εμφανίζεσαι στις αναζητήσεις μόνο για τις επιλεγμένες περιοχές.
          {selected.size > 0 && (
            <strong> ({selected.size} επιλεγμένες)</strong>
          )}
        </p>
      </div>

      {/* ── Region cards ── */}
      {REGIONS.map(region => {
        const regionAreaIds = region.municipalities.flatMap(m => m.areas.map(a => a.id));
        const selectedInRegion = regionAreaIds.filter(id => selected.has(id)).length;
        const allInRegion = selectedInRegion === regionAreaIds.length;

        return (
          <div
            key={region.id}
            style={{
              backgroundColor: "#fff",
              border:          "1.5px solid var(--color-border)",
              borderRadius:    "14px",
              overflow:        "hidden",
            }}
          >
            {/* Region header with select-all toggle */}
            <div
              style={{
                padding:        "0.875rem 1.25rem",
                borderBottom:   "1px solid var(--color-border)",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "space-between",
                gap:            "0.5rem",
              }}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text)" }}>
                  {region.name}
                </span>
                <span style={{ marginLeft: "0.5rem", fontSize: "0.775rem", color: "var(--color-text-muted)" }}>
                  {selectedInRegion}/{regionAreaIds.length} επιλεγμένες
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggleRegion(region.id)}
                style={{
                  padding:         "0.3rem 0.75rem",
                  border:          `1.5px solid ${allInRegion ? "var(--color-primary)" : "var(--color-border)"}`,
                  borderRadius:    "8px",
                  backgroundColor: allInRegion ? "var(--color-primary)" : "transparent",
                  color:           allInRegion ? "#fff" : "var(--color-text-muted)",
                  fontSize:        "0.775rem",
                  fontWeight:      600,
                  fontFamily:      "inherit",
                  cursor:          "pointer",
                  transition:      "all 0.15s",
                  whiteSpace:      "nowrap",
                  flexShrink:      0,
                }}
              >
                {allInRegion ? "Αποεπιλογή όλων" : "Επιλογή όλων"}
              </button>
            </div>

            {/* Municipalities + area chips */}
            <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {region.municipalities.map(muni => (
                <div key={muni.id}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.5rem" }}>
                    {muni.name.replace("Δήμος ", "")}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                    {muni.areas.map(area => {
                      const isOn = selected.has(area.id);
                      return (
                        <button
                          key={area.id}
                          type="button"
                          onClick={() => toggleArea(area.id)}
                          style={{
                            display:         "inline-flex",
                            alignItems:      "center",
                            gap:             "0.25rem",
                            padding:         "0.3rem 0.75rem",
                            border:          `1.5px solid ${isOn ? "var(--color-primary)" : "var(--color-border)"}`,
                            borderRadius:    "99px",
                            backgroundColor: isOn ? "var(--color-primary)" : "#fff",
                            color:           isOn ? "#fff" : "var(--color-text)",
                            fontSize:        "0.8125rem",
                            fontWeight:      isOn ? 700 : 500,
                            fontFamily:      "inherit",
                            cursor:          "pointer",
                            transition:      "all 0.12s",
                          }}
                        >
                          {isOn && <Check size={11} />}
                          {area.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* ── Status banners ── */}
      {status === "success" && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", backgroundColor: "rgba(39,174,96,0.1)", border: "1.5px solid rgba(39,174,96,0.4)", borderRadius: "10px", color: "#15803D", fontSize: "0.875rem", fontWeight: 600 }}>
          <Check size={16} /> Αποθηκεύτηκε επιτυχώς!
        </div>
      )}
      {status === "error" && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", backgroundColor: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: "10px", color: "#991B1B", fontSize: "0.875rem" }}>
          <AlertCircle size={16} /> {errMsg || "Κάτι πήγε στραβά. Δοκίμασε ξανά."}
        </div>
      )}

      {/* ── Save button ── */}
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
        {saving ? "Αποθήκευση…" : "Αποθήκευση Περιοχών"}
      </button>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
