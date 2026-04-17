"use client";

import { useState, useEffect } from "react";
import { CATEGORIES } from "@/lib/constants";

interface HeroSectionProps {
  lang: "el" | "en";
}

interface PlaceResult {
  placeId: string;
  name: string;
  fullPath: string;
}

export default function HeroSection({ lang }: HeroSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [areaSearch, setAreaSearch] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState("");

  const t = (el: string, en: string) => (lang === "el" ? el : en);

  useEffect(() => {
    if (areaSearch.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/places?q=" + encodeURIComponent(areaSearch));
        const data = await res.json();
        setSuggestions(data);
        if (data.length > 0) {
          setShowSuggestions(true);
        }
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [areaSearch]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedPlace) params.set("area", selectedPlace);
    window.location.href = "/services?" + params.toString();
  };

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1A2B3C 0%, #2A8F8F 50%, #1A2B3C 100%)" }}
    >
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 text-center relative z-10">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
          TRUSTIA.GR
        </h1>
        <p className="text-xl md:text-2xl text-blue-200 mb-8 font-light">
          {t("Βρες τον ειδικό για κάθε ανάγκη", "Find the expert you need")}
        </p>

        <div className="bg-white rounded-2xl p-3 md:p-4 shadow-2xl flex flex-col md:flex-row gap-3 max-w-2xl mx-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border-0 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">{t("Τι χρειάζεσαι;", "What do you need?")}</option>
            <optgroup label={t("Καθαρισμός & Ελαφριές", "Cleaning & Light")}>
              {CATEGORIES.filter((c) => c.tier === "light").map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {lang === "el" ? cat.nameEl : cat.nameEn}
                </option>
              ))}
            </optgroup>
            <optgroup label={t("Τεχνικά & Ομορφιά", "Trades & Beauty")}>
              {CATEGORIES.filter((c) => c.tier === "trades").map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {lang === "el" ? cat.nameEl : cat.nameEn}
                </option>
              ))}
            </optgroup>
            <optgroup label={t("Ειδικοί & Εργολάβοι", "Specialists")}>
              {CATEGORIES.filter((c) => c.tier === "specialists").map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {lang === "el" ? cat.nameEl : cat.nameEn}
                </option>
              ))}
            </optgroup>
          </select>

          <div className="relative md:w-52">
            <input
              type="text"
              value={areaSearch}
              onChange={(e) => {
                setAreaSearch(e.target.value);
                setSelectedPlace("");
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={t("Περιοχή...", "Area...")}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                {suggestions.map((place) => (
                  <button
                    key={place.placeId}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setAreaSearch(place.name);
                      setSelectedPlace(place.name);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm text-gray-700 border-b border-gray-50 last:border-0"
                  >
                    <span className="font-medium">{place.name}</span>
                    <span className="text-xs text-gray-400 block">{place.fullPath}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSearch}
            className="px-8 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-gray-900 font-bold rounded-xl transition-all whitespace-nowrap"
          >
            {t("Αναζήτηση", "Search")}
          </button>
        </div>

        <p className="text-blue-300 text-sm mt-4">
          {t("48 κατηγορίες • Όλη η Ελλάδα • Επαληθευμένες κριτικές", "48 categories • All of Greece • Verified reviews")}
        </p>
      </div>
    </section>
  );
}
