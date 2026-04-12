"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { supabase } from "@/lib/supabase";

interface Professional {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  category_id: string;
  tier: string;
  city: string;
  bio: string;
  price_text: string;
  booking_enabled: boolean;
  featured: boolean;
  rank: number;
  rating: number;
  review_count: number;
  job_count: number;
  status: string;
}

export default function ServicesPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [areaSearch, setAreaSearch] = useState("");

  const lang = "el";
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  // Fetch professionals from Supabase on page load
  useEffect(() => {
    async function fetchPros() {
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .eq("status", "active")
        .order("featured", { ascending: false })
        .order("review_count", { ascending: false });

      if (data) setProfessionals(data);
      if (error) console.error("Error fetching professionals:", error);
      setLoading(false);
    }
    fetchPros();
  }, []);

  // Filter by selected category
  const filtered = useMemo(() => {
    if (!selectedCategory) return professionals;
    return professionals.filter((p) => p.category_id === selectedCategory);
  }, [professionals, selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--color-primary)" }}>
          {selectedCategory
            ? CATEGORIES.find((c) => c.id === selectedCategory)?.[lang === "el" ? "nameEl" : "nameEn"] || t("Υπηρεσίες", "Services")
            : t("Όλες οι Υπηρεσίες", "All Services")}
        </h1>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">{t("Όλες οι κατηγορίες", "All categories")}</option>
            <optgroup label={t("Καθαρισμός & Ελαφριές", "Cleaning & Light")}>
              {CATEGORIES.filter((c) => c.tier === "light").map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.emoji} {lang === "el" ? cat.nameEl : cat.nameEn}</option>
              ))}
            </optgroup>
            <optgroup label={t("Τεχνικά & Ομορφιά", "Trades & Beauty")}>
              {CATEGORIES.filter((c) => c.tier === "trades").map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.emoji} {lang === "el" ? cat.nameEl : cat.nameEn}</option>
              ))}
            </optgroup>
            <optgroup label={t("Ειδικοί & Εργολάβοι", "Specialists")}>
              {CATEGORIES.filter((c) => c.tier === "specialists").map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.emoji} {lang === "el" ? cat.nameEl : cat.nameEn}</option>
              ))}
            </optgroup>
          </select>

          {(selectedCategory) && (
            <button
              onClick={() => { setSelectedCategory(""); setAreaSearch(""); }}
              className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700"
            >
              {t("Καθαρισμός φίλτρων", "Clear filters")} ✕
            </button>
          )}
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-4">
          {filtered.length} {t("αποτελέσματα", "results")}
        </p>

        {/* Loading state */}
        {loading ? (
          <div className="text-center py-16">
            <div className="text-3xl mb-3">⏳</div>
            <p className="text-gray-500">{t("Φόρτωση...", "Loading...")}</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filtered.map((pro) => {
              const cat = CATEGORIES.find((c) => c.id === pro.category_id);
              return (
                <Link
                  key={pro.id}
                  href={"/professional/" + pro.id}
                  className="block bg-white border rounded-xl p-4 hover:shadow-md transition-all"
                >
                  {pro.featured && (
                    <div
                      className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-2"
                      style={{ backgroundColor: "var(--color-bg-amber)", color: "var(--color-accent)" }}
                    >
                      ⭐ {t("Προτεινόμενος", "Featured")}
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <span className="text-5xl">{cat?.emoji || "👤"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900">{pro.first_name} {pro.last_name}</span>
                        <span className="text-xs text-gray-400">#{pro.rank} {cat ? (lang === "el" ? cat.nameEl : cat.nameEn) : ""}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {cat ? (lang === "el" ? cat.nameEl : cat.nameEn) : ""} • {pro.city}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-yellow-500 text-sm">
                          {"★".repeat(Math.floor(pro.rating))}{"☆".repeat(5 - Math.floor(pro.rating))}
                        </span>
                        <span className="text-sm text-gray-600">
                          {pro.rating} ({pro.review_count} {t("κριτικές", "reviews")})
                        </span>
                        <span className="text-sm text-gray-400">• {pro.job_count} {t("εργασίες", "jobs")}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-sm font-semibold text-gray-700">{pro.price_text}</span>
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: pro.booking_enabled ? "var(--color-bg-blue)" : "var(--color-bg-amber)",
                          color: pro.booking_enabled ? "var(--color-primary)" : "#7D6608",
                        }}
                      >
                        {pro.booking_enabled ? "📅 " + t("Κράτηση", "Book") : "📞 " + t("Επικοινωνία", "Contact")}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {t("Δεν βρέθηκαν αποτελέσματα", "No results found")}
            </h3>
            <p className="text-sm text-gray-500">
              {t("Δοκίμασε να αλλάξεις τα φίλτρα.", "Try changing the filters.")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}