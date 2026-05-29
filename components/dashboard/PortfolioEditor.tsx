// =============================================================
// components/dashboard/PortfolioEditor.tsx
// =============================================================
// Client component — portfolio photo management for a professional.
//
// LAYOUT
//   - Section header with title, subtitle, photo count, and upload button
//   - Responsive photo grid (2 cols mobile → 4 cols desktop)
//   - Each thumbnail has a hover overlay with caption + delete button
//   - Click-to-edit inline caption (input → blur or Enter to save)
//   - Inline delete confirmation before commit
//   - Empty state with instructions
//   - Max-photos warning when limit reached
//
// DATA
//   portfolio_photos table — filtered by professional_id, deleted_at IS NULL,
//   ordered by sort_order, limited to 20.
//
// MUTATIONS
//   Add:    Upload file → Supabase Storage → INSERT portfolio_photos row
//   Edit:   UPDATE caption by id
//   Delete: Soft-delete — UPDATE deleted_at = now()
//
// STORAGE
//   Bucket: "portfolio"
//   Path:   {userId}/{timestamp}_{random}.{ext}
//   RLS:    first folder segment must equal auth.uid()
//
// VALIDATION
//   - Allowed types: image/jpeg, image/png, image/webp
//   - Max file size: 5 MB (bucket limit matches)
//   - Max photos: 20
// =============================================================

"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Upload, Trash2, X, Loader2, AlertCircle, ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

// ── Constants ──────────────────────────────────────────────────
const MAX_PHOTOS      = 20;
const MAX_FILE_SIZE   = 5 * 1024 * 1024; // 5 MB in bytes
const ALLOWED_TYPES   = ["image/jpeg", "image/png", "image/webp"];

// ── Types ──────────────────────────────────────────────────────
interface PortfolioPhoto {
  id:            string;
  photo_url:     string;
  thumbnail_url: string | null;
  caption:       string | null;
  sort_order:    number;
}

interface PortfolioEditorProps {
  professionalId: string;
  userId:         string; // auth.uid() — needed for storage RLS path
}

