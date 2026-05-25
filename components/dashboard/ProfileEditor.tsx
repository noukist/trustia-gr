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
//
// SAVE
//   Updates the `professionals` row and recalculates
//   profile_complete based on required fields.
//
// i18n
//   All user-visible strings come from the "dashboard.profile"
//   namespace via useTranslations (next-intl client hook).
// =============================================================

"use client";

import React, { useState, useRef, useCallback } from "react";
import { Check, AlertCircle, Camera, Loader2, Info } from "lucide-react";
import { useTranslations }      from "next-intl";
import { createClient }         from "@/lib/supabase/client";
import Input                    from "@/components/ui/Input";
import Button                   from "@/components/ui/Button";
import LocationAutocomplete     from "@/components/ui/LocationAutocomplete";
import { CATEGORIES }           from "@/lib/constants";
import type { LocationResult }  from "@/components/ui/LocationAutocomplete";

// ── Types ──────────────────────────────────────────────────────
interface InitialData {
  first_name:       string;
  last_name:        string;
  phone:            string;
  email:            string;
  avatar_url:       string | null;
  category_id:      string;
  tier:             string;
  city:             string | null;
  lat:              number | null;
  lng:              number | null;
  bio:              string | null;
  price_text:       string | null;
  booking_mode:     "contact" | "date" | "full";
  profile_complete: boolean;
}

interface ProfileEditorProps {
  professionalId: string;     // professionals.id — used for UPDATE
  userId:         string;     // auth user id — used for avatar storage path
  initialData:    InitialData;
  /** True when the account was created via Google / Facebook OAuth */
  isOAuthAccount: boolean;
}

