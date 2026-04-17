// =============================================================
// app/professional/[id]/page.tsx — Professional Profile Page
// =============================================================
// URL: trustia.gr/professional/{uuid}
//
// Shows a professional's full profile pulled from Supabase.
// Customers arrive here by clicking a result on /services.
//
// Three tabs:
// - About: bio, pricing, location
// - Reviews: star distribution + individual reviews from DB
// - Book: booking form (only if professional enabled booking)
//
// Data flow:
// 1. Page reads the [id] from the URL
// 2. Fetches professional from Supabase 'professionals' table
// 3. Fetches their reviews from 'reviews' table
// 4. Renders everything with real database data
// =============================================================

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { supabase } from "@/lib/supabase";

// -------------------------------------------------------------
// TypeScript interfaces — define the shape of our data
// These match the Supabase table columns exactly
// -------------------------------------------------------------
interface Professional {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
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
  created_at: string;
}

interface Review {
  id: string;
  rating: number;
  text: string;
  type: string; // "verified" or "founding"
  created_at: string;
}

export default function ProfessionalProfilePage() {
  // ─── READ THE URL PARAMETER ───
  // useParams() extracts [id] from the URL
  // Example: /professional/a1000000-... → proId = "a1000000-..."
  const params = useParams();
  const proId = params.id as string;

  // ─── STATE ───
  // pro: the professional's data from Supabase (null until loaded)
  const [pro, setPro] = useState<Professional | null>(null);

  // reviews: array of reviews for this professional
  const [reviews, setReviews] = useState<Review[]>([]);

  // loading: shows spinner while fetching data
  const [loading, setLoading] = useState(true);

  // activeTab: which tab is currently visible
  const [activeTab, setActiveTab] = useState<"about" | "reviews" | "book">("about");

  // bookingSubmitted: shows success message after form submission
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  // Language helper
  const lang = "el";
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  // ─── FETCH DATA FROM SUPABASE ───
  // Runs once when the page loads (or when proId changes)
  // Makes two queries:
  // 1. Get the professional by ID (only if status is active)
  // 2. Get all active reviews for this professional, newest first
  useEffect(() => {
    async function fetchData() {
      // Query 1: Get professional profile
      const { data: proData } = await supabase
        .from("professionals")
        .select("*")
        .eq("id", proId)
        .eq("status", "active")
        .single(); // .single() returns one object instead of an array

      if (proData) setPro(proData);

      // Query 2: Get reviews for this professional
      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*")
        .eq("professional_id", proId)
        .eq("status", "active")
        .order("created_at", { ascending: false }); // Newest first

      if (reviewData) setReviews(reviewData);

      // Done loading — hide the spinner
      setLoading(false);
    }
    fetchData();
  }, [proId]);

  // ─── LOADING STATE ───
  // Show a spinner while we wait for Supabase to respond
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-3xl">⏳</div>
      </div>
    );
  }

  // ─── NOT FOUND STATE ───
  // If no professional matches this ID (or they're not active)
  if (!pro) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-gray-700 mb-2">
            {t("Ο επαγγελματίας δεν βρέθηκε", "Professional not found")}
          </h1>
          <Link href="/services" className="text-sm text-[var(--color-primary)] hover:underline">
            ← {t("Πίσω στις υπηρεσίες", "Back to services")}
          </Link>
        </div>
      </div>
    );
  }

  // ─── PREPARE DISPLAY DATA ───
  // Look up the category object to get the emoji and translated name
  const category = CATEGORIES.find((c) => c.id === pro.category_id);

  // Extract the year the professional joined from their created_at timestamp
  const memberYear = new Date(pro.created_at).getFullYear().toString();

  // ─── RATING DISTRIBUTION ───
  // Calculate how many reviews exist for each star level (5, 4, 3, 2, 1)
  // Used to render the bar chart in the reviews tab
  const ratingDist = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
    percentage: reviews.length > 0
      ? (reviews.filter((r) => r.rating === stars).length / reviews.length) * 100
      : 0,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* ─── BACK BUTTON ─── */}
        {/* Returns the user to the search results page */}
        <Link href="/services" className="text-sm text-[var(--color-primary)] mb-4 inline-block hover:underline">
          ← {t("Πίσω στα αποτελέσματα", "Back to results")}
        </Link>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

          {/* ═══════════════════════════════════════════════════ */}
          {/* PROFILE HEADER                                     */}
          {/* Shows: avatar, name, category, location, rating,   */}
          {/* rank badge, member since, and booking/contact CTA   */}
          {/* ═══════════════════════════════════════════════════ */}
          <div className="p-6 border-b">
            <div className="flex items-start gap-4">
              {/* Category emoji as avatar (replaced by real photo later) */}
              <span className="text-6xl">{category?.emoji || "👤"}</span>

              <div className="flex-1">
                {/* Professional's full name */}
                <h1 className="text-2xl font-bold text-gray-900">
                  {pro.first_name} {pro.last_name}
                </h1>

                {/* Category name and city */}
                <p className="text-gray-500">
                  {category ? (lang === "el" ? category.nameEl : category.nameEn) : ""} • {pro.city}
                </p>

                {/* Star rating and review/job counts */}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-yellow-500">
                    {"★".repeat(Math.floor(pro.rating))}
                    {"☆".repeat(5 - Math.floor(pro.rating))}
                  </span>
                  <span className="font-semibold">{pro.rating}</span>
                  <span className="text-gray-500">
                    ({pro.review_count} {t("κριτικές", "reviews")})
                  </span>
                  <span className="text-gray-400">
                    • {pro.job_count} {t("εργασίες", "jobs")}
                  </span>
                </div>

                {/* Rank badge and membership date */}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {/* Rank position in their category for their city */}
                  <span
                    className="text-sm px-3 py-1 rounded-full font-semibold"
                    style={{ backgroundColor: "var(--color-bg-blue)", color: "var(--color-primary)" }}
                  >
                    #{pro.rank} {category ? (lang === "el" ? category.nameEl : category.nameEn) : ""} {t("στη", "in")} {pro.city}
                  </span>
                  {/* When they joined */}
                  <span className="text-sm text-gray-400">
                    {t("Μέλος από", "Member since")} {memberYear}
                  </span>
                </div>
              </div>
            </div>

            {/* ─── BOOKING OR CONTACT CTA ─── */}
            {/* If booking is enabled: show booking button + phone as fallback */}
            {/* If booking is disabled: show phone number as primary contact */}
            <div className="mt-6">
              {pro.booking_enabled ? (
                <div>
                  {/* Primary action: book online */}
                  <button
                    onClick={() => { setActiveTab("book"); setBookingSubmitted(false); }}
                    className="w-full py-3 text-white font-bold rounded-xl text-lg transition-all hover:opacity-90"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    📅 {t("Κλείσε Ραντεβού", "Book Appointment")}
                  </button>
                  {/* Fallback: phone number */}
                  <p className="text-center text-xs text-gray-400 mt-2">
                    {t("ή επικοινώνησε:", "or contact:")} {pro.phone}
                  </p>
                </div>
              ) : (
                /* Phone-only contact card */
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="font-semibold text-gray-700 mb-2">
                    📞 {t("Επικοινωνήστε", "Contact")}
                  </p>
                  <p className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
                    {pro.phone}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {t("Αυτός ο επαγγελματίας δέχεται ραντεβού μέσω τηλεφώνου",
                       "This professional accepts appointments by phone")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════ */}
          {/* TAB NAVIGATION                                     */}
          {/* About and Reviews always visible.                  */}
          {/* Book tab only visible if booking_enabled is true.  */}
          {/* ═══════════════════════════════════════════════════ */}
          <div className="flex border-b">
            {(["about", "reviews", ...(pro.booking_enabled ? ["book"] : [])] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as "about" | "reviews" | "book")}
                className={`flex-1 py-3 text-sm font-medium transition-all ${
                  activeTab === tab
                    ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "about"
                  ? t("Σχετικά", "About")
                  : tab === "reviews"
                    ? t("Κριτικές", "Reviews")
                    : t("Κράτηση", "Book")}
              </button>
            ))}
          </div>

          {/* ═══════════════════════════════════════════════════ */}
          {/* TAB CONTENT                                        */}
          {/* ═══════════════════════════════════════════════════ */}
          <div className="p-6">

            {/* ── ABOUT TAB ── */}
            {/* Shows bio, pricing, and location */}
            {activeTab === "about" && (
              <div>
                <h3 className="font-bold mb-2">{t("Περιγραφή", "About")}</h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">{pro.bio}</p>

                <h3 className="font-bold mb-2">{t("Τιμοκατάλογος", "Pricing")}</h3>
                <p className="text-gray-600 text-sm mb-6">{pro.price_text}</p>

                <h3 className="font-bold mb-2">{t("Τοποθεσία", "Location")}</h3>
                <p className="text-gray-600 text-sm">{pro.city}</p>
              </div>
            )}

            {/* ── REVIEWS TAB ── */}
            {/* Shows rating summary with bar chart + individual reviews */}
            {activeTab === "reviews" && (
              <div>
                {/* Rating summary box */}
                <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                  {/* Overall score */}
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">{pro.rating}</div>
                    <div className="text-yellow-500 text-sm">
                      {"★".repeat(Math.floor(pro.rating))}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {reviews.length} {t("κριτικές", "reviews")}
                    </div>
                  </div>
                  {/* Star distribution bars */}
                  <div className="flex-1">
                    {ratingDist.map((d) => (
                      <div key={d.stars} className="flex items-center gap-2 text-xs">
                        <span className="w-4">{d.stars}★</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{ width: d.percentage + "%" }}
                          ></div>
                        </div>
                        <span className="w-4 text-gray-400">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Individual review cards */}
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b last:border-0 py-4">
                      {/* Review date */}
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">
                          {new Date(review.created_at).toLocaleDateString("el-GR")}
                        </span>
                      </div>
                      {/* Star rating */}
                      <div className="text-yellow-500 text-sm mb-1">
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </div>
                      {/* Review text */}
                      <p className="text-sm text-gray-600">{review.text}</p>
                      {/* Verification badge */}
                      <span
                        className="text-xs mt-1 inline-block"
                        style={{
                          color: review.type === "verified"
                            ? "var(--color-success)"
                            : "#7D6608",
                        }}
                      >
                        {review.type === "verified"
                          ? "✓ Επαληθευμένη κράτηση"
                          : "Κριτική από υπάρχοντα πελάτη"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">
                    {t("Δεν υπάρχουν κριτικές ακόμα.", "No reviews yet.")}
                  </p>
                )}
              </div>
            )}

            {/* ── BOOKING TAB ── */}
            {/* Only visible if professional has booking_enabled = true */}
            {/* Shows a form to submit a booking request */}
            {activeTab === "book" && pro.booking_enabled && (
              <div>
                {!bookingSubmitted ? (
                  <div>
                    <h3 className="font-bold mb-4">
                      {t("Φόρμα Κράτησης", "Booking Form")}
                    </h3>
                    {/* Form fields in a 2-column grid on desktop */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        id="book-name"
                        name="name"
                        placeholder={t("Ονοματεπώνυμο *", "Full Name *")}
                        className="px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <input
                        id="book-phone"
                        name="phone"
                        placeholder={t("Τηλέφωνο *", "Phone *")}
                        className="px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <input
                        id="book-email"
                        name="email"
                        type="email"
                        placeholder="Email"
                        className="px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <input
                        id="book-area"
                        name="area"
                        placeholder={t("Περιοχή *", "Area *")}
                        className="px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <input
                        id="book-address"
                        name="address"
                        placeholder={t("Διεύθυνση", "Address")}
                        className="px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <input
                        id="book-date"
                        name="date"
                        type="date"
                        className="px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    {/* Job description textarea */}
                    <textarea
                      id="book-desc"
                      name="description"
                      placeholder={t("Περιγραφή εργασίας... *", "Job description... *")}
                      rows={3}
                      className="w-full mt-3 px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    {/* Submit button */}
                    <button
                      onClick={() => setBookingSubmitted(true)}
                      className="w-full mt-4 py-3 text-white font-bold rounded-xl transition-all hover:opacity-90"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      {t("Υποβολή Κράτησης", "Submit Booking")}
                    </button>
                  </div>
                ) : (
                  /* ── BOOKING SUCCESS MESSAGE ── */
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">✅</div>
                    <h3
                      className="text-xl font-bold mb-2"
                      style={{ color: "var(--color-success)" }}
                    >
                      {t("Η κράτησή σας υποβλήθηκε!", "Your booking has been submitted!")}
                    </h3>
                    <p className="text-gray-600">
                      {t("Ο επαγγελματίας θα επικοινωνήσει μαζί σας σύντομα.",
                         "The professional will contact you soon.")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}