// =============================================================
// MAIN COMPONENT
// =============================================================
export default function PortfolioEditor({ professionalId, userId }: PortfolioEditorProps) {
  const t        = useTranslations("dashboard.portfolio");
  const supabase = useMemo(() => createClient(), []);

  // ── File input ref ─────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── State ──────────────────────────────────────────────────
  const [photos,       setPhotos]       = useState<PortfolioPhoto[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [uploading,    setUploading]    = useState(false);
  const [globalError,  setGlobalError]  = useState("");

  // Caption edit state (one at a time)
  const [editCaptionId,    setEditCaptionId]    = useState<string | null>(null);
  const [editCaptionValue, setEditCaptionValue] = useState("");
  const [captionSaving,    setCaptionSaving]    = useState(false);

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Fetch photos ───────────────────────────────────────────
  const fetchPhotos = useCallback(async () => {
    const { data } = await supabase
      .from("portfolio_photos")
      .select("id, photo_url, thumbnail_url, caption, sort_order")
      .eq("professional_id", professionalId)
      .is("deleted_at", null)
      .order("sort_order")
      .limit(MAX_PHOTOS);

    setPhotos((data ?? []) as PortfolioPhoto[]);
    setLoading(false);
  }, [professionalId, supabase]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  // ── Upload handler ─────────────────────────────────────────
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset input so the same file can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    setGlobalError("");

    // Client-side validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      setGlobalError(t("errorType"));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setGlobalError(t("errorSize"));
      return;
    }
    if (photos.length >= MAX_PHOTOS) {
      setGlobalError(t("maxPhotos"));
      return;
    }

    setUploading(true);

    // Build a unique storage path:
    // portfolio/{userId}/{timestamp}_{4-char-random}.{ext}
    const ext       = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const random    = Math.random().toString(36).slice(2, 6);
    const filename  = `${Date.now()}_${random}.${ext}`;
    const storagePath = `${userId}/${filename}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("portfolio")
      .upload(storagePath, file, { upsert: false });

    if (uploadError) {
      setGlobalError(t("errorUpload"));
      setUploading(false);
      return;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from("portfolio")
      .getPublicUrl(storagePath);

    const photoUrl = urlData.publicUrl;

    // Determine next sort_order
    const nextOrder = photos.length > 0
      ? Math.max(...photos.map((p) => p.sort_order)) + 1
      : 0;

    // Insert row in portfolio_photos
    const { error: dbError } = await supabase
      .from("portfolio_photos")
      .insert({
        professional_id: professionalId,
        photo_url:        photoUrl,
        thumbnail_url:    photoUrl, // same URL; no server-side thumbnail generation
        caption:          null,
        is_before_after:  false,
        sort_order:       nextOrder,
      });

    if (dbError) {
      setGlobalError(t("errorUpload"));
    } else {
      await fetchPhotos();
    }

    setUploading(false);
  }

  // ── Caption edit handlers ──────────────────────────────────
  function startCaptionEdit(photo: PortfolioPhoto) {
    setEditCaptionId(photo.id);
    setEditCaptionValue(photo.caption ?? "");
    setDeleteId(null); // cancel any pending delete
  }

  async function saveCaptionEdit() {
    if (!editCaptionId) return;
    setCaptionSaving(true);
    setGlobalError("");

    const { error } = await supabase
      .from("portfolio_photos")
      .update({ caption: editCaptionValue.trim() || null })
      .eq("id", editCaptionId);

    if (!error) {
      // Optimistic local update to avoid full refetch
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === editCaptionId
            ? { ...p, caption: editCaptionValue.trim() || null }
            : p
        )
      );
    }

    setEditCaptionId(null);
    setEditCaptionValue("");
    setCaptionSaving(false);
  }

  // ── Delete handler ─────────────────────────────────────────
  async function handleDelete(id: string) {
    setGlobalError("");

    const { error } = await supabase
      .from("portfolio_photos")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      setGlobalError(t("errorDelete"));
    } else {
      setDeleteId(null);
      await fetchPhotos();
    }
  }

  // ── Shared style helpers ───────────────────────────────────
  const actionBtn = (bg = "var(--color-primary)"): React.CSSProperties => ({
    display:         "inline-flex",
    alignItems:      "center",
    gap:             "0.35rem",
    padding:         "0.5rem 0.9rem",
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

  const atLimit = photos.length >= MAX_PHOTOS;

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
              fontWeight: 700,
              fontSize:   "0.9375rem",
              color:      "var(--color-text)",
              margin:     "0 0 0.25rem",
            }}
          >
            {t("title")}
            {/* Photo count badge */}
            {!loading && photos.length > 0 && (
              <span
                style={{
                  marginLeft:      "0.5rem",
                  fontSize:        "0.72rem",
                  fontWeight:      600,
                  padding:         "0.15rem 0.5rem",
                  borderRadius:    "99px",
                  backgroundColor: "var(--color-primary-bg)",
                  color:           "var(--color-primary)",
                }}
              >
                {t("photoCount", { count: photos.length })}
              </span>
            )}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>
            {t("subtitle")}
          </p>
        </div>

        {/* Upload button */}
        {!atLimit && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              ...actionBtn(),
              opacity: uploading ? 0.7 : 1,
              cursor:  uploading ? "not-allowed" : "pointer",
            }}
          >
            {uploading
              ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
              : <Upload size={14} />
            }
            {uploading ? t("uploading") : t("uploadBtn")}
          </button>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />
      </div>

      {/* ── Max photos notice ── */}
      {atLimit && (
        <div
          style={{
            display:         "flex",
            alignItems:      "center",
            gap:             "0.5rem",
            padding:         "0.625rem 0.875rem",
            backgroundColor: "rgba(212,160,57,0.08)",
            border:          "1px solid rgba(212,160,57,0.35)",
            borderRadius:    "8px",
            color:           "#92650a",
            fontSize:        "0.8125rem",
            marginBottom:    "1rem",
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          {t("maxPhotos")}
        </div>
      )}

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
          <button
            type="button"
            onClick={() => setGlobalError("")}
            style={{ marginLeft: "auto", ...ghostBtn("#991B1B") }}
            aria-label="Dismiss"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Loading state ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "2.5rem 0" }}>
          <Loader2
            size={28}
            style={{ color: "var(--color-primary)", animation: "spin 1s linear infinite" }}
          />
        </div>

      ) : photos.length === 0 ? (

        /* ── Empty state ── */
        <div
          style={{
            textAlign:    "center",
            padding:      "2rem 1rem",
            color:        "var(--color-text-muted)",
          }}
        >
          <ImageIcon
            size={40}
            style={{
              margin:       "0 auto 0.75rem",
              display:      "block",
              color:        "var(--color-border)",
              strokeWidth:  1.5,
            }}
          />
          <p
            style={{
              fontWeight: 700,
              color:      "var(--color-text)",
              margin:     "0 0 0.375rem",
              fontSize:   "0.9375rem",
            }}
          >
            {t("empty")}
          </p>
          <p style={{ fontSize: "0.8125rem", margin: 0, lineHeight: 1.6 }}>
            {t("emptyHint")}
          </p>
        </div>

      ) : (

        /* ── Photo grid ── */
        <div
          style={{
            display:             "grid",
            // 2 cols on mobile, grows to 3-4 on wider screens
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap:                 "0.75rem",
          }}
        >
          {photos.map((photo) => (
            <div key={photo.id}>
              {deleteId === photo.id ? (

                /* ── Delete confirmation card ── */
                <div
                  style={{
                    aspectRatio:     "1",
                    border:          "2px solid rgba(220,38,38,0.4)",
                    borderRadius:    "10px",
                    backgroundColor: "rgba(231,76,60,0.05)",
                    display:         "flex",
                    flexDirection:   "column",
                    alignItems:      "center",
                    justifyContent:  "center",
                    padding:         "0.75rem",
                    gap:             "0.5rem",
                    textAlign:       "center",
                  }}
                >
                  <span
                    style={{
                      fontSize:   "0.75rem",
                      fontWeight: 600,
                      color:      "#991B1B",
                      lineHeight: 1.3,
                    }}
                  >
                    {t("confirmDelete")}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(photo.id)}
                    style={{
                      ...actionBtn("#DC2626"),
                      padding: "0.35rem 0.6rem",
                      fontSize: "0.75rem",
                    }}
                  >
                    <Trash2 size={11} />
                    {t("deleteBtn")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(null)}
                    style={{ ...ghostBtn(), fontSize: "0.75rem", padding: "0.25rem 0.4rem" }}
                  >
                    <X size={11} />
                    {t("cancelBtn")}
                  </button>
                </div>

              ) : (

                /* ── Photo card (thumbnail + caption + actions) ── */
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  {/* Thumbnail wrapper */}
                  <div
                    style={{
                      position:     "relative",
                      aspectRatio:  "1",
                      borderRadius: "10px",
                      overflow:     "hidden",
                      border:       "1.5px solid var(--color-border)",
                      cursor:       "default",
                    }}
                  >
                    {/* Image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.thumbnail_url ?? photo.photo_url}
                      alt={t("photoAlt")}
                      loading="lazy"
                      style={{
                        width:      "100%",
                        height:     "100%",
                        objectFit:  "cover",
                        display:    "block",
                      }}
                    />

                    {/* Delete button overlay — top-right */}
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteId(photo.id);
                        setEditCaptionId(null);
                      }}
                      aria-label={t("deleteBtn")}
                      style={{
                        position:        "absolute",
                        top:             "0.375rem",
                        right:           "0.375rem",
                        width:           "26px",
                        height:          "26px",
                        borderRadius:    "50%",
                        backgroundColor: "rgba(0,0,0,0.55)",
                        border:          "none",
                        cursor:          "pointer",
                        display:         "flex",
                        alignItems:      "center",
                        justifyContent:  "center",
                        color:           "#fff",
                        transition:      "background 0.15s",
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Caption area */}
                  {editCaptionId === photo.id ? (
                    /* Editing caption */
                    <div style={{ display: "flex", gap: "0.25rem" }}>
                      <input
                        value={editCaptionValue}
                        onChange={(e) => setEditCaptionValue(e.target.value)}
                        onBlur={saveCaptionEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); saveCaptionEdit(); }
                          if (e.key === "Escape") { setEditCaptionId(null); }
                        }}
                        maxLength={100}
                        autoFocus
                        placeholder={t("captionPlaceholder")}
                        style={{
                          flex:         "1",
                          fontSize:     "0.72rem",
                          padding:      "0.3rem 0.4rem",
                          border:       "1.5px solid var(--color-primary)",
                          borderRadius: "6px",
                          fontFamily:   "inherit",
                          outline:      "none",
                          color:        "var(--color-text)",
                          minWidth:     0,
                        }}
                      />
                      {captionSaving && (
                        <Loader2
                          size={13}
                          style={{
                            color:     "var(--color-primary)",
                            animation: "spin 1s linear infinite",
                            alignSelf: "center",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    /* Display caption (or placeholder) — click to edit */
                    <button
                      type="button"
                      onClick={() => startCaptionEdit(photo)}
                      style={{
                        background:   "none",
                        border:       "none",
                        cursor:       "text",
                        padding:      "0.25rem 0.1rem",
                        textAlign:    "left",
                        fontFamily:   "inherit",
                        fontSize:     "0.72rem",
                        color:        photo.caption
                          ? "var(--color-text)"
                          : "var(--color-text-muted)",
                        lineHeight:   1.3,
                        // Truncate long captions
                        overflow:     "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace:   "nowrap",
                        width:        "100%",
                      }}
                      title={photo.caption ?? t("captionPlaceholder")}
                    >
                      {photo.caption || t("captionPlaceholder")}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
