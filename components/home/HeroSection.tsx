// =============================================================
// HeroSection.tsx — The first thing visitors see on Mastori.gr
// =============================================================
// This is the most important section of the entire website.
// It needs to do THREE things in under 5 seconds:
// 1. Tell the visitor what Mastori.gr is
// 2. Let them search for what they need
// 3. Make them trust it enough to keep scrolling
//
// Design: Full-width navy gradient background with a centered
// search bar. The search has two inputs:
// - Category dropdown ("What do you need?")
// - Area autocomplete ("Where?")
// Both feed into the search results page.
// =============================================================

"use client";

import { useState, useMemo } from "react";
import { CATEGORIES, getAllAreas } from "@/lib/constants";

// -------------------------------------------------------------
// Props — receives language from the parent page
// -------------------------------------------------------------
interface HeroSectionProps {
  lang: "el" | "en";
}

export default function HeroSection({ lang }: HeroSectionProps) {
  // ─── STATE ───
  // selectedCategory: which service the user picked from dropdown
  const [selectedCategory, setSelectedCategory] = useState("");

  // areaSearch: what the user is typing in the location field
  const [areaSearch, setAreaSearch] = useState("");

  // showSuggestions: whether to show the autocomplete dropdown
  const [showSuggestions, setShowSuggestions] = useState(false);

  // selectedArea: the area the user finally picked
  const [selectedArea, setSelectedArea] = useState("");

  // Helper: translate between Greek and English
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  // ─── AREA AUTOCOMPLETE ───
  // Get ALL areas from our constants (flattened list)
  // Then filter them based on what the user is typing
  // useMemo prevents recalculating on every render — only when areaSearch changes
  const allAreas = useMemo(() => getAllAreas(), []);

  const filteredAreas = useMemo(() => {
    // Don't show suggestions if less than 2 characters typed
    if (areaSearch.length < 2) return [];

    // Filter areas whose name contains what the user typed (case-insensitive)
    // Limit to 8 results so the dropdown isn't overwhelming
    return allAreas
      .filter((area) =>
        area.name.toLowerCase().includes(areaSearch.toLowerCase()) ||
        area.fullPath.toLowerCase().includes(areaSearch.toLowerCase())
      )
      .slice(0, 8);
  }, [areaSearch, allAreas]);

  // ─── SEARCH HANDLER ───
  // When the user clicks "Search", navigate to the search results page
  // with the selected category and area as URL parameters
  const handleSearch = () => {
    // Build the URL: /services?category=plumber&area=thermi
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedArea) params.set("area", selectedArea);

    // For now, just log it — we'll connect to real navigation later
    console.log("Search:", params.toString());

    // TODO: Replace with router.push(`/services?${params.toString()}`)
    // when we build the search results page
  };

  return (
    <section
      className="relative overflow-hidden"
      style={{
        // Navy blue gradient — matches our brand colors
        background: "linear-gradient(135deg, #1B4F72 0%, #2E86C1 50%, #1B4F72 100%)",
      }}
    >
      {/* ─── CONTENT CONTAINER ─── */}
      {/* max-w-4xl centers the content and limits width on large screens */}
      {/* py-16 md:py-24 gives more vertical space on desktop */}
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 text-center relative z-10">

        {/* ─── MAIN HEADING ─── */}
        {/* The brand name, large and bold, white on navy */}
        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
          MASTORI.GR
        </h1>

        {/* ─── TAGLINE ─── */}
        {/* Lighter blue, explains what the site does in one line */}
        <p className="text-xl md:text-2xl text-blue-200 mb-8 font-light">
          {t("Βρες τον ειδικό για κάθε ανάγκη", "Find the expert you need")}
        </p>

        {/* ─── SEARCH BAR ─── */}
        {/* White card with rounded corners, sits on top of the navy background */}
        {/* On mobile: stacked vertically. On desktop: horizontal row */}
        <div className="bg-white rounded-2xl p-3 md:p-4 shadow-2xl flex flex-col md:flex-row gap-3 max-w-2xl mx-auto">

          {/* ── Category Dropdown ── */}
          {/* The user selects what service they need */}
          {/* Categories are grouped by tier but prices are NOT shown here */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="
              flex-1 px-4 py-3 rounded-xl
              bg-gray-50 border-0
              text-gray-700 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-200
              appearance-none cursor-pointer
            "
          >
            {/* Default option */}
            <option value="">
              {t("Τι χρειάζεσαι;", "What do you need?")}
            </option>

            {/* Light services group */}
            <optgroup label={t("Καθαρισμός & Ελαφριές", "Cleaning & Light")}>
              {CATEGORIES.filter((c) => c.tier === "light").map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {lang === "el" ? cat.nameEl : cat.nameEn}
                </option>
              ))}
            </optgroup>

            {/* Trades & Beauty group */}
            <optgroup label={t("Τεχνικά & Ομορφιά", "Trades & Beauty")}>
              {CATEGORIES.filter((c) => c.tier === "trades").map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {lang === "el" ? cat.nameEl : cat.nameEn}
                </option>
              ))}
            </optgroup>

            {/* Specialists group */}
            <optgroup label={t("Ειδικοί & Εργολάβοι", "Specialists")}>
              {CATEGORIES.filter((c) => c.tier === "specialists").map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {lang === "el" ? cat.nameEl : cat.nameEn}
                </option>
              ))}
            </optgroup>
          </select>

          {/* ── Area Autocomplete ── */}
          {/* The user types their area and sees suggestions */}
          {/* This is the geolocation system from our business plan */}
          <div className="relative md:w-52">
            <input
              type="text"
              value={areaSearch}
              onChange={(e) => {
                setAreaSearch(e.target.value);
                setShowSuggestions(true);
                // Clear previously selected area when user types something new
                setSelectedArea("");
              }}
              onFocus={() => {
                if (areaSearch.length >= 2) setShowSuggestions(true);
              }}
              onBlur={() => {
                // Delay hiding so user can click on a suggestion
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              placeholder={t("Περιοχή...", "Area...")}
              className="
                w-full px-4 py-3 rounded-xl
                bg-gray-50 border-0
                text-gray-700 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-200
              "
            />

            {/* ── Autocomplete Suggestions Dropdown ── */}
            {/* Shows matching areas as the user types */}
            {/* Each suggestion shows: Area name, Municipality, Region */}
            {showSuggestions && filteredAreas.length > 0 && (
              <div
                className="
                  absolute top-full left-0 right-0 mt-1
                  bg-white border border-gray-200 rounded-xl
                  shadow-lg z-50 max-h-60 overflow-y-auto
                "
              >
                {filteredAreas.map((area) => (
                  <button
                    key={area.id}
                    onMouseDown={(e) => {
                      // onMouseDown fires before onBlur, so the click registers
                      e.preventDefault();
                      setAreaSearch(area.name);
                      setSelectedArea(area.id);
                      setShowSuggestions(false);
                    }}
                    className="
                      w-full text-left px-4 py-2.5
                      hover:bg-blue-50
                      text-sm text-gray-700
                      border-b border-gray-50 last:border-0
                      transition-colors
                    "
                  >
                    {/* Area name in bold */}
                    <span className="font-medium">{area.name}</span>
                    {/* Full path in gray below */}
                    <span className="text-xs text-gray-400 block">
                      {area.fullPath}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Search Button ── */}
          {/* Gold/yellow color matches our accent brand color */}
          <button
            onClick={handleSearch}
            className="
              px-8 py-3
              bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)]
              text-gray-900 font-bold rounded-xl
              transition-all
              whitespace-nowrap
            "
          >
            {t("Αναζήτηση", "Search")}
          </button>
        </div>

        {/* ─── STATS LINE ─── */}
        {/* Small text below the search bar showing key numbers */}
        {/* These create instant credibility */}
        <p className="text-blue-300 text-sm mt-4">
          {t(
            "48 κατηγορίες • Όλη η Ελλάδα • Επαληθευμένες κριτικές",
            "48 categories • All of Greece • Verified reviews"
          )}
        </p>
      </div>
    </section>
  );
}