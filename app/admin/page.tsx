// =============================================================
// app/admin/page.tsx — Admin Panel for Mastori.gr
// =============================================================
// URL: mastori.gr/admin
//
// This is YOUR control center. Only accessible by admin role.
// Later: protected by Supabase auth (role check).
// For now: accessible to anyone who knows the URL.
//
// Tabs:
// 1. Dashboard — key business metrics at a glance
// 2. Professionals — manage all professionals, subscriptions
// 3. Bookings — view all bookings across the platform
// 4. Reviews — moderate reviews (approve/remove)
// 5. Settings — manage categories, areas, announcements
//
// The moderator role will see a stripped-down version:
// only Reviews tab with approve/remove (no delete, no settings)
// =============================================================

"use client";

import { useState } from "react";
import {
  CATEGORIES,
  DEMO_PROFESSIONALS,
  DEMO_REVIEWS,
} from "@/lib/constants";

export default function AdminPage() {
  // ─── STATE ───
  const [activeTab, setActiveTab] = useState("dashboard");

  // Search/filter states for the professionals tab
  const [proSearch, setProSearch] = useState("");

  // Review moderation states
  const [reviewFilter, setReviewFilter] = useState("all");

  const lang = "el";
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  // ─── FILTERED PROFESSIONALS ───
  // Filter based on search input (name or category)
  const filteredPros = DEMO_PROFESSIONALS.filter(
    (pro) =>
      pro.name.toLowerCase().includes(proSearch.toLowerCase()) ||
      pro.categoryId.toLowerCase().includes(proSearch.toLowerCase())
  );

  // ─── PLATFORM STATS ───
  // These would come from Supabase queries in production
  const stats = {
    totalPros: DEMO_PROFESSIONALS.length,
    activePros: DEMO_PROFESSIONALS.filter((p) => true).length,
    totalBookings: 89,
    bookingsThisMonth: 23,
    totalReviews: DEMO_REVIEWS.length,
    revenue: 865,
    expiringSoon: 3,
    pendingBookings: 5,
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* ─── ADMIN HEADER ─── */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--color-primary)" }}
          >
            🔧 Admin Panel
          </h1>
          <span className="text-xs text-gray-400">
            {t("Σύνδεση ως: Admin", "Logged in as: Admin")}
          </span>
        </div>

        {/* ─── TAB NAVIGATION ─── */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "professionals", label: t("Επαγγελματίες", "Professionals") },
            { id: "bookings", label: t("Κρατήσεις", "Bookings") },
            { id: "reviews", label: t("Κριτικές", "Reviews") },
            { id: "settings", label: t("Ρυθμίσεις", "Settings") },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-gray-600 border hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* DASHBOARD TAB — Business overview at a glance         */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "dashboard" && (
          <div>
            {/* Key metrics grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: t("Ενεργοί Επαγγ.", "Active Pros"), value: stats.activePros.toString(), icon: "👥" },
                { label: t("Κρατήσεις (μήνας)", "Bookings (month)"), value: stats.bookingsThisMonth.toString(), icon: "📅" },
                { label: t("Έσοδα (μήνας)", "Revenue (month)"), value: "€" + stats.revenue, icon: "💰" },
                { label: t("Λήξη < 30 ημ.", "Expiring < 30d"), value: stats.expiringSoon + " ⚠️", icon: "⏰" },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl p-4 text-center border">
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

            {/* Expiring subscriptions alert */}
            <div className="bg-white rounded-xl p-4 border mb-4">
              <h3 className="font-bold text-sm mb-3">
                ⚠️ {t("Συνδρομές που λήγουν σύντομα", "Expiring Subscriptions")}
              </h3>
              {[
                { name: "Γιώργος Αλεξίου", category: "Ηλεκτρολόγος", expires: "25/04/2026", daysLeft: 13 },
                { name: "Αναστασία Παπούλη", category: "Καθαρισμός", expires: "02/05/2026", daysLeft: 20 },
                { name: "Κώστας Ιωαννίδης", category: "Ελαιοχρωματιστής", expires: "10/05/2026", daysLeft: 28 },
              ].map((sub, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
                >
                  <div>
                    <span className="font-medium">{sub.name}</span>
                    <span className="text-gray-400"> — {sub.category}</span>
                    <span className="text-gray-400"> — {t("λήξη", "expires")} {sub.expires}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-500">
                      {sub.daysLeft} {t("ημέρες", "days")}
                    </span>
                    <button className="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-all">
                      {t("Υπενθύμιση Email", "Email Reminder")}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-xl p-4 border">
              <h3 className="font-bold text-sm mb-3">
                {t("Γρήγορες Ενέργειες", "Quick Actions")}
              </h3>
              <div className="flex flex-wrap gap-2">
                <button className="px-4 py-2 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 transition-all">
                  + {t("Νέος Επαγγελματίας", "New Professional")}
                </button>
                <button className="px-4 py-2 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition-all">
                  📧 {t("Μαζική Αποστολή", "Bulk Email")}
                </button>
                <button className="px-4 py-2 bg-purple-100 text-purple-700 text-sm rounded-lg hover:bg-purple-200 transition-all">
                  📊 {t("Εξαγωγή Αναφοράς", "Export Report")}
                </button>
                <button className="px-4 py-2 bg-amber-100 text-amber-700 text-sm rounded-lg hover:bg-amber-200 transition-all">
                  🔔 {t("Διαχείριση Ανακοινώσεων", "Manage Announcements")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* PROFESSIONALS TAB — Manage all professionals          */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "professionals" && (
          <div className="bg-white rounded-xl border overflow-hidden">
            {/* Search bar and add button */}
            <div className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <input
                value={proSearch}
                onChange={(e) => setProSearch(e.target.value)}
                placeholder={t("Αναζήτηση επαγγελματία...", "Search professional...")}
                className="px-4 py-2 border rounded-lg text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button
                className="px-4 py-2 text-white text-sm rounded-lg transition-all hover:opacity-90"
                style={{ backgroundColor: "var(--color-success)" }}
              >
                + {t("Προσθήκη Επαγγελματία", "Add Professional")}
              </button>
            </div>

            {/* Professionals table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      t("Όνομα", "Name"),
                      t("Κατηγορία", "Category"),
                      t("Πλάνο", "Plan"),
                      t("Λήξη", "Expires"),
                      t("Κριτικές", "Reviews"),
                      t("Κατάσταση", "Status"),
                      t("Ενέργειες", "Actions"),
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-left font-semibold text-gray-600"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPros.map((pro) => {
                    const cat = CATEGORIES.find((c) => c.id === pro.categoryId);
                    return (
                      <tr key={pro.id} className="border-b hover:bg-gray-50">
                        {/* Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{pro.avatar}</span>
                            <div>
                              <div className="font-medium">{pro.name}</div>
                              <div className="text-xs text-gray-400">{pro.phone}</div>
                            </div>
                          </div>
                        </td>
                        {/* Category */}
                        <td className="px-4 py-3">
                          {cat ? (lang === "el" ? cat.nameEl : cat.nameEn) : pro.categoryId}
                        </td>
                        {/* Plan */}
                        <td className="px-4 py-3">
                          €{
                            pro.tier === "light" ? "10" : pro.tier === "trades" ? "15" : "25"
                          }/μο {t("Ετήσιο", "Annual")}
                        </td>
                        {/* Expires */}
                        <td className="px-4 py-3">11/04/2027</td>
                        {/* Reviews */}
                        <td className="px-4 py-3">
                          ⭐ {pro.rating} ({pro.reviewCount})
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          <span
                            className="text-xs px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: "var(--color-bg-green)",
                              color: "var(--color-success)",
                            }}
                          >
                            {t("Ενεργός", "Active")}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button className="text-xs text-blue-600 hover:underline">
                              {t("Επεξεργασία", "Edit")}
                            </button>
                            <button className="text-xs text-red-600 hover:underline">
                              {t("Απενεργοποίηση", "Deactivate")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table footer with count */}
            <div className="p-4 border-t bg-gray-50 text-xs text-gray-500">
              {filteredPros.length} {t("επαγγελματίες", "professionals")}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* BOOKINGS TAB — All platform bookings                  */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "bookings" && (
          <div className="bg-white rounded-xl p-4 border">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-bold">
                {t("Όλες οι Κρατήσεις", "All Bookings")}
              </h3>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                  5 {t("Εκκρεμούν", "Pending")}
                </span>
                <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  8 {t("Επιβεβαιωμένες", "Confirmed")}
                </span>
                <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">
                  67 {t("Ολοκληρωμένες", "Completed")}
                </span>
                <span className="px-2 py-1 rounded-full bg-red-100 text-red-700">
                  9 {t("Ακυρωμένες", "Cancelled")}
                </span>
              </div>
            </div>

            {/* Booking list */}
            <div className="space-y-2">
              {[
                { customer: "Μαρία Κ.", pro: "Νίκος Π.", category: "Υδραυλικός", date: "15/04", time: "10:00", area: "Θέρμη", status: "pending" },
                { customer: "Γιώργος Α.", pro: "Νίκος Π.", category: "Υδραυλικός", date: "14/04", time: "14:00", area: "Καλαμαριά", status: "confirmed" },
                { customer: "Δήμητρα Σ.", pro: "Ελένη Δ.", category: "Τεχνίτρια Νυχιών", date: "13/04", time: "11:00", area: "Κέντρο", status: "confirmed" },
                { customer: "Αλέξανδρος Γ.", pro: "Κώστας Ι.", category: "Ελαιοχρωματιστής", date: "12/04", time: "09:00", area: "Τούμπα", status: "completed" },
                { customer: "Σοφία Μ.", pro: "Νίκος Π.", category: "Υδραυλικός", date: "08/04", time: "11:00", area: "Πυλαία", status: "completed" },
                { customer: "Βασίλης Ν.", pro: "Γιώργος Α.", category: "Ηλεκτρολόγος", date: "05/04", time: "15:00", area: "Θέρμη", status: "cancelled" },
              ].map((bk, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm hover:bg-gray-100 transition-all"
                >
                  <div className="flex-1">
                    <span className="font-medium">{bk.customer}</span>
                    <span className="text-gray-400"> → </span>
                    <span className="font-medium">{bk.pro}</span>
                    <span className="text-gray-400"> ({bk.category})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      📅 {bk.date} {bk.time} • 📍 {bk.area}
                    </span>
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
                          ? t("Επιβεβ.", "Confirmed")
                          : bk.status === "completed"
                            ? t("Ολοκλ.", "Completed")
                            : t("Ακυρωμ.", "Cancelled")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* REVIEWS TAB — Moderate reviews                        */}
        {/* This tab is also visible to Moderator role            */}
        {/* Moderator can: approve, remove (soft delete)          */}
        {/* Moderator cannot: permanently delete, access other tabs*/}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "reviews" && (
          <div className="bg-white rounded-xl p-4 border">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-bold">{t("Διαχείριση Κριτικών", "Review Moderation")}</h3>
              <div className="flex gap-2">
                {["all", "verified", "founding"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setReviewFilter(filter)}
                    className={`text-xs px-3 py-1 rounded-lg transition-all ${
                      reviewFilter === filter
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {filter === "all"
                      ? t("Όλες", "All")
                      : filter === "verified"
                        ? t("Επαληθευμένες", "Verified")
                        : t("Ιδρυτικές", "Founding")}
                  </button>
                ))}
              </div>
            </div>

            {/* Review list */}
            <div className="space-y-3">
              {DEMO_REVIEWS.filter(
                (r) => reviewFilter === "all" || r.type === reviewFilter
              ).map((review) => {
                // Find the professional this review is for
                const pro = DEMO_PROFESSIONALS.find(
                  (p) => p.id === review.professionalId
                );

                return (
                  <div key={review.id} className="border rounded-xl p-4">
                    {/* Review header */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">
                            {review.customerName}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="font-medium text-sm">
                            {pro ? pro.name : "Unknown"}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({pro ? (lang === "el" ? CATEGORIES.find((c) => c.id === pro.categoryId)?.nameEl : CATEGORIES.find((c) => c.id === pro.categoryId)?.nameEn) : ""})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-yellow-500 text-sm">
                            {"★".repeat(review.rating)}
                            {"☆".repeat(5 - review.rating)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {review.date}
                          </span>
                          <span
                            className="text-xs"
                            style={{
                              color:
                                review.type === "verified"
                                  ? "var(--color-success)"
                                  : "#7D6608",
                            }}
                          >
                            {review.type === "verified"
                              ? "✓ Επαληθευμένη"
                              : "Ιδρυτική"}
                          </span>
                        </div>
                      </div>

                      {/* Moderation actions */}
                      <div className="flex gap-2 shrink-0">
                        <button
                          className="text-xs px-3 py-1 rounded-lg transition-all"
                          style={{
                            backgroundColor: "var(--color-bg-green)",
                            color: "var(--color-success)",
                          }}
                        >
                          ✓ {t("Έγκριση", "Approve")}
                        </button>
                        <button className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all">
                          ✗ {t("Απόκρυψη", "Hide")}
                        </button>
                      </div>
                    </div>

                    {/* Review text */}
                    <p className="text-sm text-gray-600">{review.text}</p>

                    {/* Review ID for audit trail */}
                    <p className="text-xs text-gray-300 mt-2">
                      ID: {review.id}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* SETTINGS TAB — Platform configuration                 */}
        {/* Admin only — moderators cannot access this tab        */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Announcement Management */}
            <div className="bg-white rounded-xl p-4 border">
              <h3 className="font-bold mb-4">
                🔔 {t("Διαχείριση Ανακοινώσεων", "Announcement Management")}
              </h3>
              <div className="space-y-3">
                {/* Current announcement */}
                <div className="border rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">
                      {t("Τρέχουσα Ανακοίνωση", "Current Announcement")}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                      {t("Ενεργή", "Active")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    🔥 Ιδρυτικό Μέλος — Κλειδωμένη τιμή για πάντα — Απομένουν 50 θέσεις →
                  </p>
                  <div className="flex gap-2">
                    <button className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                      {t("Επεξεργασία", "Edit")}
                    </button>
                    <button className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                      {t("Απενεργοποίηση", "Disable")}
                    </button>
                  </div>
                </div>
                <button className="text-sm text-[var(--color-primary)] hover:underline">
                  + {t("Νέα Ανακοίνωση", "New Announcement")}
                </button>
              </div>
            </div>

            {/* Category Management */}
            <div className="bg-white rounded-xl p-4 border">
              <h3 className="font-bold mb-4">
                📂 {t("Διαχείριση Κατηγοριών", "Category Management")}
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                {t(
                  "Κατηγορίες χωρίς ενεργούς επαγγελματίες αποκρύπτονται αυτόματα από τους πελάτες.",
                  "Categories with no active professionals are automatically hidden from customers."
                )}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {CATEGORIES.slice(0, 12).map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs"
                  >
                    <span>
                      {cat.emoji} {lang === "el" ? cat.nameEl : cat.nameEn}
                    </span>
                    <span className="text-green-600">✓</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {t(`Σύνολο: ${CATEGORIES.length} κατηγορίες`, `Total: ${CATEGORIES.length} categories`)}
              </p>
            </div>

            {/* Pricing Management */}
            <div className="bg-white rounded-xl p-4 border">
              <h3 className="font-bold mb-4">
                💰 {t("Διαχείριση Τιμών", "Pricing Management")}
              </h3>
              <p className="text-xs text-gray-400 mb-3">
                {t(
                  "Μόνο ο Admin μπορεί να αλλάξει τιμές. Οι αλλαγές καταγράφονται στο audit log.",
                  "Only Admin can change prices. Changes are logged in the audit trail."
                )}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Tier</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">{t("Ετήσιο", "Annual")}</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">{t("Εξαμηνιαίο", "Semi")}</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">{t("Μηνιαίο", "Monthly")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-3 py-2 font-medium">{t("Καθαρισμός & Ελαφριές", "Cleaning & Light")}</td>
                      <td className="px-3 py-2 text-center">€10/μο</td>
                      <td className="px-3 py-2 text-center">€15/μο</td>
                      <td className="px-3 py-2 text-center">€20/μο</td>
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="px-3 py-2 font-medium">{t("Τεχνικά & Ομορφιά", "Trades & Beauty")}</td>
                      <td className="px-3 py-2 text-center">€15/μο</td>
                      <td className="px-3 py-2 text-center">€20/μο</td>
                      <td className="px-3 py-2 text-center">€25/μο</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-medium">{t("Ειδικοί & Εργολάβοι", "Specialists")}</td>
                      <td className="px-3 py-2 text-center">€25/μο</td>
                      <td className="px-3 py-2 text-center">€35/μο</td>
                      <td className="px-3 py-2 text-center">€45/μο</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button className="mt-3 text-xs text-[var(--color-primary)] hover:underline">
                {t("Επεξεργασία τιμών", "Edit pricing")}
              </button>
            </div>

            {/* Audit Log Preview */}
            <div className="bg-white rounded-xl p-4 border">
              <h3 className="font-bold mb-4">
                📋 {t("Πρόσφατο Audit Log", "Recent Audit Log")}
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  { time: "12/04 01:30", user: "Admin", action: t("Ενεργοποίηση επαγγελματία", "Activated professional"), target: "Σοφία Καραγιάννη" },
                  { time: "11/04 18:15", user: "Admin", action: t("Δημιουργία κράτησης", "Created booking"), target: "Μαρία Κ. → Νίκος Π." },
                  { time: "11/04 14:00", user: "Admin", action: t("Έγκριση κριτικής", "Approved review"), target: "rev-7" },
                  { time: "10/04 09:30", user: "Admin", action: t("Ενημέρωση ανακοίνωσης", "Updated announcement"), target: "Founding member banner" },
                ].map((log, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-2 border-b last:border-0 text-gray-600"
                  >
                    <span className="text-gray-400 w-24 shrink-0">{log.time}</span>
                    <span className="font-medium w-16 shrink-0">{log.user}</span>
                    <span>{log.action}</span>
                    <span className="text-gray-400">— {log.target}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}