// ── Profile completion (mirrors dashboard/page.tsx calcCompletion) ──
// Returns key identifiers ("completionMissingPhoto" etc.) instead of
// translated strings so the caller can localise them.
function calcCompletion(data: {
  avatar_url:  string | null;
  bio:         string;
  price_text:  string;
}): { percent: number; missingKeys: string[] } {
  const base    = 50;
  const checks  = [
    { done: !!data.avatar_url,          key: "completionMissingPhoto" },
    { done: data.bio.trim().length > 5, key: "completionMissingBio"   },
    { done: !!data.price_text.trim(),   key: "completionMissingPrice" },
  ];
  const weights = [20, 20, 10];
  const bonus   = checks.reduce((s, c, i) => s + (c.done ? weights[i] : 0), 0);
  const missingKeys = checks.filter((c) => !c.done).map((c) => c.key);
  return { percent: base + bonus, missingKeys };
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
  const t = useTranslations("dashboard.profile");

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
    const required = t("errorRequired");
    if (!form.first_name.trim())  e.first_name = required;
    if (!form.last_name.trim())   e.last_name  = required;
    if (!form.phone.trim())       e.phone      = required;
    if (!form.city.trim())        e.city       = t("errorSelectCity");
    if (form.bio.length > 500)    e.bio        = t("errorBioMax");
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
      setUploadError(t("uploadErrorType"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError(t("uploadErrorSize"));
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
      setUploadError(t("uploadErrorFail"));
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
          first_name:       form.first_name.trim(),
          last_name:        form.last_name.trim(),
          phone:            form.phone.trim(),
          email:            form.email.trim(),
          city:             form.city.trim() || null,
          lat:              form.lat,
          lng:              form.lng,
          bio:              form.bio.trim() || null,
          price_text:       form.price_text.trim() || null,
          booking_mode:     form.booking_mode,
          avatar_url:       form.avatar_url,
          profile_complete: isComplete,
          updated_at:       new Date().toISOString(),
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

  // ── Booking mode options (i18n-aware) ─────────────────────
  const BOOKING_MODES = [
    {
      value: "contact" as const,
      emoji: "📞",
      title: t("modeContactTitle"),
      desc:  t("modeContactDesc"),
      note:  undefined as string | undefined,
    },
    {
      value: "date" as const,
      emoji: "📅",
      title: t("modeDateTitle"),
      desc:  t("modeDateDesc"),
      note:  undefined as string | undefined,
    },
    {
      value: "full" as const,
      emoji: "🗓️",
      title: t("modeFullTitle"),
      desc:  t("modeFullDesc"),
      note:  t("modeFullNote"),
    },
  ];

  // ── Initials avatar (fallback) ─────────────────────────────
  const initialsText   = `${form.first_name.charAt(0)}${form.last_name.charAt(0)}`.toUpperCase();
  const avatarColors   = ["var(--color-primary)", "#1A6F6F", "#D4A039", "#27AE60", "#8B5CF6"];
  const avatarColorIdx = (form.first_name.charCodeAt(0) + form.last_name.charCodeAt(0)) % avatarColors.length;

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
                {t("completionTitle")}
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
            {completion.missingKeys.length > 0 && (
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: "0.5rem 0 0" }}>
                {t("completionMissing", {
                  list: completion.missingKeys.map((k) => t(k as Parameters<typeof t>[0])).join(", "),
                })}
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
                fontWeight:    700,
                fontSize:      "0.9375rem",
                color:         "var(--color-text)",
                margin:        "0 0 1.25rem",
                paddingBottom: "0.75rem",
                borderBottom:  "1px solid var(--color-border)",
              }}
            >
              {t("photoSection")}
            </p>

            <div
              style={{
                display:     "flex",
                alignItems:  "center",
                gap:         "1.5rem",
                flexWrap:    "wrap",
              }}
            >
              {/* Clickable avatar circle */}
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label={t("uploadAriaChange")}
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
                    alt={t("uploadImgAlt")}
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
                  /* Initials fallback avatar */
                  <div
                    aria-label={t("initialsAriaLabel", { text: initialsText })}
                    style={{
                      width:           "96px",
                      height:          "96px",
                      borderRadius:    "50%",
                      backgroundColor: avatarColors[avatarColorIdx],
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
                    {initialsText}
                  </div>
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
                      {t("uploadUploading")}
                    </>
                  ) : (
                    <>
                      <Camera size={14} />
                      {t("uploadChange")}
                    </>
                  )}
                </button>
                <p style={{ fontSize: "0.775rem", color: "var(--color-text-muted)", margin: 0 }}>
                  {t("uploadHint")}
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
                fontWeight:    700,
                fontSize:      "0.9375rem",
                color:         "var(--color-text)",
                margin:        "0 0 0.125rem",
                paddingBottom: "0.75rem",
                borderBottom:  "1px solid var(--color-border)",
              }}
            >
              {t("sectionPersonal")}
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
                label={`${t("firstNameLabel")} *`}
                value={form.first_name}
                onChange={(e) => setField("first_name", e.target.value)}
                error={errors.first_name}
                autoComplete="given-name"
              />
              <Input
                label={`${t("lastNameLabel")} *`}
                value={form.last_name}
                onChange={(e) => setField("last_name", e.target.value)}
                error={errors.last_name}
                autoComplete="family-name"
              />
            </div>

            <Input
              label={`${t("phoneLabel")} *`}
              type="tel"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              error={errors.phone}
              autoComplete="tel"
              placeholder={t("phonePlaceholder")}
            />

            <div>
              <Input
                label={`${t("emailLabel")} *`}
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
                  {t("oauthEmailNote")}
                </p>
              )}
            </div>

            {/* City — LocationAutocomplete */}
            <FieldGroup
              label={`${t("cityLabel")} *`}
              hint={t("cityHint")}
            >
              <LocationAutocomplete
                placeholder={t("cityPlaceholder")}
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
                fontWeight:    700,
                fontSize:      "0.9375rem",
                color:         "var(--color-text)",
                margin:        "0 0 0.125rem",
                paddingBottom: "0.75rem",
                borderBottom:  "1px solid var(--color-border)",
              }}
            >
              {t("sectionContent")}
            </p>

            {/* Bio textarea */}
            <FieldGroup label={t("bioOptional")}>
              <div style={{ position: "relative" }}>
                <textarea
                  value={form.bio}
                  onChange={(e) => setField("bio", e.target.value)}
                  maxLength={520}          // slightly above limit so user sees the error
                  rows={4}
                  placeholder={t("bioPlaceholder")}
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
              label={t("priceOptional")}
              value={form.price_text}
              onChange={(e) => setField("price_text", e.target.value)}
              placeholder={t("pricePlaceholder")}
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
                fontWeight:    700,
                fontSize:      "0.9375rem",
                color:         "var(--color-text)",
                margin:        "0 0 1.125rem",
                paddingBottom: "0.75rem",
                borderBottom:  "1px solid var(--color-border)",
              }}
            >
              {t("sectionBookingMode")}
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
                      {mode.note && (
                        <p
                          style={{
                            fontSize:   "0.75rem",
                            color:      "var(--color-accent)",
                            fontWeight: 600,
                            margin:     "0.2rem 0 0",
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
                fontWeight:    700,
                fontSize:      "0.9375rem",
                color:         "var(--color-text)",
                margin:        "0 0 1.125rem",
                paddingBottom: "0.75rem",
                borderBottom:  "1px solid var(--color-border)",
              }}
            >
              {t("sectionCategory")}
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
                {t("changeCategoryBtn")}
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
                  {t("changeCategoryNotePre")}{" "}
                  <a href="mailto:support@trustia.gr" style={{ color: "#92400E", fontWeight: 700 }}>
                    support@trustia.gr
                  </a>{" "}
                  {t("changeCategoryNotePost")}
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
              {isSaving ? t("saving") : t("saveBtn")}
            </Button>
          </div>

        </div>
      </form>

      {/* ── Toast notification ── */}
      {toast && (
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
            backgroundColor: toast === "success" ? "#166534" : "#991B1B",
            color:           "#fff",
            borderRadius:    "12px",
            boxShadow:       "0 8px 24px rgba(0,0,0,0.2)",
            fontSize:        "0.9rem",
            fontWeight:      600,
            maxWidth:        "340px",
          }}
        >
          {toast === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
          {toast === "success" ? t("toastSuccess") : t("toastError")}
        </div>
      )}

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
