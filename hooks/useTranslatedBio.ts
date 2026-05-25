/**
 * hooks/useTranslatedBio.ts
 *
 * Client-side hook that returns a professional's bio in the current locale.
 *
 * BEHAVIOR
 * --------
 * - Greek (default locale): returns the original `bio` immediately (no API call)
 * - English: first checks `bio_en` from the DB (pre-cached), then falls back
 *   to calling /api/translate once, caching the result back in the DB
 *
 * USAGE
 * -----
 * const { bio, loading } = useTranslatedBio({
 *   bioEl:          professional.bio,
 *   bioEnCached:    professional.bio_en,   // may be null
 *   professionalId: professional.id,
 *   locale:         locale,
 * });
 *
 * The `locale` is either "el" or "en".
 * On first render for English, loading=true briefly until the translation arrives.
 */

import { useState, useEffect } from "react";

interface Options {
  bioEl:          string | null;   // Original Greek bio
  bioEnCached:    string | null;   // Pre-translated English bio (from DB)
  professionalId: string;
  locale:         string;
}

interface Result {
  bio:     string;
  loading: boolean;
  error:   string | null;
}

export function useTranslatedBio({
  bioEl,
  bioEnCached,
  professionalId,
  locale,
}: Options): Result {
  // Start with cached value if we have it, so there's no loading flicker
  const [bio, setBio]       = useState<string>(
    locale === "en" ? (bioEnCached ?? bioEl ?? "") : (bioEl ?? "")
  );
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    // Greek — use original, no translation needed
    if (locale !== "en") {
      setBio(bioEl ?? "");
      return;
    }

    // English — use cached if available
    if (bioEnCached) {
      setBio(bioEnCached);
      return;
    }

    // Nothing to translate
    if (!bioEl) {
      setBio("");
      return;
    }

    // Fetch translation from our server-side proxy
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/translate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        text:           bioEl,
        target:         "en",
        professionalId,
      }),
    })
      .then((r) => r.json())
      .then((data: { translatedText?: string; error?: string }) => {
        if (cancelled) return;
        if (data.translatedText) {
          setBio(data.translatedText);
        } else {
          // Graceful fallback: show Greek if translation fails
          setBio(bioEl);
          setError(data.error ?? "Translation failed.");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBio(bioEl); // Fallback to Greek on network error
          setError("Translation service unavailable.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [bioEl, bioEnCached, professionalId, locale]);

  return { bio, loading, error };
}
