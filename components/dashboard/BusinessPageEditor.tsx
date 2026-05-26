// =============================================================
// components/dashboard/BusinessPageEditor.tsx
// =============================================================
// Dashboard tab for creating / editing the professional's
// business page (PRD §15).
//
// SECTIONS
//   1. Basic info  — business_name, slug, about
//   2. Media       — cover photo (1200px banner), logo (400x400)
//   3. Team        — add / remove team members (name, role, photo)
//
// STORAGE
//   Images upload to the "business" Supabase Storage bucket.
//   Path: business/{professionalId}/cover.{ext}
//         business/{professionalId}/logo.{ext}
//         business/{professionalId}/team/{memberId}.{ext}
//
// UPSERT STRATEGY
//   business_pages: upsert on professional_id conflict
//   team_members:   delete-and-reinsert on save
// =============================================================

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Building2, Upload, X, Plus, Loader2, Check, AlertCircle, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────

interface TeamMember {
  tempId:    string;
  name:      string;
  role:      string;
  photoUrl:  string | null;
  photoFile: File | null;    // pending upload
}

interface BusinessPageData {
  id:            string | null;
  businessName:  string;
  slug:          string;
  about:         string;
  coverUrl:      string | null;
  logoUrl:       string | null;
  teamMembers:   TeamMember[];
}

// ── Helpers ───────────────────────────────────────────────────

function tempId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── Component ─────────────────────────────────────────────────

