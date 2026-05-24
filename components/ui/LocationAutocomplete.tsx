// =============================================================
// components/ui/LocationAutocomplete.tsx
// =============================================================
// Google Places-powered location autocomplete for Trustia.gr.
//
// WHY Google Places?
//   Greece has hundreds of duplicate place names (e.g. 100+ villages
//   all called "Αγγελοχώρι"). Google Places Autocomplete returns a
//   fully-disambiguated path:
//   "Αγγελοχώρι, Δήμος Θερμαϊκού, Θεσσαλονίκη"
//   so the user can pick the exact one they mean.
//
//   After selection we store:
//     - placeId    → unique Google identifier, stable across renames
//     - displayName → full human-readable path shown in the UI
//     - lat / lng  → for radius-based proximity matching (PRD §74)
//     - municipality → Δήμος, extracted from address_components
//
// Architecture overview:
//   1. User types → debounce 300 ms → fetch /api/places?input=…
//      (server proxy keeps the API key off the browser bundle)
//
//   2. Dropdown shows Google's "description" string which already
//      contains the disambiguated path — no extra formatting needed.
//
//   3. User clicks / keyboards a suggestion → fetch
//      /api/places?placeId=… to get geometry + address components.
//
//   4. onSelect() is called with the resolved LocationResult.
//
// Keyboard navigation:
//   ↓ / ↑  — move highlighted index
//   Enter  — select highlighted item (or submit parent form if closed)
//   Escape — close dropdown without selecting
//
// ARIA pattern: combobox (role="combobox") + listbox (role="listbox")
//   per WAI-ARIA 1.2 combobox pattern.
//
// Styling: matches Input.tsx / globals.css ".ui-field-*" classes so
//   this component drops in wherever a regular <Input> would go.
// =============================================================

"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useId,
} from "react";
import { MapPin, Loader2, X } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

/**
 * The resolved location object passed to onSelect().
 * Store all four fields in your database / URL params.
 */
export interface LocationResult {
  /** Google's stable unique identifier for this place */
  placeId:      string;
  /** Fully-disambiguated display string, e.g. "Αγγελοχώρι, Δήμος Θερμαϊκού, Θεσσαλονίκη" */
  displayName:  string;
  /** WGS-84 latitude — used for radius-based proximity matching */
  lat:          number;
  /** WGS-84 longitude */
  lng:          number;
  /** Greek municipality (Δήμος), extracted from address_components */
  municipality: string;
}

/** A single row in the autocomplete dropdown */
interface Prediction {
  place_id:    string;
  description: string; // already fully-disambiguated by Google
  structured_formatting: {
    main_text:      string; // the local place name
    secondary_text: string; // parent context (municipality, region)
  };
}

export interface LocationAutocompleteProps {
  /** Called when the user selects a location from the list */
  onSelect:      (location: LocationResult) => void;
  placeholder?:  string;
  /** Pre-fill the text field (display string only, not a full LocationResult) */
  defaultValue?: string;
  /** Red border + error message below the field */
  error?:        string;
  /** Extra CSS class on the root element */
  className?:    string;
}

// ── Module-level state for script loading ─────────────────────
// We load the Google Maps JS API only once per page, even if
// multiple <LocationAutocomplete> components mount simultaneously.
// The script is used only as a fallback for PlacesService.getDetails()
// when our server proxy is unavailable.
let gmScriptState: "idle" | "loading" | "ready" | "error" = "idle";
const gmReadyCallbacks: Array<() => void> = [];

/**
 * Append the Google Maps JS API script to <head> exactly once.
 * Returns a Promise that resolves when `window.google.maps` is ready.
 *
 * API key: reads NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, falling back to
 * NEXT_PUBLIC_GOOGLE_PLACES_KEY (our legacy name).
 */
