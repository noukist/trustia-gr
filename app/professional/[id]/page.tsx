// =============================================================
// app/professional/[id]/page.tsx — Professional Profile page
// =============================================================
// URL: mastori.gr/professional/pro-1 (dynamic based on ID)
//
// This is the most important page for conversions.
// A customer clicks a professional from search results and
// lands here. They need to see:
// - Who this person is (photo, name, bio, experience)
// - Can they be trusted (rating, verified reviews, photos)
// - How to hire them (booking form or phone number)
// - Where they work (base location + service areas)
// - Their ranking (#1 Υδραυλικός στη Θεσσαλονίκη)
//
// The page has tabs: About | Reviews | Book (if enabled)
// This keeps the page clean — info is organized, not dumped.
//
// Later: Data comes from Supabase. For now, DEMO_PROFESSIONALS.
// =============================================================

"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CATEGORIES,
  DEMO_PROFESSIONALS,
  DEMO_REVIEWS,
} from "@/lib/constants";

export default function ProfessionalProfilePage() {
  // ─── GET PROFESSIONAL ID FROM URL ───
  // useParams() extracts the [id] from the URL
  // e.g., /professional/pro-1 → params.id = "pro-1"
  const params = useParams();
  const proId = params.id as string;

  // ─── FIND THE PROFESSIONAL ───
  // Look up the professional in our demo data
  const pro = DEMO_PROFESSIONALS.find((p) => p.id === proId);

  // ─── STATE ───
  // activeTab: which tab is currently showing
  const [activeTab, setActiveTab] = useState<"about" | "reviews" | "book">("about");

  // bookingSubmitted: whether the booking form was submitted (for success message)
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  const lang = "el";
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  // ─── HANDLE: PROFESSIONAL NOT FOUND ───
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

  // Look up category info
  const category = CATEGORIES.find((c) => c.id === pro.categoryId);

  // Get reviews for this professional
  const reviews = DEMO_REVIEWS.filter((r) => r.professionalId === pro.id);

  // Calculate rating distribution for the bar chart
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
        <Link
          href="/services"
          className="text-sm text-[var(--color-primary)] mb-4 inline-block hover:underline"
        >
          ← {t("Πίσω στα αποτελέσματα", "Back to results")}
        </Link>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* PROFILE HEADER — Name, photo, rating, rank, contact   */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <span className="text-6xl">{pro.avatar}</span>

              <div className="flex-1">
                {/* Name */}
                <h1 className="text-2xl font-bold text-gray-900">{pro.name}</h1>

                {/* Category and location */}
                <p className="text-gray-500">
                  {category ? (lang === "el" ? category.nameEl : category.nameEn) : ""} •{" "}
                  {pro.city}, {pro.baseArea}
                </p>

                {/* Rating stars and counts */}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-yellow-500">
                    {"★".repeat(Math.floor(pro.rating))}
                    {"☆".repeat(5 - Math.floor(pro.rating))}
                  </span>
                  <span className="font-semibold">{pro.rating}</span>
                  <span className="text-gray-500">
                    ({pro.reviewCount} {t("κριτικές", "reviews")})
                  </span>
                  <span className="text-gray-400">
                    • {pro.jobCount} {t("εργασίες", "jobs")}
                  </span>
                </div>

                {/* Rank badge and member since */}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span
                    className="text-sm px-3 py-1 rounded-full font-semibold"
                    style={{
                      backgroundColor: "var(--color-bg-blue)",
                      color: "var(--color-primary)",
                    }}
                  >
                    #{pro.rank} {category ? (lang === "el" ? category.nameEl : category.nameEn) : ""}{" "}
                    {t("στη", "in")} {pro.city}
                  </span>
                  <span className="text-sm text-gray-400">
                    {t("Μέλος από", "Member since")} {pro.memberSince}
                  </span>
                </div>
              </div>
            </div>

            {/* ── BOOKING OR CONTACT ── */}
            <div className="mt-6">
              {pro.bookingEnabled ? (
                <div>
                  <button
                    onClick={() => {
                      setActiveTab("book");
                      setBookingSubmitted(false);
                    }}
                    className="
                      w-full py-3 text-white font-bold rounded-xl
                      text-lg transition-all hover:opacity-90
                    "
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    📅 {t("Κλείσε Ραντεβού", "Book Appointment")}
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-2">
                    {t("ή επικοινώνησε:", "or contact:")} {pro.phone}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="font-semibold text-gray-700 mb-2">
                    📞 {t("Επικοινωνήστε", "Contact")}
                  </p>
                  <p
                    className="text-lg font-bold"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {pro.phone}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {t(
                      "Αυτός ο επαγγελματίας δέχεται ραντεβού μέσω τηλεφώνου",
                      "This professional accepts appointments by phone"
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* TABS — About | Reviews | Book (if enabled)            */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="flex border-b">
            {(["about", "reviews", ...(pro.bookingEnabled ? ["book"] : [])] as const).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as "about" | "reviews" | "book")}
                  className={`
                    flex-1 py-3 text-sm font-medium transition-all
                    ${activeTab === tab
                      ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]"
                      : "text-gray-500 hover:text-gray-700"
                    }
                  `}
                >
                  {tab === "about"
                    ? t("Σχετικά", "About")
                    : tab === "reviews"
                      ? t("Κριτικές", "Reviews")
                      : t("Κράτηση", "Book")}
                </button>
              )
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* TAB CONTENT                                           */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="p-6">
            {/* ── ABOUT TAB ── */}
            {activeTab === "about" && (
              <div>
                <h3 className="font-bold mb-2">{t("Περιγραφή", "About")}</h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">{pro.bio}</p>

                <h3 className="font-bold mb-2">{t("Τιμοκατάλογος", "Pricing")}</h3>
                <p className="text-gray-600 text-sm mb-6">{pro.priceText}</p>

                <h3 className="font-bold mb-2">{t("Βάση", "Base Location")}</h3>
                <p className="text-gray-600 text-sm mb-2">{pro.baseArea}, {pro.city}</p>

                <h3 className="font-bold mb-2 mt-4">{t("Εξυπηρετεί", "Service Areas")}</h3>
                <div className="flex flex-wrap gap-2">
                  {pro.serviceAreaIds.map((areaId) => (
                    <span
                      key={areaId}
                      className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600"
                    >
                      {areaId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── REVIEWS TAB ── */}
            {activeTab === "reviews" && (
              <div>
                {/* Rating summary box */}
                <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">{pro.rating}</div>
                    <div className="text-yellow-500 text-sm">
                      {"★".repeat(Math.floor(pro.rating))}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {pro.reviewCount} {t("κριτικές", "reviews")}
                    </div>
                  </div>
                  {/* Rating distribution bars */}
                  <div className="flex-1">
                    {ratingDist.map((d) => (
                      <div key={d.stars} className="flex items-center gap-2 text-xs">
                        <span className="w-4">{d.stars}★</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full transition-all"
                            style={{ width: `${d.percentage}%` }}
                          ></div>
                        </div>
                        <span className="w-4 text-gray-400">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Individual reviews */}
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b last:border-0 py-4">
                      {/* Reviewer name, area, and date */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{review.customerName}</span>
                          <span className="text-xs text-gray-400">{review.customerArea}</span>
                        </div>
                        <span className="text-xs text-gray-400">{review.date}</span>
                      </div>

                      {/* Star rating */}
                      <div className="text-yellow-500 text-sm mb-1">
                        {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                      </div>

                      {/* Review text */}
                      <p className="text-sm text-gray-600">{review.text}</p>

                      {/* Verified badge */}
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
            {activeTab === "book" && pro.bookingEnabled && (
              <div>
                {!bookingSubmitted ? (
                  <div>
                    <h3 className="font-bold mb-4">{t("Φόρμα Κράτησης", "Booking Form")}</h3>
                    {/* Booking form fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        placeholder={t("Ονοματεπώνυμο *", "Full Name *")}
                        className="px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <input
                        placeholder={t("Τηλέφωνο *", "Phone *")}
                        className="px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <input
                        placeholder="Email"
                        type="email"
                        className="px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <input
                        placeholder={t("Περιοχή *", "Area *")}
                        className="px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <input
                        placeholder={t("Διεύθυνση", "Address")}
                        className="px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <input
                        type="date"
                        className="px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    <textarea
                      placeholder={t("Περιγραφή εργασίας... *", "Job description... *")}
                      rows={3}
                      className="w-full mt-3 px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <button
                      onClick={() => setBookingSubmitted(true)}
                      className="
                        w-full mt-4 py-3 text-white font-bold
                        rounded-xl transition-all hover:opacity-90
                      "
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      {t("Υποβολή Κράτησης", "Submit Booking")}
                    </button>
                  </div>
                ) : (
                  /* ── BOOKING SUCCESS ── */
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">✅</div>
                    <h3
                      className="text-xl font-bold mb-2"
                      style={{ color: "var(--color-success)" }}
                    >
                      {t("Η κράτησή σας υποβλήθηκε!", "Your booking has been submitted!")}
                    </h3>
                    <p className="text-gray-600">
                      {t(
                        "Ο επαγγελματίας θα επικοινωνήσει μαζί σας σύντομα.",
                        "The professional will contact you soon."
                      )}
                    </p>
                    <button
                      onClick={() => setBookingSubmitted(false)}
                      className="mt-6 px-6 py-2 bg-gray-100 rounded-xl text-sm hover:bg-gray-200"
                    >
                      {t("Νέα κράτηση", "New booking")}
                    </button>
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