export default function BusinessPageEditor({
  professionalId,
}: {
  professionalId: string;
}) {
  const supabase = createClient();

  const [data,    setData]    = useState<BusinessPageData>({
    id:           null,
    businessName: "",
    slug:         "",
    about:        "",
    coverUrl:     null,
    logoUrl:      null,
    teamMembers:  [],
  });

  const [coverFile,   setCoverFile]   = useState<File | null>(null);
  const [logoFile,    setLogoFile]    = useState<File | null>(null);
  const [coverPreview,  setCoverPreview]  = useState<string | null>(null);
  const [logoPreview,   setLogoPreview]   = useState<string | null>(null);

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [slugTaken, setSlugTaken] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef  = useRef<HTMLInputElement>(null);

  // ── Load existing data ────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    const { data: bp } = await supabase
      .from("business_pages")
      .select("id, business_name, slug, about, cover_url, logo_url")
      .eq("professional_id", professionalId)
      .maybeSingle();

    let teamMembers: TeamMember[] = [];
    if (bp?.id) {
      const { data: tm } = await supabase
        .from("team_members")
        .select("id, name, role, photo_url, sort_order")
        .eq("business_page_id", bp.id)
        .order("sort_order");

      teamMembers = (tm ?? []).map((m) => ({
        tempId:    m.id,
        name:      m.name,
        role:      m.role ?? "",
        photoUrl:  m.photo_url ?? null,
        photoFile: null,
      }));
    }

    if (bp) {
      setData({
        id:           bp.id,
        businessName: bp.business_name,
        slug:         bp.slug ?? "",
        about:        bp.about ?? "",
        coverUrl:     bp.cover_url ?? null,
        logoUrl:      bp.logo_url ?? null,
        teamMembers,
      });
    }
    setLoading(false);
  }, [professionalId, supabase]);

  useEffect(() => { load(); }, [load]);

  // ── Slug auto-generate from business name ─────────────────
  function handleBusinessNameChange(name: string) {
    setData((d) => ({
      ...d,
      businessName: name,
      // Only auto-set slug if it hasn't been manually edited
      slug: d.slug === slugify(d.businessName) || d.slug === ""
        ? slugify(name)
        : d.slug,
    }));
    setSlugTaken(false);
  }

  // ── Image preview on file select ─────────────────────────
  function handleCoverChange(file: File | null) {
    setCoverFile(file);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  }

  function handleLogoChange(file: File | null) {
    setLogoFile(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  }

  // ── Team member helpers ───────────────────────────────────
  function addMember() {
    setData((d) => ({
      ...d,
      teamMembers: [
        ...d.teamMembers,
        { tempId: tempId(), name: "", role: "", photoUrl: null, photoFile: null },
      ],
    }));
  }

  function updateMember(tid: string, patch: Partial<TeamMember>) {
    setData((d) => ({
      ...d,
      teamMembers: d.teamMembers.map((m) => m.tempId === tid ? { ...m, ...patch } : m),
    }));
  }

  function removeMember(tid: string) {
    setData((d) => ({
      ...d,
      teamMembers: d.teamMembers.filter((m) => m.tempId !== tid),
    }));
  }

  // ── Upload helper ─────────────────────────────────────────
  async function uploadFile(
    file: File,
    path: string,
  ): Promise<string | null> {
    const { data: up, error } = await supabase.storage
      .from("business")
      .upload(path, file, { upsert: true });
    if (error || !up) { console.error("[BusinessPageEditor] upload:", error); return null; }

    const { data: { publicUrl } } = supabase.storage
      .from("business")
      .getPublicUrl(up.path);
    return publicUrl;
  }

  // ── Save ──────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!data.businessName.trim()) return;
    setSaving(true);
    setSaveStatus("idle");
    setSlugTaken(false);

    try {
      // ── 1. Upload cover if changed ──────────────────────
      let finalCoverUrl = data.coverUrl;
      if (coverFile) {
        const ext = coverFile.name.split(".").pop() ?? "jpg";
        finalCoverUrl = await uploadFile(coverFile, `${professionalId}/cover.${ext}`);
      }

      // ── 2. Upload logo if changed ───────────────────────
      let finalLogoUrl = data.logoUrl;
      if (logoFile) {
        const ext = logoFile.name.split(".").pop() ?? "jpg";
        finalLogoUrl = await uploadFile(logoFile, `${professionalId}/logo.${ext}`);
      }

      // ── 3. Upsert business_pages row ────────────────────
      const slugVal = data.slug.trim() || slugify(data.businessName);
      const payload = {
        professional_id: professionalId,
        business_name:   data.businessName.trim(),
        slug:            slugVal,
        about:           data.about.trim() || null,
        cover_url:       finalCoverUrl,
        logo_url:        finalLogoUrl,
        updated_at:      new Date().toISOString(),
      };

      let bpId = data.id;

      if (bpId) {
        const { error } = await supabase
          .from("business_pages")
          .update(payload)
          .eq("id", bpId);
        if (error) {
          if (error.message.includes("unique") || error.code === "23505") {
            setSlugTaken(true);
            setSaveStatus("error");
            return;
          }
          throw error;
        }
      } else {
        const { data: inserted, error } = await supabase
          .from("business_pages")
          .insert(payload)
          .select("id")
          .single();
        if (error) {
          if (error.message.includes("unique") || error.code === "23505") {
            setSlugTaken(true);
            setSaveStatus("error");
            return;
          }
          throw error;
        }
        bpId = inserted.id;
        setData((d) => ({ ...d, id: bpId }));
      }

      // ── 4. Delete-and-reinsert team members ─────────────
      await supabase.from("team_members").delete().eq("business_page_id", bpId);

      const validMembers = data.teamMembers.filter((m) => m.name.trim());
      for (let i = 0; i < validMembers.length; i++) {
        const m = validMembers[i];
        let photoUrl = m.photoUrl;
        if (m.photoFile) {
          const ext = m.photoFile.name.split(".").pop() ?? "jpg";
          photoUrl = await uploadFile(m.photoFile, `${professionalId}/team/${m.tempId}.${ext}`);
        }
        await supabase.from("team_members").insert({
          business_page_id: bpId,
          name:             m.name.trim(),
          role:             m.role.trim() || null,
          photo_url:        photoUrl,
          sort_order:       i,
        });
      }

      // ── 5. Sync final URLs back to state ─────────────────
      setData((d) => ({
        ...d,
        slug:     slugVal,
        coverUrl: finalCoverUrl,
        logoUrl:  finalLogoUrl,
      }));
      setCoverFile(null);
      setLogoFile(null);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2500);

    } catch (err) {
      console.error("[BusinessPageEditor] save error:", err);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }, [data, coverFile, logoFile, professionalId, supabase]);

  // ── Loading skeleton ──────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
        <Loader2 size={28} style={{ color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trustia.gr";
  const publicUrl = data.slug ? `${baseUrl}/business/${data.slug}` : null;

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text)", margin: "0 0 0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Building2 size={20} style={{ color: "var(--color-primary)" }} />
            Σελίδα Επιχείρησης
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: 0 }}>
            Δημιούργησε μια αναλυτική σελίδα για την επιχείρησή σου με εξώφυλλο, λογότυπο και ομάδα.
          </p>
          {publicUrl && (
            <a href={publicUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: "0.8rem", color: "var(--color-primary)", marginTop: "0.25rem", display: "inline-block", textDecoration: "none" }}>
              🔗 {publicUrl}
            </a>
          )}
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !data.businessName.trim()}
          style={{
            display:         "inline-flex",
            alignItems:      "center",
            gap:             "0.375rem",
            padding:         "0.625rem 1.5rem",
            backgroundColor: saving || !data.businessName.trim() ? "var(--color-border)" : "var(--color-primary)",
            color:           "#fff",
            border:          "none",
            borderRadius:    "10px",
            fontWeight:      700,
            fontSize:        "0.9rem",
            fontFamily:      "inherit",
            cursor:          saving || !data.businessName.trim() ? "default" : "pointer",
            flexShrink:      0,
          }}
        >
          {saving ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={15} />}
          {saving ? "Αποθήκευση…" : "Αποθήκευση"}
        </button>
      </div>

      {/* Status banner */}
      {saveStatus === "success" && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", backgroundColor: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.25)", borderRadius: "10px", color: "#059669", fontSize: "0.875rem", fontWeight: 600 }}>
          <Check size={16} /> Αποθηκεύτηκε επιτυχώς!
        </div>
      )}
      {saveStatus === "error" && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", backgroundColor: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)", borderRadius: "10px", color: "#DC2626", fontSize: "0.875rem", fontWeight: 600 }}>
          <AlertCircle size={16} />
          {slugTaken ? "Αυτό το slug χρησιμοποιείται ήδη. Επίλεξε διαφορετικό." : "Κάτι πήγε στραβά. Δοκίμασε ξανά."}
        </div>
      )}

      {/* ── Section 1: Basic info ── */}
      <div style={{ backgroundColor: "#fff", border: "1.5px solid var(--color-border)", borderRadius: "14px", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text)", margin: 0 }}>Βασικά στοιχεία</h3>

        {/* Business name */}
        <div>
          <label style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)", marginBottom: "0.375rem" }}>
            Όνομα επιχείρησης <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <input
            type="text"
            value={data.businessName}
            onChange={(e) => handleBusinessNameChange(e.target.value)}
            placeholder="π.χ. Κομμωτήριο Αθηνά"
            maxLength={100}
            style={{
              width: "100%", padding: "0.625rem 0.875rem",
              border: "1.5px solid var(--color-border)", borderRadius: "8px",
              fontSize: "0.9375rem", fontFamily: "inherit", outline: "none",
              color: "var(--color-text)", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Slug */}
        <div>
          <label style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)", marginBottom: "0.375rem" }}>
            URL σελίδας
          </label>
          <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--color-border)", borderRadius: "8px", overflow: "hidden" }}>
            <span style={{ padding: "0.625rem 0.75rem", backgroundColor: "var(--color-bg-light)", color: "var(--color-text-muted)", fontSize: "0.8rem", borderRight: "1px solid var(--color-border)", whiteSpace: "nowrap" }}>
              trustia.gr/business/
            </span>
            <input
              type="text"
              value={data.slug}
              onChange={(e) => { setData((d) => ({ ...d, slug: slugify(e.target.value) })); setSlugTaken(false); }}
              placeholder="onoma-epixeirishs"
              maxLength={80}
              style={{ flex: 1, padding: "0.625rem 0.75rem", border: "none", outline: "none", fontSize: "0.9rem", fontFamily: "inherit", color: "var(--color-text)" }}
            />
          </div>
        </div>

        {/* About */}
        <div>
          <label style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)", marginBottom: "0.375rem" }}>
            Περιγραφή επιχείρησης
          </label>
          <textarea
            value={data.about}
            onChange={(e) => setData((d) => ({ ...d, about: e.target.value }))}
            rows={5}
            placeholder="Παρουσίασε την επιχείρησή σου, τις υπηρεσίες σου, την εμπειρία σου…"
            maxLength={2000}
            style={{
              width: "100%", padding: "0.75rem",
              border: "1.5px solid var(--color-border)", borderRadius: "8px",
              fontSize: "0.9375rem", fontFamily: "inherit", lineHeight: 1.6,
              resize: "vertical", outline: "none", color: "var(--color-text)",
              boxSizing: "border-box",
            }}
          />
          <p style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0.2rem 0 0" }}>
            {data.about.length} / 2000
          </p>
        </div>
      </div>

      {/* ── Section 2: Media ── */}
      <div style={{ backgroundColor: "#fff", border: "1.5px solid var(--color-border)", borderRadius: "14px", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text)", margin: 0 }}>Εικόνες</h3>

        {/* Cover photo */}
        <div>
          <label style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)", marginBottom: "0.5rem" }}>
            Εξώφυλλο <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(1200 × 400 px)</span>
          </label>
          <div
            onClick={() => coverInputRef.current?.click()}
            style={{
              width: "100%", height: "140px", borderRadius: "10px",
              border: "2px dashed var(--color-border)",
              backgroundImage: (coverPreview ?? data.coverUrl) ? `url(${coverPreview ?? data.coverUrl})` : undefined,
              backgroundSize: "cover", backgroundPosition: "center",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", overflow: "hidden", position: "relative",
              backgroundColor: "var(--color-bg-light)",
            }}
          >
            {!(coverPreview ?? data.coverUrl) && (
              <div style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
                <Upload size={24} style={{ margin: "0 auto 0.375rem" }} />
                <p style={{ fontSize: "0.8rem", margin: 0 }}>Κλικ για ανέβασμα</p>
              </div>
            )}
            {(coverPreview ?? data.coverUrl) && (
              <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "0"; }}
              >
                <Upload size={20} style={{ color: "#fff" }} />
              </div>
            )}
          </div>
          <input ref={coverInputRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => handleCoverChange(e.target.files?.[0] ?? null)} />
        </div>

        {/* Logo */}
        <div>
          <label style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)", marginBottom: "0.5rem" }}>
            Λογότυπο <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(400 × 400 px)</span>
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              onClick={() => logoInputRef.current?.click()}
              style={{
                width: "80px", height: "80px", borderRadius: "12px",
                border: "2px dashed var(--color-border)",
                backgroundImage: (logoPreview ?? data.logoUrl) ? `url(${logoPreview ?? data.logoUrl})` : undefined,
                backgroundSize: "cover", backgroundPosition: "center",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0, backgroundColor: "var(--color-bg-light)",
              }}
            >
              {!(logoPreview ?? data.logoUrl) && <Upload size={18} style={{ color: "var(--color-text-muted)" }} />}
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.5 }}>
              Τετράγωνη εικόνα.<br />Εμφανίζεται δίπλα στο όνομα της επιχείρησης.
            </p>
          </div>
          <input ref={logoInputRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)} />
        </div>
      </div>

      {/* ── Section 3: Team members ── */}
      <div style={{ backgroundColor: "#fff", border: "1.5px solid var(--color-border)", borderRadius: "14px", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Users size={16} style={{ color: "var(--color-primary)" }} />
            Ομάδα
          </h3>
          <button
            type="button"
            onClick={addMember}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.375rem",
              padding: "0.4rem 0.875rem",
              backgroundColor: "var(--color-primary-bg)", color: "var(--color-primary)",
              border: "1px solid var(--color-primary)", borderRadius: "8px",
              fontSize: "0.8125rem", fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
            }}
          >
            <Plus size={14} /> Προσθήκη μέλους
          </button>
        </div>

        {data.teamMembers.length === 0 && (
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: 0 }}>
            Δεν έχεις προσθέσει μέλη ομάδας ακόμα.
          </p>
        )}

        {data.teamMembers.map((member) => (
          <TeamMemberRow
            key={member.tempId}
            member={member}
            onChange={(patch) => updateMember(member.tempId, patch)}
            onRemove={() => removeMember(member.tempId)}
          />
        ))}
      </div>

    </div>
  );
}

