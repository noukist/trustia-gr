// =============================================================
// components/dashboard/ProfileEditor.tsx
// =============================================================
// Dashboard tab for editing the professional's public profile.
// Handles: photo upload, all form fields, booking mode, save.
//
// DATA FLOW
//   Parent (Server Component) fetches the professional row and
//   passes it as `initialData`. This component manages its own
//   local state so changes don't trigger a full server re-render
//   until the user explicitly saves.
//
// AVATAR UPLOAD
//   Supabase Storage bucket: "avatars" (public)
//   Path:  {userId}/profile.jpg
//   RLS:   storage.foldername(name)[1] must equal auth.uid()
//   The same user_id used in auth is the first path segment, so
//   any authenticated user can upload only to their own folder.
//
// SAVE
//   Updates the `professionals` row and recalculates
//   profile_complete based on required fields.
// =============================================================

"use client";

import React, { useState, useRef, useCallback } from "react";
import { Check, AlertCircle, Camera, Loader2, Info } from "lucide-react";
import { createClient }       from "@/lib/supabase/client";
import Input                  from "@/components/ui/Input";
import Button                 from "@/components/ui/Button";
import LocationAutocomplete   from "@/components/ui/LocationAutocomplete";
import { CATEGORIES }         from "@/lib/constants";
import type { LocationResult } from "@/components/ui/LocationAutocomplete";

// ── Types ──────────────────────────────────────────────────────
interface InitialData {
  first_name:      string;
  last_name:       string;
  phone:           string;
  email:           string;
  avatar_url:      string | null;
  category_id:     string;
  tier:            string;
  city:            string | null;
  lat:             number | null;
  lng:             number | null;
  bio:             string | null;
  price_text:      string | null;
  booking_mode:    "contact" | "date" | "full";
  profile_complete: boolean;
}

interface ProfileEditorProps {
  professionalId: string;     // professionals.id — used for UPDATE
  userId:         string;     // auth user id — used for avatar storage path
  initialData:    InitialData;
  /** True when the account was created via Google / Facebook OAuth */
  isOAuthAccount: boolean;
}

// ── Booking mode options ──────────────────────────────────────
const BOOKING_MODES = [
  {
    value: "contact" as const,
    emoji: "📞",
    title: "Μόνο Τηλέφωνο",
    desc:  "Οι πελάτες βλέπουν τα στοιχεία σας και σας καλούν.",
  },
  {
    value: "date" as const,
    emoji: "📅",
    title: "Κράτηση Ημερομηνίας",
    desc:  "Οι πελάτες επιλέγουν ημερομηνία, εσείς επιβεβαιώνετε.",
  },
  {
    value: "full" as const,
    emoji: "🗓️",
    title: "Πλήρες Ημερολόγιο",
    desc:  "Κατάλογος υπηρεσιών, τιμές, ωράριο.",
    note: "Απαιτεί Επιχειρηματική Σελίδα",
  },
] as const;

// ── Profile completion (mirrors dashboard/page.tsx calcCompletion) ──
function calcCompletion(data: {
  avatar_url:  string | null;
  bio:         string;
  price_text:  string;
}): { percent: number; missing: string[] } {
  const base     = 50;
  const checks   = [
    { done: !!data.avatar_url,                    label: "Φωτογραφία προφίλ" },
    { done: data.bio.trim().length > 5,           label: "Βιογραφικό"         },
    { done: !!data.price_text.trim(),             label: "Τιμή υπηρεσίας"     },
  ];
  const weights  = [20, 20, 10];
  const bonus    = checks.reduce((s, c, i) => s + (c.done ? weights[i] : 0), 0);
  const missing  = checks.filter((c) => !c.done).map((c) => c.label);
  return { percent: base + bonus, missing };
}

// ── Tiny progress bar ─────────────────────────────────────────
function ProgressBar({ value, color = "var(--color-primary)" }: { value: number; color?: string }) {
  return (
    <div
      style={{
        width:           "100%",
        height:          "8px",
        borderRadius:    "999px",
        backgroundColor: "var(--color-bg-light)",
        border:          "1px solid var(--color-border)",
        overflow:        "hidden",
      }}
    >
      <div
        style={{
          width:           `${value}%`,
          height:          "100%",
          borderRadius:    "999px",
          backgroundColor: color,
          transition:      "width 0.4s ease",
        }}
      />
    </div>
  );
}