function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (gmScriptState === "ready") { resolve(); return; }

    // Queue up this resolver; it will be called once the script fires
    gmReadyCallbacks.push(resolve);

    // Already loading — just wait for the existing script
    if (gmScriptState === "loading") return;

    gmScriptState = "loading";

    const apiKey =
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
      process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY ??
      "";

    if (!apiKey) {
      gmScriptState = "error";
      reject(
        new Error(
          "Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY — " +
          "add it to .env.local to enable location autocomplete.",
        ),
      );
      return;
    }

    // Global callback invoked by the Maps script once it's parsed
    (window as Window & { __gmInit__?: () => void }).__gmInit__ = () => {
      gmScriptState = "ready";
      gmReadyCallbacks.forEach((cb) => cb());
      gmReadyCallbacks.length = 0;
    };

    const script    = document.createElement("script");
    script.src      = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=el&callback=__gmInit__`;
    script.async    = true;
    script.defer    = true;
    script.onerror  = () => {
      gmScriptState = "error";
      reject(new Error("Failed to load Google Maps JS API"));
    };
    document.head.appendChild(script);
  });
}

// ── Helpers ────────────────────────────────────────────────────

/**
 * Extract the Greek municipality (Δήμος) from a place's address_components.
 *
 * Google returns Greek admin levels as:
 *   administrative_area_level_3 → municipality (most specific, preferred)
 *   administrative_area_level_4 → community (sometimes present)
 *   locality                    → city / town (fallback)
 */
function extractMunicipality(
  components: google.maps.GeocoderAddressComponent[],
): string {
  const preferred = [
    "administrative_area_level_3",
    "administrative_area_level_4",
    "locality",
    "administrative_area_level_2",
  ];

  for (const type of preferred) {
    const comp = components.find((c) => c.types.includes(type));
    if (comp) return comp.long_name;
  }

  return "";
}

// ── Component ──────────────────────────────────────────────────
export default function LocationAutocomplete({
  onSelect,
  placeholder  = "π.χ. Θεσσαλονίκη",
  defaultValue = "",
  error,
  className,
}: LocationAutocompleteProps) {
  // ── State ───────────────────────────────────────────────────
  const [query,       setQuery]       = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [isOpen,      setIsOpen]      = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  /** True once the user has committed to a selection */
  const [hasSelection, setHasSelection] = useState(!!defaultValue);

  // ── Refs ────────────────────────────────────────────────────
  const inputRef      = useRef<HTMLInputElement>(null);
  const listRef       = useRef<HTMLUListElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef      = useRef<AbortController | null>(null);

  // ── Stable IDs for ARIA ─────────────────────────────────────
  const uid        = useId();
  const inputId    = `location-input-${uid}`;
  const listboxId  = `location-list-${uid}`;

  // ── Autocomplete fetch (via server proxy) ───────────────────
  /**
   * Calls our /api/places proxy endpoint to fetch autocomplete predictions.
   * The proxy keeps the API key server-side.
   *
   * Cancelled immediately when:
   *   - the query changes (debounce restart)
   *   - the component unmounts
   */
  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Cancel any in-flight request from the previous keystroke
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/places?input=${encodeURIComponent(input)}&language=el`,
        { signal: abortRef.current.signal },
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const preds: Prediction[] = data.predictions ?? [];

      setSuggestions(preds);
      setIsOpen(preds.length > 0);
      setHighlighted(-1);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        // Log for debugging; don't surface API errors to the user
        // since the input is still usable as a plain text field
        console.warn("[LocationAutocomplete] fetch error:", err);
        setSuggestions([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Debounce input changes ──────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setHasSelection(false); // user is typing again — clear the previous selection

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  // ── Select a suggestion ─────────────────────────────────────
  /**
   * Called when the user clicks or keyboards-selects a prediction.
   *
   * Flow:
   *   1. Show the prediction's description in the input immediately (fast UX)
   *   2. Fetch place details from /api/places?placeId=… to get lat/lng
   *   3. Call onSelect() with the fully-resolved LocationResult
   *
   * If the details fetch fails (network error, quota) we still call
   * onSelect() with lat/lng = 0 so the form can proceed.
   */
  const selectPrediction = useCallback(
    async (prediction: Prediction) => {
      // Immediately close dropdown + show the display name
      setQuery(prediction.description);
      setSuggestions([]);
      setIsOpen(false);
      setHasSelection(true);
      setIsLoading(true);

      try {
        const res = await fetch(
          `/api/places?placeId=${encodeURIComponent(prediction.place_id)}&language=el`,
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const result: google.maps.places.PlaceResult = data.result;

        const lat = result.geometry?.location?.lat ?? 0;
        const lng = result.geometry?.location?.lng ?? 0;

        // lat/lng may be returned as numbers or as LatLng objects depending
        // on whether the Maps JS API is loaded. The proxy returns raw JSON
        // so they arrive as plain numbers — no .lat() function call needed.
        const latNum = typeof lat === "function" ? (lat as () => number)() : (lat as number);
        const lngNum = typeof lng === "function" ? (lng as () => number)() : (lng as number);

        const municipality = extractMunicipality(
          result.address_components ?? [],
        );

        onSelect({
          placeId:     prediction.place_id,
          displayName: prediction.description,
          lat:         latNum,
          lng:         lngNum,
          municipality,
        });
      } catch (err) {
        console.warn("[LocationAutocomplete] details fetch error:", err);
        // Graceful degradation — still notify with coordinates = 0
        onSelect({
          placeId:     prediction.place_id,
          displayName: prediction.description,
          lat:         0,
          lng:         0,
          municipality: "",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [onSelect],
  );

  // ── Keyboard navigation ─────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, 0));
        break;

      case "Enter":
        e.preventDefault();
        if (highlighted >= 0) {
          selectPrediction(suggestions[highlighted]);
        }
        break;

      case "Escape":
        setIsOpen(false);
        setHighlighted(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // ── Scroll highlighted item into view ──────────────────────
  useEffect(() => {
    if (highlighted < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll<HTMLLIElement>("[role='option']");
    items[highlighted]?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  // ── Close on outside click ──────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const root = inputRef.current?.closest("[data-location-autocomplete]");
      if (root && !root.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Cleanup on unmount ──────────────────────────────────────
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      abortRef.current?.abort();
    };
  }, []);

  // ── Clear button ────────────────────────────────────────────
  const handleClear = () => {
    setQuery("");
    setHasSelection(false);
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div
      data-location-autocomplete
      className={className}
      style={{ position: "relative", flex: "1 1 180px" }}
    >
      {/* Input wrapper — mirrors Input.tsx structure */}
      <div className="ui-field-wrap">
        {/* MapPin icon on the left */}
        <span className="ui-field-icon" aria-hidden="true">
          {isLoading
            ? <Loader2 size={18} style={{ animation: "ui-spin 0.75s linear infinite" }} />
            : <MapPin  size={18} />
          }
        </span>

        {/* Text input (ARIA combobox) */}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-label="Τοποθεσία"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            highlighted >= 0 ? `${listboxId}-opt-${highlighted}` : undefined
          }
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          autoComplete="off"
          spellCheck={false}
          className={[
            "ui-field-input",
            "ui-field-input-icon",  // left padding for MapPin icon
            error ? "ui-field-input-error" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          // Right padding for the clear button
          style={{ paddingRight: query ? "2.25rem" : undefined }}
        />

        {/* Clear (×) button — only shown when there's text */}
        {query && (
          <button
            type="button"
            aria-label="Καθαρισμός τοποθεσίας"
            onClick={handleClear}
            style={{
              position:        "absolute",
              right:           "0.625rem",
              background:      "none",
              border:          "none",
              cursor:          "pointer",
              color:           "var(--color-text-muted)",
              display:         "flex",
              alignItems:      "center",
              padding:         "0.25rem",
              borderRadius:    "4px",
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="ui-field-error-msg" role="alert">
          {error}
        </p>
      )}

      {/* ── Dropdown listbox ── */}
      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Προτάσεις τοποθεσιών"
          style={{
            position:        "absolute",
            top:             "calc(100% + 6px)",
            left:            0,
            right:           0,
            zIndex:          100,
            background:      "#fff",
            border:          "1.5px solid var(--color-border)",
            borderRadius:    "12px",
            boxShadow:       "0 8px 32px rgba(0,0,0,0.12)",
            listStyle:       "none",
            margin:          0,
            padding:         "0.375rem",
            maxHeight:       "280px",
            overflowY:       "auto",
          }}
        >
          {suggestions.map((pred, idx) => {
            const isHighlighted = idx === highlighted;
            return (
              <li
                key={pred.place_id}
                id={`${listboxId}-opt-${idx}`}
                role="option"
                aria-selected={isHighlighted}
                onMouseEnter={() => setHighlighted(idx)}
                onMouseDown={(e) => {
                  // Prevent input blur before click registers
                  e.preventDefault();
                  selectPrediction(pred);
                }}
                style={{
                  display:       "flex",
                  alignItems:    "flex-start",
                  gap:           "0.625rem",
                  padding:       "0.625rem 0.75rem",
                  borderRadius:  "8px",
                  cursor:        "pointer",
                  backgroundColor: isHighlighted
                    ? "var(--color-primary-bg)"
                    : "transparent",
                  transition:    "background-color 0.1s",
                }}
              >
                {/* Pin icon per row */}
                <MapPin
                  size={16}
                  style={{
                    color:      "var(--color-primary)",
                    flexShrink: 0,
                    marginTop:  "2px",
                  }}
                />

                {/* Two-line layout: main text + secondary context */}
                <span style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display:    "block",
                      fontWeight: 600,
                      fontSize:   "0.9rem",
                      color:      "var(--color-text)",
                      whiteSpace: "nowrap",
                      overflow:   "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {pred.structured_formatting.main_text}
                  </span>
                  {pred.structured_formatting.secondary_text && (
                    <span
                      style={{
                        display:    "block",
                        fontSize:   "0.8rem",
                        color:      "var(--color-text-muted)",
                        whiteSpace: "nowrap",
                        overflow:   "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {pred.structured_formatting.secondary_text}
                    </span>
                  )}
                </span>
              </li>
            );
          })}

          {/* Attribution — required by Google's Terms of Service */}
          <li
            aria-hidden="true"
            style={{
              padding:    "0.375rem 0.75rem 0.25rem",
              textAlign:  "right",
            }}
          >
            <img
              src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png"
              alt="Powered by Google"
              style={{ height: "14px", opacity: 0.7 }}
            />
          </li>
        </ul>
      )}
    </div>
  );
}