// ── TeamMemberRow sub-component ────────────────────────────────

function TeamMemberRow({
  member,
  onChange,
  onRemove,
}: {
  member:   TeamMember;
  onChange: (patch: Partial<TeamMember>) => void;
  onRemove: () => void;
}) {
  const photoRef = useRef<HTMLInputElement>(null);
  const preview  = member.photoFile ? URL.createObjectURL(member.photoFile) : member.photoUrl;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.875rem",
      padding: "0.875rem", border: "1.5px solid var(--color-border)",
      borderRadius: "10px", backgroundColor: "var(--color-bg-light)",
    }}>
      {/* Photo */}
      <div
        onClick={() => photoRef.current?.click()}
        style={{
          width: "48px", height: "48px", borderRadius: "50%",
          backgroundImage: preview ? `url(${preview})` : undefined,
          backgroundSize: "cover", backgroundPosition: "center",
          border: "2px dashed var(--color-border)", cursor: "pointer",
          flexShrink: 0, display: "flex", alignItems: "center",
          justifyContent: "center", backgroundColor: "#fff",
        }}
      >
        {!preview && <Upload size={14} style={{ color: "var(--color-text-muted)" }} />}
      </div>
      <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => onChange({ photoFile: e.target.files?.[0] ?? null })} />

      {/* Fields */}
      <div style={{ flex: 1, display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input
          type="text"
          value={member.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Όνομα"
          maxLength={60}
          style={{ flex: "1 1 120px", padding: "0.5rem 0.625rem", border: "1.5px solid var(--color-border)", borderRadius: "7px", fontSize: "0.875rem", fontFamily: "inherit", outline: "none", color: "var(--color-text)" }}
        />
        <input
          type="text"
          value={member.role}
          onChange={(e) => onChange({ role: e.target.value })}
          placeholder="Ρόλος (π.χ. Κομμωτής)"
          maxLength={60}
          style={{ flex: "1 1 140px", padding: "0.5rem 0.625rem", border: "1.5px solid var(--color-border)", borderRadius: "7px", fontSize: "0.875rem", fontFamily: "inherit", outline: "none", color: "var(--color-text)" }}
        />
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem", color: "var(--color-text-muted)", flexShrink: 0 }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
