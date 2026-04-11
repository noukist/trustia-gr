// =============================================================
// app/dashboard/page.tsx — Professional Dashboard
// =============================================================
// URL: mastori.gr/dashboard
//
// This is the professional's control center. They see:
// - Overview: key stats, ranking position, subscription status
// - Bookings: pending, confirmed, completed (accept/decline)
// - Reviews: all reviews received with ratings
// - Statistics: performance metrics with date range filter
//
// Later: Protected by auth — only logged-in professionals
// can access this. Data comes from Supabase.
// For now: demo data showing what it will look like.
// =============================================================

"use client";

import { useState } from "react";
import { CATEGORIES, DEMO_REVIEWS } from "@/lib/constants";

export default function DashboardPage() {
  // ─── STATE ───
  // activeTab: which section of the dashboard is showing
const [activeTab, setActiveTab] = useState("overview");
  const lang = "el";
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  // ─── DEMO DATA ───
  // Simulating logged-in professional: Nikos the plumber
  const pro = {
    name: "Νίκος Παπαδόπουλος",
    category: "Υδραυλικός",
    city: "Θεσσαλονίκη",
    rank: 1,
    rating: 4.9,
    reviewCount: 47,
    views: 1247,
    bookingsTotal: 47,
    completedJobs: 43,
    plan: "Ετήσιο Trades",
    price: "€15/μο",
    expires: "11/04/2027",
    founding: true,
  };

  // Demo bookings with different statuses
  const bookings = [
    {
      id: "bk-1",
      customer: "Μαρία Κ.",
      date: "15/04/2026",
      time: "10:00",
      status: "pending" as const,
      description: "Βλάβη σε σωλήνα κουζίνας",
      area: "Θέρμη",
      phone: "69X XXX XX10",
    },
    {
      id: "bk-2",
      customer: "Γιώργος Α.",
      date: "14/04/2026",
      time: "14:00",
      status: "confirmed" as const,
      description: "Εγκατάσταση θερμοσίφωνα",
      area: "Καλαμαριά",
      phone: "69X XXX XX11",
    },
    {
      id: "bk-3",
      customer: "Ελένη Δ.",
      date: "08/04/2026",
      time: "11:00",
      status: "completed" as const,
      description: "Αποφράξη μπάνιου",
      area: "Πυλαία",
      phone: "69X XXX XX12",
    },
    {
      id: "bk-4",
      customer: "Σοφία Μ.",
      date: "05/04/2026",
      time: "09:00",
      status: "completed" as const,
      description: "Αντικατάσταση μπαταρίας κουζίνας",
      area: "Κέντρο",
      phone: "69X XXX XX13",
    },
    {
      id: "bk-5",
      customer: "Κώστας Π.",
      date: "02/04/2026",
      time: "16:00",
      status: "cancelled" as const,
      description: "Διαρροή σε σωλήνα",
      area: "Πανόραμα",
      phone: "69X XXX XX14",
    },
  ];

  // Get reviews for this professional from demo data
  const reviews = DEMO_REVIEWS.filter((r) => r.professionalId === "pro-1");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* ─── DASHBOARD HEADER ─── */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--color-primary)" }}
          >
            {t("Πίνακας Ελέγχου", "Dashboard")}
          </h1>
          <span className="text-sm text-gray-500">
            {pro.name} — {pro.category}
          </span>
        </div>

        {/* ─── TAB NAVIGATION ─── */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {(
            [
              { id: "overview", labelEl: "Επισκόπηση", labelEn: "Overview" },
              { id: "bookings", labelEl: "Κρατήσεις", labelEn: "Bookings" },
              { id: "reviews", labelEl: "Κριτικές", labelEn: "Reviews" },
              { id: "stats", labelEl: "Στατιστικά", labelEn: "Statistics" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-gray-600 border hover:bg-gray-50"
              }`}
            >
              {t(tab.labelEl, tab.labelEn)}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* OVERVIEW TAB                                          */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div>
            {/* ── Key Stats Grid ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: t("Προβολές", "Views"), value: "1.247", icon: "👁️" },                { label: t("Κρατήσεις", "Bookings"), value: pro.bookingsTotal.toString(), icon: "📅" },
                { label: t("Βαθμολογία", "Rating"), value: pro.rating.toString(), icon: "⭐" },
                { label: t("Κριτικές", "Reviews"), value: pro.reviewCount.toString(), icon: "💬" },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border text-center">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div
                    className="text-2xl font-bold"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* ── Ranking Card ── */}
            <div className="bg-white rounded-xl p-4 border mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <span
                    className="text-lg font-bold"
                    style={{ color: "var(--color-primary)" }}
                  >
                    #{pro.rank} {pro.category} {t("στη", "in")} {pro.city}
                  </span>
                  <p className="text-sm text-gray-500">
                    {pro.rank === 1
                      ? t("Κορυφαία θέση! Συνέχισε έτσι.", "Top position! Keep it up.")
                      : t(
                          `Χρειάζεσαι 8 ακόμα κριτικές για το #${pro.rank - 1}.`,
                          `You need 8 more reviews for #${pro.rank - 1}.`
                        )}
                  </p>
                </div>
                <div className="text-4xl">🏆</div>
              </div>
            </div>

            {/* ── Subscription Card ── */}
            <div className="bg-white rounded-xl p-4 border">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">
                  {t("Συνδρομή", "Subscription")}
                </span>
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: "var(--color-bg-green)",
                    color: "var(--color-success)",
                  }}
                >
                  {t("Ενεργή", "Active")}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {t("Πλάνο:", "Plan:")} {pro.plan} • {pro.price} •{" "}
                {t("Λήξη:", "Expires:")} {pro.expires}
              </p>
              {pro.founding && (
                <p className="text-xs mt-1" style={{ color: "var(--color-accent)" }}>
                  🔒 {t("Κλειδωμένη τιμή Ιδρυτικού Μέλους", "Locked Founding Member Price")}
                </p>
              )}
            </div>

            {/* ── Recent Activity ── */}
            <div className="bg-white rounded-xl p-4 border mt-4">
              <h3 className="font-semibold text-sm mb-3">
                {t("Πρόσφατη Δραστηριότητα", "Recent Activity")}
              </h3>
              <div className="space-y-2 text-sm">
                {[
                  { icon: "📅", text: t("Νέα κράτηση από Μαρία Κ. — Θέρμη", "New booking from Maria K. — Thermi"), time: t("πριν 2 ώρες", "2 hours ago") },
                  { icon: "⭐", text: t("Νέα κριτική 5★ από Σοφία Μ.", "New 5★ review from Sofia M."), time: t("πριν 1 ημέρα", "1 day ago") },
                  { icon: "✅", text: t("Ολοκλήρωση εργασίας — Ελένη Δ.", "Job completed — Eleni D."), time: t("πριν 4 ημέρες", "4 days ago") },
                ].map((activity, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <span>{activity.icon}</span>
                      <span className="text-gray-700">{activity.text}</span>
                    </div>
                    <span className="text-xs text-gray-400">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* BOOKINGS TAB                                          */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "bookings" && (
          <div className="space-y-3">
            {/* Booking status filter */}
            <div className="flex gap-2 mb-4 text-xs">
              <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                {bookings.filter((b) => b.status === "pending").length} {t("Εκκρεμούν", "Pending")}
              </span>
              <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                {bookings.filter((b) => b.status === "confirmed").length} {t("Επιβεβαιωμένες", "Confirmed")}
              </span>
              <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">
                {bookings.filter((b) => b.status === "completed").length} {t("Ολοκληρωμένες", "Completed")}
              </span>
            </div>

            {/* Booking cards */}
            {bookings.map((bk) => (
              <div key={bk.id} className="bg-white rounded-xl p-4 border">
                {/* Header: customer name + status badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold">{bk.customer}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      bk.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : bk.status === "confirmed"
                          ? "bg-blue-100 text-blue-700"
                          : bk.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                    }`}
                  >
                    {bk.status === "pending"
                      ? t("Εκκρεμεί", "Pending")
                      : bk.status === "confirmed"
                        ? t("Επιβεβαιωμένη", "Confirmed")
                        : bk.status === "completed"
                          ? t("Ολοκληρώθηκε", "Completed")
                          : t("Ακυρωμένη", "Cancelled")}
                  </span>
                </div>

                {/* Booking details */}
                <p className="text-sm text-gray-600">{bk.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  📅 {bk.date} • {bk.time} • 📍 {bk.area} • 📞 {bk.phone}
                </p>

                {/* Action buttons for pending bookings */}
                {bk.status === "pending" && (
                  <div className="flex gap-2 mt-3">
                    <button
                      className="px-4 py-1.5 text-sm rounded-lg font-medium text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: "var(--color-success)" }}
                    >
                      ✓ {t("Αποδοχή", "Accept")}
                    </button>
                    <button className="px-4 py-1.5 bg-red-50 text-red-600 text-sm rounded-lg font-medium hover:bg-red-100 transition-all">
                      ✗ {t("Απόρριψη", "Decline")}
                    </button>
                  </div>
                )}

                {/* "Job completed?" button for confirmed bookings */}
                {bk.status === "confirmed" && (
                  <button
                    className="mt-3 px-4 py-1.5 text-sm rounded-lg font-medium text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    ✅ {t("Ολοκληρώθηκε η εργασία", "Mark as completed")}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* REVIEWS TAB                                           */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "reviews" && (
          <div>
            {/* Reviews summary */}
            <div className="bg-white rounded-xl p-4 border mb-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold" style={{ color: "var(--color-primary)" }}>
                    {pro.rating}
                  </div>
                  <div className="text-yellow-500 text-sm">
                    {"★".repeat(Math.floor(pro.rating))}
                  </div>
                  <div className="text-xs text-gray-500">
                    {pro.reviewCount} {t("κριτικές", "reviews")}
                  </div>
                </div>
                <div className="flex-1 text-sm text-gray-600">
                  <p>
                    {t(
                      "Οι κριτικές σου είναι ο #1 παράγοντας κατάταξης. Περισσότερες κριτικές = υψηλότερη θέση = περισσότεροι πελάτες.",
                      "Your reviews are the #1 ranking factor. More reviews = higher position = more customers."
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Individual review cards */}
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-xl p-4 border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{review.customerName}</span>
                      <span className="text-xs text-gray-400">{review.customerArea}</span>
                    </div>
                    <span className="text-xs text-gray-400">{review.date}</span>
                  </div>
                  <div className="text-yellow-500 text-sm my-1">
                    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                  </div>
                  <p className="text-sm text-gray-600">{review.text}</p>
                  <span
                    className="text-xs mt-1 inline-block"
                    style={{
                      color: review.type === "verified" ? "var(--color-success)" : "#7D6608",
                    }}
                  >
                    {review.type === "verified"
                      ? "✓ Επαληθευμένη κράτηση"
                      : "Κριτική από υπάρχοντα πελάτη"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* STATISTICS TAB                                        */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "stats" && (
          <div className="bg-white rounded-xl p-6 border">
            {/* Date range filter */}
            <div className="flex gap-3 mb-6 flex-wrap">
              <select className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
                <option>{t("Τελευταίες 30 ημέρες", "Last 30 days")}</option>
                <option>{t("Τελευταίοι 3 μήνες", "Last 3 months")}</option>
                <option>{t("Τελευταίοι 6 μήνες", "Last 6 months")}</option>
                <option>{t("Τελευταίος χρόνος", "Last year")}</option>
              </select>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { label: t("Προβολές προφίλ", "Profile Views"), value: "1,247" },
                { label: t("Κρατήσεις", "Bookings"), value: "47" },
                { label: t("Ολοκληρωμένες", "Completed"), value: "43 (91%)" },
                { label: t("Ακυρωμένες", "Cancelled"), value: "4 (9%)" },
                { label: t("Κριτικές", "Reviews"), value: "32" },
                { label: t("Μέση βαθμολογία", "Avg Rating"), value: "4.9 ⭐" },
                { label: t("Ρυθμός απόκρισης", "Response Rate"), value: "95%" },
                { label: t("Μέσος χρόνος απάντησης", "Avg Response Time"), value: "< 2 ώρες" },
                { label: t("Εκτιμώμενα έσοδα μέσω Mastori", "Estimated revenue via Mastori"), value: "~€3,440" },             ].map((stat, i) => (
                <div key={i}>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                  <div
                    className="text-xl font-bold"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Revenue breakdown info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl text-xs text-gray-500">
              <p className="font-semibold mb-1">{t("Πώς υπολογίζεται:", "How it's calculated:")}</p>
              <p>
                {t(
                  "Τα εκτιμώμενα έσοδα βασίζονται στις ολοκληρωμένες κρατήσεις μέσω Mastori.gr πολλαπλασιασμένα με τη μέση τιμή εργασίας της κατηγορίας σου. Δεν περιλαμβάνουν εργασίες εκτός πλατφόρμας.",
                  "Estimated revenue is based on completed bookings through Mastori.gr multiplied by the average job price for your category. Does not include off-platform jobs."
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}