// ── Toast notification ────────────────────────────────────────
function Toast({ type, onClose }: { type: "success" | "error"; onClose: () => void }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position:        "fixed",
        bottom:          "calc(1.5rem + 58px)", // above mobile tab bar
        right:           "1.5rem",
        zIndex:          300,
        display:         "flex",
        alignItems:      "center",
        gap:             "0.625rem",
        padding:         "0.875rem 1.25rem",
        backgroundColor: type === "success" ? "#166534" : "#991B1B",
        color:           "#fff",
        borderRadius:    "12px",
        boxShadow:       "0 8px 24px rgba(0,0,0,0.2)",
        fontSize:        "0.9rem",
        fontWeight:      600,
        maxWidth:        "340px",
      }}
    >
      {type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
      {type === "success"
        ? "Το προφίλ ενημερώθηκε!"
        : "Σφάλμα. Παρακαλώ δοκιμάστε ξανά."}
    </div>
  );
}

// ── Initials avatar (fallback) ─────────────────────────────────
function InitialsAvatar({ firstName, lastName }: { firstName: string; lastName: string }) {
  const text   = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const colors = ["var(--color-primary)", "#1A6F6F", "#D4A039", "#27AE60", "#8B5CF6"];
  const idx    = (firstName.charCodeAt(0) + lastName.charCodeAt(0)) % colors.length;
  return (
    <div
      aria-label={`Αρχικά: ${text}`}
      style={{
        width:           "96px",
        height:          "96px",
        borderRadius:    "50%",
        backgroundColor: colors[idx],
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        color:           "#fff",
        fontSize:        "2rem",
        fontWeight:      800,
        userSelect:      "none",
        flexShrink:      0,
      }}
    >
      {text}
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────
function FieldGroup({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <label
        style={{
          fontSize:   "0.8125rem",
          fontWeight: 600,
          color:      "var(--color-text)",
        }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

// =============================================================
// MAIN COMPONENT
// =============================================================
export default function ProfileEditor({
  professionalId,
  userId,
  initialData,
  isOAuthAccount,
}: ProfileEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase     = createClient();

  // ── Local form state (mirrors DB row) ─────────────────────
  const [form, setForm] = useState({
    first_name:   initialData.first_name,
    last_name:    initialData.last_name,
    phone:        initialData.phone,
    email:        initialData.email,
    avatar_url:   initialData.avatar_url,
    city:         initialData.city ?? "",
    lat:          initialData.lat,
    lng:          initialData.lng,
    bio:          initialData.bio ?? "",
    price_text:   initialData.price_text ?? "",
    booking_mode: initialData.booking_mode,
  });

  // ── UI states ─────────────────────────────────────────────
  const [isSaving,       setIsSaving]       = useState(false);
  const [isUploading,    setIsUploading]    = useState(false);
  const [uploadError,    setUploadError]    = useState<string | null>(null);
  const [toast,          setToast]          = useState<"success" | "error" | null>(null);
  const [showCatNote,    setShowCatNote]    = useState(false);
  const [errors,         setErrors]         = useState<Record<string, string>>({});

  // ── Derived: completion ───────────────────────────────────
  const completion = calcCompletion({
    avatar_url: form.avatar_url,
    bio:        form.bio,
    price_text: form.price_text,
  });

  const cat = CATEGORIES.find((c) => c.id === initialData.category_id);

  // ── Helpers ───────────────────────────────────────────────
  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => { const e = { ...prev }; delete e[key]; return e; });
  }

  function showToast(type: "success" | "error") {
    setToast(type);
    setTimeout(() => setToast(null), 3500);
  }

  // ── Validation ────────────────────────────────────────────
  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.first_name.trim())  e.first_name = "Υποχρεωτικό πεδίο";
    if (!form.last_name.trim())   e.last_name  = "Υποχρεωτικό πεδίο";
    if (!form.phone.trim())       e.phone      = "Υποχρεωτικό πεδίο";
    if (!form.city.trim())        e.city       = "Επέλεξε πόλη";
    if (form.bio.length > 500)    e.bio        = "Μέγιστο 500 χαρακτήρες";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Avatar upload ─────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation (5MB, image types)
    const MAX_BYTES     = 5 * 1024 * 1024;
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError("Επιτρεπόμενοι τύποι: JPG, PNG, WebP");
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError("Μέγιστο μέγεθος αρχείου: 5 MB");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      // Preview immediately using an object URL so the user gets
      // instant visual feedback before the upload completes.
      const previewUrl = URL.createObjectURL(file);
      setField("avatar_url", previewUrl);

      // Upload to Supabase Storage.
      // Path format:  avatars/{userId}/profile.jpg
      // upsert: true  → overwrites any existing photo at this path.
      const storagePath = `${userId}/profile.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(storagePath, file, {
          contentType: file.type,
          upsert:      true,
        });

      if (uploadErr) throw uploadErr;

      // Build the public CDN URL for the new photo.
      // Add a cache-busting timestamp so browsers don't serve the old image.
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(storagePath);

      const timedUrl = `${publicUrl}?t=${Date.now()}`;
      setField("avatar_url", timedUrl);

      // Revoke the blob URL now that we have the real one
      URL.revokeObjectURL(previewUrl);
    } catch (err) {
      console.error("[ProfileEditor] avatar upload error:", err);
      setUploadError("Αποτυχία μεταφόρτωσης. Δοκιμάστε ξανά.");
      // Roll back to the previous avatar
      setField("avatar_url", initialData.avatar_url);
    } finally {
      setIsUploading(false);
      // Reset file input so the user can re-upload the same file
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ── Location select ───────────────────────────────────────
  const handleLocationSelect = useCallback((loc: LocationResult) => {
    setForm((prev) => ({
      ...prev,
      city: loc.displayName,
      lat:  loc.lat,
      lng:  loc.lng,
    }));
    if (errors.city) setErrors((prev) => { const e = { ...prev }; delete e.city; return e; });
  }, [errors.city]);

  // ── Save ──────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      // Recalculate profile_complete based on required fields
      const isComplete = !!(
        form.first_name.trim() &&
        form.last_name.trim()  &&
        form.phone.trim()      &&
        form.city.trim()
      );

      const { error } = await supabase
        .from("professionals")
        .update({
          first_name:      form.first_name.trim(),
          last_name:       form.last_name.trim(),
          phone:           form.phone.trim(),
          email:           form.email.trim(),
          city:            form.city.trim() || null,
          lat:             form.lat,
          lng:             form.lng,
          bio:             form.bio.trim() || null,
          price_text:      form.price_text.trim() || null,
          booking_mode:    form.booking_mode,
          avatar_url:      form.avatar_url,
          profile_complete: isComplete,
          updated_at:      new Date().toISOString(),
        })
        .eq("id", professionalId);

      if (error) throw error;
      showToast("success");
    } catch (err) {
      console.error("[ProfileEditor] save error:", err);
      showToast("error");
    } finally {
      setIsSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <>
      <form onSubmit={handleSave} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* ── Profile completion indicator ── */}
          <div
            style={{
              backgroundColor: "#fff",
              border:          "1.5px solid var(--color-border)",
              borderRadius:    "14px",
              padding:         "1.25rem 1.5rem",
            }}
          >
            <div
              style={{
                display:        "flex",
                justifyContent: "space-between",
                alignItems:     "baseline",
                marginBottom:   "0.625rem",
                flexWrap:       "wrap",
                gap:            "0.5rem",
              }}
            >
              <p style={{ fontWeight: 700, color: "var(--color-text)", margin: 0, fontSize: "0.9375rem" }}>
                Συμπλήρωση Προφίλ
              </p>
              <span
                style={{
                  fontWeight: 800,
                  fontSize:   "1.25rem",
                  color:      completion.percent === 100 ? "#27AE60" : "var(--color-primary)",
                }}
              >
                {completion.percent}%
              </span>
            </div>
            <ProgressBar
              value={completion.percent}
              color={completion.percent === 100 ? "#27AE60" : "var(--color-primary)"}
            />
            {completion.missing.length > 0 && (
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: "0.5rem 0 0" }}>
                Λείπει: {completion.missing.join(", ")}
              </p>
            )}
          </div>

          {/* ── Photo upload ── */}
          <div
            style={{
              backgroundColor: "#fff",
              border:          "1.5px solid var(--color-border)",
              borderRadius:    "14px",
              padding:         "1.5rem",
            }}
          >
            <p
              style={{
                fontWeight:   700,
                fontSize:     "0.9375rem",
                color:        "var(--color-text)",
                margin:       "0 0 1.25rem",
                paddingBottom:"0.75rem",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              Φωτογραφία Προφίλ
            </p>

            <div
              style={{
                display:        "flex",
                alignItems:     "center",
                gap:            "1.5rem",
                flexWrap:       "wrap",
              }}
            >
              {/* Clickable avatar circle */}
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Αλλαγή φωτογραφίας προφίλ"
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                style={{
                  position:  "relative",
                  cursor:    isUploading ? "wait" : "pointer",
                  flexShrink: 0,
                }}
              >
                {form.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={form.avatar_url}
                    alt="Φωτογραφία προφίλ"
                    style={{
                      width:        "96px",
                      height:       "96px",
                      borderRadius: "50%",
                      objectFit:    "cover",
                      border:       "3px solid var(--color-border)",
                      display:      "block",
                    }}
                  />
                ) : (
                  <InitialsAvatar
                    firstName={form.first_name || "?"}
                    lastName={form.last_name  || "?"}
                  />
                )}

                {/* Uploading overlay */}
                {isUploading && (
                  <div
                    style={{
                      position:        "absolute",
                      inset:           0,
                      borderRadius:    "50%",
                      backgroundColor: "rgba(0,0,0,0.5)",
                      display:         "flex",
                      alignItems:      "center",
                      justifyContent:  "center",
                    }}
                  >
                    <Loader2
                      size={28}
                      color="#fff"
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  </div>
                )}

                {/* Camera badge */}
                {!isUploading && (
                  <div
                    style={{
                      position:        "absolute",
                      bottom:          "2px",
                      right:           "2px",
                      width:           "28px",
                      height:          "28px",
                      borderRadius:    "50%",
                      backgroundColor: "var(--color-primary)",
                      display:         "flex",
                      alignItems:      "center",
                      justifyContent:  "center",
                      border:          "2px solid #fff",
                    }}
                  >
                    <Camera size={14} color="#fff" />
                  </div>
                )}
              </div>

              {/* Upload info */}
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  style={{
                    display:         "inline-flex",
                    alignItems:      "center",
                    gap:             "0.375rem",
                    padding:         "0.5rem 1rem",
                    border:          "1.5px solid var(--color-primary)",
                    borderRadius:    "8px",
                    backgroundColor: "#fff",
                    color:           "var(--color-primary)",
                    fontWeight:      600,
                    fontSize:        "0.875rem",
                    fontFamily:      "inherit",
                    cursor:          isUploading ? "wait" : "pointer",
                    marginBottom:    "0.4rem",
                  }}
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                      Μεταφόρτωση…
                    </>
                  ) : (
                    <>
                      <Camera size={14} />
                      Αλλαγή φωτογραφίας
                    </>
                  )}
                </button>
                <p style={{ fontSize: "0.775rem", color: "var(--color-text-muted)", margin: 0 }}>
                  JPG, PNG ή WebP · Μέγιστο 5 MB
                </p>
                {uploadError && (
                  <p style={{ fontSize: "0.775rem", color: "#E74C3C", margin: "0.25rem 0 0", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <AlertCircle size={12} />
                    {uploadError}
                  </p>
                )}
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              style={{ display: "none" }}
              aria-hidden="true"
            />
          </div>

          {/* ── Personal details card ── */}
          <div
            style={{
              backgroundColor: "#fff",
              border:          "1.5px solid var(--color-border)",
              borderRadius:    "14px",
              padding:         "1.5rem",
              display:         "flex",
              flexDirection:   "column",
              gap:             "1.125rem",
            }}
          >
            <p
              style={{
                fontWeight:   700,
                fontSize:     "0.9375rem",
                color:        "var(--color-text)",
                margin:       "0 0 0.125rem",
                paddingBottom:"0.75rem",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              Προσωπικά Στοιχεία
            </p>

            {/* Name row: two columns on desktop */}
            <div
              style={{
                display:             "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap:                 "1rem",
              }}
            >
              <Input
                label="Όνομα *"
                value={form.first_name}
                onChange={(e) => setField("first_name", e.target.value)}
                error={errors.first_name}
                autoComplete="given-name"
              />
              <Input
                label="Επώνυμο *"
                value={form.last_name}
                onChange={(e) => setField("last_name", e.target.value)}
                error={errors.last_name}
                autoComplete="family-name"
              />
            </div>

            <Input
              label="Τηλέφωνο *"
              type="tel"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              error={errors.phone}
              autoComplete="tel"
              placeholder="π.χ. 6991234567"
            />

            <div>
              <Input
                label="Email *"
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                disabled={isOAuthAccount}
                autoComplete="email"
              />
              {isOAuthAccount && (
                <p
                  style={{
                    fontSize:   "0.775rem",
                    color:      "var(--color-text-muted)",
                    margin:     "0.25rem 0 0",
                    display:    "flex",
                    alignItems: "center",
                    gap:        "0.25rem",
                  }}
                >
                  <Info size={12} />
                  Το email ορίζεται από τον λογαριασμό Google / Facebook.
                </p>
              )}
            </div>

            {/* City — LocationAutocomplete */}
            <FieldGroup
              label="Πόλη / Περιοχή *"
              hint="Χρησιμοποιούμε το Google Places για ακριβή τοποθεσία και αναζήτηση βάσει απόστασης."
            >
              <LocationAutocomplete
                placeholder="π.χ. Θεσσαλονίκη"
                defaultValue={form.city}
                onSelect={handleLocationSelect}
                error={errors.city}
              />
            </FieldGroup>

          </div>

          {/* ── Profile content card ── */}
          <div
            style={{
              backgroundColor: "#fff",
              border:          "1.5px solid var(--color-border)",
              borderRadius:    "14px",
              padding:         "1.5rem",
              display:         "flex",
              flexDirection:   "column",
              gap:             "1.125rem",
            }}
          >
            <p
              style={{
                fontWeight:   700,
                fontSize:     "0.9375rem",
                color:        "var(--color-text)",
                margin:       "0 0 0.125rem",
                paddingBottom:"0.75rem",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              Περιεχόμενο Προφίλ
            </p>

            {/* Bio textarea */}
            <FieldGroup label="Βιογραφικό (προαιρετικό)">
              <div style={{ position: "relative" }}>
                <textarea
                  value={form.bio}
                  onChange={(e) => setField("bio", e.target.value)}
                  maxLength={520}          // slightly above limit so user sees the error
                  rows={4}
                  placeholder="Πείτε μας λίγα λόγια για εσάς, την εμπειρία σας και τον τρόπο εργασίας σας…"
                  style={{
                    width:        "100%",
                    padding:      "0.75rem",
                    border:       `1.5px solid ${errors.bio ? "#E74C3C" : "var(--color-border)"}`,
                    borderRadius: "8px",
                    fontSize:     "0.9rem",
                    fontFamily:   "inherit",
                    lineHeight:   1.6,
                    resize:       "vertical",
                    outline:      "none",
                    boxSizing:    "border-box",
                    color:        "var(--color-text)",
                  }}
                />
                {/* Character counter */}
                <span
                  style={{
                    position:  "absolute",
                    bottom:    "0.5rem",
                    right:     "0.75rem",
                    fontSize:  "0.75rem",
                    color:     form.bio.length > 500 ? "#E74C3C" : "var(--color-text-muted)",
                    fontWeight: form.bio.length > 500 ? 700 : 400,
                  }}
                >
                  {form.bio.length} / 500
                </span>
              </div>
              {errors.bio && (
                <p style={{ fontSize: "0.775rem", color: "#E74C3C", margin: 0 }}>{errors.bio}</p>
              )}
            </FieldGroup>

            {/* Price text */}
            <Input
              label="Τιμή υπηρεσίας (προαιρετικό)"
              value={form.price_text}
              onChange={(e) => setField("price_text", e.target.value)}
              placeholder='π.χ. "Από €30/ώρα" ή "Κατόπιν συμφωνίας"'
            />
          </div>

          {/* ── Booking mode card ── */}
          <div
            style={{
              backgroundColor: "#fff",
              border:          "1.5px solid var(--color-border)",
              borderRadius:    "14px",
              padding:         "1.5rem",
            }}
          >
            <p
              style={{
                fontWeight:   700,
                fontSize:     "0.9375rem",
                color:        "var(--color-text)",
                margin:       "0 0 1.125rem",
                paddingBottom:"0.75rem",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              Τρόπος Κρατήσεων
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {BOOKING_MODES.map((mode) => {
                const active = form.booking_mode === mode.value;
                return (
                  <label
                    key={mode.value}
                    style={{
                      display:         "flex",
                      alignItems:      "flex-start",
                      gap:             "0.875rem",
                      padding:         "1rem 1.125rem",
                      borderRadius:    "12px",
                      border:          active
                        ? "2px solid var(--color-primary)"
                        : "1.5px solid var(--color-border)",
                      backgroundColor: active ? "var(--color-primary-bg)" : "#fff",
                      cursor:          "pointer",
                      transition:      "border-color 0.15s, background-color 0.15s",
                    }}
                  >
                    <input
                      type="radio"
                      name="booking_mode"
                      value={mode.value}
                      checked={active}
                      onChange={() => setField("booking_mode", mode.value)}
                      style={{ marginTop: "3px", accentColor: "var(--color-primary)", flexShrink: 0 }}
                    />
                    <div>
                      <p
                        style={{
                          fontWeight: 700,
                          fontSize:   "0.9375rem",
                          color:      "var(--color-text)",
                          margin:     0,
                        }}
                      >
                        {mode.emoji} {mode.title}
                      </p>
                      <p style={{ fontSize: "0.8375rem", color: "var(--color-text-muted)", margin: "0.2rem 0 0" }}>
                        {mode.desc}
                      </p>
                      {"note" in mode && mode.note && (
                        <p
                          style={{
                            fontSize:        "0.75rem",
                            color:           "var(--color-accent)",
                            fontWeight:      600,
                            margin:          "0.2rem 0 0",
                          }}
                        >
                          ⚠ {mode.note}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* ── Category (read-only + change request) ── */}
          <div
            style={{
              backgroundColor: "#fff",
              border:          "1.5px solid var(--color-border)",
              borderRadius:    "14px",
              padding:         "1.5rem",
            }}
          >
            <p
              style={{
                fontWeight:   700,
                fontSize:     "0.9375rem",
                color:        "var(--color-text)",
                margin:       "0 0 1.125rem",
                paddingBottom:"0.75rem",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              Κατηγορία
            </p>

            <div
              style={{
                display:         "flex",
                alignItems:      "center",
                justifyContent:  "space-between",
                padding:         "0.875rem 1rem",
                backgroundColor: "var(--color-bg-light)",
                border:          "1.5px solid var(--color-border)",
                borderRadius:    "10px",
                flexWrap:        "wrap",
                gap:             "0.75rem",
              }}
            >
              <span style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "0.9375rem" }}>
                {cat?.emoji} {cat?.nameEl ?? initialData.category_id}
              </span>
              <button
                type="button"
                onClick={() => setShowCatNote((v) => !v)}
                style={{
                  background:     "none",
                  border:         "none",
                  cursor:         "pointer",
                  color:          "var(--color-primary)",
                  fontSize:       "0.8125rem",
                  fontWeight:     600,
                  fontFamily:     "inherit",
                  padding:        0,
                  textDecoration: "underline",
                }}
              >
                Αίτημα αλλαγής κατηγορίας
              </button>
            </div>

            {showCatNote && (
              <div
                style={{
                  display:         "flex",
                  alignItems:      "flex-start",
                  gap:             "0.5rem",
                  marginTop:       "0.75rem",
                  padding:         "0.875rem",
                  backgroundColor: "rgba(212,160,57,0.08)",
                  border:          "1px solid rgba(212,160,57,0.3)",
                  borderRadius:    "8px",
                }}
              >
                <Info size={15} style={{ color: "var(--color-accent)", flexShrink: 0, marginTop: "1px" }} />
                <p style={{ fontSize: "0.8125rem", color: "#92400E", margin: 0, lineHeight: 1.5 }}>
                  Η αλλαγή κατηγορίας απαιτεί έγκριση από τη διαχείριση.
                  Στείλτε email στο{" "}
                  <a href="mailto:support@trustia.gr" style={{ color: "#92400E", fontWeight: 700 }}>
                    support@trustia.gr
                  </a>{" "}
                  με τον λόγο αλλαγής.
                </p>
              </div>
            )}
          </div>

          {/* ── Save button ── */}
          <div
            style={{
              display:        "flex",
              justifyContent: "flex-end",
              gap:            "0.75rem",
              flexWrap:       "wrap",
              // Extra bottom padding on mobile for the fixed tab bar
              paddingBottom:  "0.5rem",
            }}
          >
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSaving}
              disabled={isSaving || isUploading}
            >
              {isSaving ? "Αποθήκευση…" : "Αποθήκευση Αλλαγών"}
            </Button>
          </div>

        </div>
      </form>

      {/* ── Toast notification ── */}
      {toast && <Toast type={toast} onClose={() => setToast(null)} />}

      {/* ── CSS for spinner animation (keyframe injected once) ── */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
