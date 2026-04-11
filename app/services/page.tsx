// =============================================================
// app/services/page.tsx — Search Results page
// =============================================================
// URL: mastori.gr/services?category=plumber&area=thermi
//
// This is the page customers see after searching.
// It shows a filtered list of professionals based on:
// - Category (from dropdown or URL parameter)
// - Area (from autocomplete or URL parameter)
//
// Key features:
// - Featured (Προβολή Plus) professionals shown first
// - Each card shows: name, category, rating, reviews, price,
//   booking badge (📅 or 📞), rank position
// - Filters can be changed without going back to homepage
//
// Later: Results will come from Supabase. For now, we filter
// the DEMO_PROFESSIONALS array from constants.
// =============================================================

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  CATEGORIES,
  REGIONS,
  DEMO_PROFESSIONALS,
  getAllAreas,
} from "@/lib/constants";

export default function ServicesPage() {
  // ─── STATE ───
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [areaSearch, setAreaSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const lang = "el";
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  // Get all areas for autocomplete
  const allAreas = useMemo(() => getAllAreas(), []);

  // Filter area suggestions based on user input
  const filteredAreas = useMemo(() => {
    if (areaSearch.length < 2) return [];
    return allAreas
      .filter(
        (area) =>
          area.name.toLowerCase().includes(areaSearch.toLowerCase()) ||
          area.fullPath.toLowerCase().includes(areaSearch.toLowerCase())
      )
      .slice(0, 8);
  }, [areaSearch, allAreas]);

  // ─── FILTER PROFESSIONALS ───
  // Apply category and area filters to the demo data
  // Sort: featured first, then by review count (our ranking proxy)
  const filteredPros = useMemo(() => {
    let results = [...DEMO_PROFESSIONALS];

    // Filter by category if one is selected
    if (selectedCategory) {
      results = results.filter((pro) => pro.categoryId === selectedCategory);
    }

    // Filter by area if one is selected
    // A professional appears if the selected area is in their serviceAreaIds
    if (selectedAreaId) {
      results = results.filter((pro) =>
        pro.serviceAreaIds.includes(selectedAreaId)
      );
    }

    // Sort: featured professionals first, then by review count descending
    results.sort((a, b) => {
      // Featured always comes first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      // Then sort by review count (more reviews = higher ranking)
      return b.reviewCount - a.reviewCount;
    });

    return results;
  }, [selectedCategory, selectedAreaId]);

  // Find category name for display
  const categoryObj = selectedCategory
    ? CATEGORIES.find((c) => c.id === selectedCategory)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* ─── PAGE HEADING ─── */}
        <h1
          className="text-2xl font-bold mb-6"
          style={{ color: "var(--color-primary)" }}
        >
          {categoryObj
            ? `${lang === "el" ? categoryObj.nameEl : categoryObj.nameEn}`
            : t("Όλες οι Υπηρεσίες", "All Services")}
          {selectedAreaId && areaSearch && (
            <span className="text-gray-400 font-normal text-lg">
              {" "}
              — {areaSearch}
            </span>
          )}
        </h1>

        {/* ─── FILTERS ─── */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="
              flex-1 px-4 py-2.5 rounded-xl
              border bg-white text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-200
            "
          >
            <option value="">
              {t("Όλες οι κατηγορίες", "All categories")}
            </option>
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

          {/* Area filter with autocomplete */}
          <div className="relative md:w-64">
            <input
              type="text"
              value={areaSearch}
              onChange={(e) => {
                setAreaSearch(e.target.value);
                setShowSuggestions(true);
                setSelectedAreaId("");
              }}
              onFocus={() => {
                if (areaSearch.length >= 2) setShowSuggestions(true);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={t("Αναζήτηση περιοχής...", "Search area...")}
              className="
                w-full px-4 py-2.5 rounded-xl
                border bg-white text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-200
              "
            />
            {/* Area suggestions dropdown */}
            {showSuggestions && filteredAreas.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                {filteredAreas.map((area) => (
                  <button
                    key={area.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setAreaSearch(area.name);
                      setSelectedAreaId(area.id);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm border-b border-gray-50 last:border-0"
                  >
                    <span className="font-medium">{area.name}</span>
                    <span className="text-xs text-gray-400 block">{area.fullPath}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear filters button */}
          {(selectedCategory || selectedAreaId) && (
            <button
              onClick={() => {
                setSelectedCategory("");
                setSelectedAreaId("");
                setAreaSearch("");
              }}
              className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {t("Καθαρισμός φίλτρων", "Clear filters")} ✕
            </button>
          )}
        </div>

        {/* ─── RESULTS COUNT ─── */}
        <p className="text-sm text-gray-500 mb-4">
          {filteredPros.length}{" "}
          {t("αποτελέσματα", "results")}
        </p>

        {/* ─── RESULTS LIST ─── */}
        {filteredPros.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filteredPros.map((pro) => {
              // Look up category info for display
              const cat = CATEGORIES.find((c) => c.id === pro.categoryId);

              return (
                <Link
                  key={pro.id}
                  href={`/professional/${pro.id}`}
                  className="
                    block bg-white border rounded-xl p-4
                    hover:shadow-md transition-all
                  "
                >
                  {/* Featured badge — only for Προβολή Plus subscribers */}
                  {pro.featured && (
                    <div className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-2"
                      style={{
                        backgroundColor: "var(--color-bg-amber)",
                        color: "var(--color-accent)",
                      }}
                    >
                      ⭐ {t("Προτεινόμενος", "Featured")}
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <span className="text-5xl">{pro.avatar}</span>

                    {/* Professional info */}
                    <div className="flex-1 min-w-0">
                      {/* Name and rank */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900">
                          {pro.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          #{pro.rank} {cat ? (lang === "el" ? cat.nameEl : cat.nameEn) : ""}
                        </span>
                      </div>

                      {/* Category and location */}
                      <div className="text-sm text-gray-500">
                        {cat ? (lang === "el" ? cat.nameEl : cat.nameEn) : ""} •{" "}
                        {pro.city}, {pro.baseArea}
                      </div>

                      {/* Rating and stats */}
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-yellow-500 text-sm">
                          {"★".repeat(Math.floor(pro.rating))}
                          {"☆".repeat(5 - Math.floor(pro.rating))}
                        </span>
                        <span className="text-sm text-gray-600">
                          {pro.rating} ({pro.reviewCount}{" "}
                          {t("κριτικές", "reviews")})
                        </span>
                        <span className="text-sm text-gray-400">
                          • {pro.jobCount} {t("εργασίες", "jobs")}
                        </span>
                      </div>
                    </div>

                    {/* Right side: price and booking badge */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-sm font-semibold text-gray-700">
                        {pro.priceText}
                      </span>
                      {/* Booking badge: 📅 = online booking, 📞 = phone only */}
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: pro.bookingEnabled
                            ? "var(--color-bg-blue)"
                            : "var(--color-bg-amber)",
                          color: pro.bookingEnabled
                            ? "var(--color-primary)"
                            : "#7D6608",
                        }}
                      >
                        {pro.bookingEnabled
                          ? `📅 ${t("Κράτηση", "Book")}`
                          : `📞 ${t("Επικοινωνία", "Contact")}`}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* ─── EMPTY STATE ─── */
          /* Shows when no professionals match the filters */
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {t(
                "Δεν βρέθηκαν αποτελέσματα",
                "No results found"
              )}
            </h3>
            <p className="text-sm text-gray-500">
              {t(
                "Δοκίμασε να αλλάξεις τα φίλτρα ή να αναζητήσεις σε άλλη περιοχή.",
                "Try changing the filters or searching in a different area."
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}