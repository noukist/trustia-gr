// =============================================================
// app/dashboard/page.tsx — Professional Dashboard
// =============================================================
// URL: trustia.gr/dashboard
//
// This is the professional's control center after login.
// It pulls REAL data from Supabase for the logged-in user:
// - Overview: stats, ranking, subscription status
// - Bookings: pending, confirmed, completed
// - Reviews: all reviews with ratings
// - Statistics: performance metrics
//
// Data flow:
// 1. Check if user is logged in via Supabase Auth
// 2. Find their professional profile by user_id
// 3. Fetch their bookings and reviews
// 4. Display everything in organized tabs
//
// If the user is not a professional, redirect to homepage.
// If not logged in, redirect to login page.
// =============================================================

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/constants";
import Link from "next/link";

// -------------------------------------------------------------
// TypeScript interfaces — match Supabase table columns
// -------------------------------------------------------------
interface Professional {
  id: string;
  first_name: string;
  last_name: string;
  category_id: string;
  tier: string;
  city: string;
  rank: number;
  rating: number;
  review_count: number;
  job_count: number;
  booking_enabled: boolean;
  featured: boolean;
  price_text: string;
  created_at: string;
}

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  description: string;
  status: string;
  created_at: string;
}

interface Review {
  id: string;
  rating: number;
  text: string;
  type: string;
  created_at: string;
}

export default function DashboardPage() {
  // ─── STATE ───
  // activeTab: which section of the dashboard is visible
  const [activeTab, setActiveTab] = useState("overview");

  // pro: the logged-in professional's data (null if not found)
  const [pro, setPro] = useState<Professional | null>(null);

  // bookings: all bookings for this professional
  const [bookings, setBookings] = useState<Booking[]>([]);

  // reviews: all reviews for this professional
  const [reviews, setReviews] = useState<Review[]>([]);

  // loading: shows spinner while data loads
  const [loading, setLoading] = useState(true);

  // notPro: true if logged-in user is not a registered professional
  const [notPro, setNotPro] = useState(false);

  // Language helper — hardcoded for now, context later
  const lang = "el";
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  // ─── FETCH ALL DASHBOARD DATA ───
  // Runs once on page load:
  // 1. Get logged-in user from Supabase Auth
  // 2. Find their professional profile
  // 3. Fetch their bookings and reviews
  useEffect(() => {
    async function fetchDashboard() {
      // Step 1: Check if user is logged in
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        // Not logged in — redirect to login
        window.location.href = "/login";
        return;
      }

      // Step 2: Find professional profile linked to this user
      const { data: proData } = await supabase
        .from("professionals")
        .select("*")
        .eq("user_id", authData.user.id)
        .single();

      if (!proData) {
        // User exists but is not a registered professional
        setNotPro(true);
        setLoading(false);
        return;
      }

      setPro(proData);

      // Step 3: Fetch bookings for this professional
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("*")
        .eq("professional_id", proData.id)
        .order("booking_date", { ascending: false });

      if (bookingData) setBookings(bookingData);

      // Step 4: Fetch reviews for this professional
      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*")
        .eq("professional_id", proData.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (reviewData) setReviews(reviewData);

      setLoading(false);
    }
    fetchDashboard();
  }, []);

  // ─── LOADING STATE ───
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-3xl">⏳</div>
      </div>
    );
  }

  // ─── NOT A PROFESSIONAL ───
  // If the logged-in user hasn't registered as a professional
  if (notPro) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">👤</div>
          <h1 className="text-xl font-bold text-gray-700 mb-2">
            {t("Δεν είστε εγγεγραμμένος επαγγελματίας", "You are not a registered professional")}
          </h1>
          <p className="text-gray-500 text-sm mb-4">
            {t(
              "Αυτός ο πίνακας ελέγχου είναι μόνο για επαγγελματίες. Θέλετε να εγγραφείτε;",
              "This dashboard is for professionals only. Would you like to register?"
            )}
          </p>
          <Link
            href="/register"
            className="inline-block px-6 py-3 text-white font-bold rounded-xl"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {t("Εγγραφή Επαγγελματία →", "Professional Registration →")}
          </Link>
        </div>
      </div>
    );
  }

  // ─── PROFESSIONAL NOT FOUND (safety check) ───
  if (!pro) return null;

  // ─── DERIVED DATA ───
  // Look up category info for display
  const category = CATEGORIES.find((c) => c.id === pro.category_id);
  const categoryName = category ? (lang === "el" ? category.nameEl : category.nameEn) : "";

  // Count bookings by status for the filter badges
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;
  const cancelledCount = bookings.filter((b) => b.status === "cancelled").length;

  // Calculate estimated revenue (completed bookings × average job value)
  // This is a rough estimate — we use category averages
  const avgJobValue = pro.tier === "light" ? 40 : pro.tier === "trades" ? 80 : 200;
  const estimatedRevenue = completedCount * avgJobValue;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* ─── DASHBOARD HEADER ─── */}
        {/* Shows professional name and category */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--color-primary)" }}
          >
            {t("Πίνακας Ελέγχου", "Dashboard")}
          </h1>
          <span className="text-sm text-gray-500">
            {pro.first_name} {pro.last_name} — {categoryName}
          </span>
        </div>

        {/* ─── TAB NAVIGATION ─── */}
        {/* Four tabs: Overview, Bookings, Reviews, Statistics */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: "overview", labelEl: "Επισκόπηση", labelEn: "Overview" },
            { id: "bookings", labelEl: "Κρατήσεις", labelEn: "Bookings" },
            { id: "reviews", labelEl: "Κριτικές", labelEn: "Reviews" },
            { id: "stats", labelEl: "Στατιστικά", labelEn: "Statistics" },
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
              {t(tab.labelEl, tab.labelEn)}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* OVERVIEW TAB                                          */}
        {/* Key metrics, ranking position, subscription status    */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div>
            {/* ── Key Stats Grid ── */}
            {/* Four cards showing the most important numbers */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                {
                  label: t("Κρατήσεις", "Bookings"),
                  value: bookings.length.toString(),
                  icon: "📅",
                },
                {
                  label: t("Ολοκληρωμένες", "Completed"),
                  value: completedCount.toString(),
                  icon: "✅",
                },
                {
                  label: t("Βαθμολογία", "Rating"),
                  value: pro.rating.toString(),
                  icon: "⭐",
                },
                {
                  label: t("Κριτικές", "Reviews"),
                  value: pro.review_count.toString(),
                  icon: "💬",
                },
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
            {/* Shows the professional's rank in their category/city */}
            <div className="bg-white rounded-xl p-4 border mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <span
                    className="text-lg font-bold"
                    style={{ color: "var(--color-primary)" }}
                  >
                    #{pro.rank} {categoryName} {t("στη", "in")} {pro.city}
                  </span>
                  <p className="text-sm text-gray-500">
                    {pro.rank === 1
                      ? t("Κορυφαία θέση! Συνέχισε έτσι.", "Top position! Keep it up.")
                      : t(
                          "Περισσότερες κριτικές = υψηλότερη θέση",
                          "More reviews = higher position"
                        )}
                  </p>
                </div>
                <div className="text-4xl">🏆</div>
              </div>
            </div>

            {/* ── Price Info ── */}
            {/* Shows current pricing (optional field) */}
            <div className="bg-white rounded-xl p-4 border mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-sm">
                    {t("Τιμοκατάλογος", "Pricing")}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    {pro.price_text
                      ? pro.price_text
                      : t(
                          "Δεν έχετε ορίσει τιμές (προαιρετικό)",
                          "No pricing set (optional)"
                        )}
                  </p>
                </div>
                <button className="text-xs text-[var(--color-primary)] hover:underline">
                  {t("Επεξεργασία", "Edit")}
                </button>
              </div>
            </div>

            {/* ── Booking Status ── */}
            {/* Shows whether online booking is enabled */}
            <div className="bg-white rounded-xl p-4 border">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-sm">
                    {t("Online Κρατήσεις", "Online Bookings")}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    {pro.booking_enabled
                      ? t("Ενεργοποιημένες — οι πελάτες μπορούν να κλείσουν ραντεβού",
                          "Enabled — customers can book appointments")
                      : t("Απενεργοποιημένες — μόνο τηλεφωνική επικοινωνία",
                          "Disabled — phone contact only")}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: pro.booking_enabled
                      ? "var(--color-bg-green)"
                      : "var(--color-bg-amber)",
                    color: pro.booking_enabled
                      ? "var(--color-success)"
                      : "#7D6608",
                  }}
                >
                  {pro.booking_enabled
                    ? t("Ενεργές", "Active")
                    : t("Ανενεργές", "Inactive")}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* BOOKINGS TAB                                          */}
        {/* Shows all bookings with status badges and actions     */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "bookings" && (
          <div className="space-y-3">
            {/* ── Status filter badges ── */}
            <div className="flex gap-2 mb-4 text-xs flex-wrap">
              <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                {pendingCount} {t("Εκκρεμούν", "Pending")}
              </span>
              <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                {confirmedCount} {t("Επιβεβαιωμένες", "Confirmed")}
              </span>
              <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">
                {completedCount} {t("Ολοκληρωμένες", "Completed")}
              </span>
              <span className="px-2 py-1 rounded-full bg-red-100 text-red-700">
                {cancelledCount} {t("Ακυρωμένες", "Cancelled")}
              </span>
            </div>

            {/* ── Booking Cards ── */}
            {bookings.length > 0 ? (
              bookings.map((bk) => (
                <div key={bk.id} className="bg-white rounded-xl p-4 border">
                  {/* Booking date and status */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">
                      📅 {bk.booking_date} • {bk.booking_time}
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
                          ? t("Επιβεβαιωμένη", "Confirmed")
                          : bk.status === "completed"
                            ? t("Ολοκληρώθηκε", "Completed")
                            : t("Ακυρωμένη", "Cancelled")}
                    </span>
                  </div>
                  {/* Job description */}
                  <p className="text-sm text-gray-600">{bk.description}</p>

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

                  {/* Complete button for confirmed bookings */}
                  {bk.status === "confirmed" && (
                    <button
                      className="mt-3 px-4 py-1.5 text-sm rounded-lg font-medium text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      ✅ {t("Ολοκληρώθηκε η εργασία", "Mark as completed")}
                    </button>
                  )}
                </div>
              ))
            ) : (
              /* No bookings yet */
              <div className="text-center py-12 bg-white rounded-xl border">
                <div className="text-5xl mb-4">📅</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {t("Δεν υπάρχουν κρατήσεις ακόμα", "No bookings yet")}
                </h3>
                <p className="text-sm text-gray-500">
                  {t(
                    "Οι κρατήσεις θα εμφανίζονται εδώ όταν οι πελάτες κλείνουν ραντεβού.",
                    "Bookings will appear here when customers book appointments."
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* REVIEWS TAB                                           */}
        {/* Shows all reviews with rating summary                 */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "reviews" && (
          <div>
            {/* ── Rating Summary ── */}
            <div className="bg-white rounded-xl p-4 border mb-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div
                    className="text-3xl font-bold"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {pro.rating}
                  </div>
                  <div className="text-yellow-500 text-sm">
                    {"★".repeat(Math.floor(pro.rating))}
                  </div>
                  <div className="text-xs text-gray-500">
                    {reviews.length} {t("κριτικές", "reviews")}
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

            {/* ── Individual Review Cards ── */}
            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-xl p-4 border">
                    {/* Date and verification badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString("el-GR")}
                      </span>
                      <span
                        className="text-xs"
                        style={{
                          color: review.type === "verified"
                            ? "var(--color-success)"
                            : "#7D6608",
                        }}
                      >
                        {review.type === "verified"
                          ? "✓ Επαληθευμένη"
                          : "Ιδρυτική"}
                      </span>
                    </div>
                    {/* Star rating */}
                    <div className="text-yellow-500 text-sm my-1">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </div>
                    {/* Review text */}
                    <p className="text-sm text-gray-600">{review.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              /* No reviews yet */
              <div className="text-center py-12 bg-white rounded-xl border">
                <div className="text-5xl mb-4">⭐</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {t("Δεν υπάρχουν κριτικές ακόμα", "No reviews yet")}
                </h3>
                <p className="text-sm text-gray-500">
                  {t(
                    "Οι κριτικές θα εμφανίζονται εδώ μετά από ολοκληρωμένες εργασίες.",
                    "Reviews will appear here after completed jobs."
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* STATISTICS TAB                                        */}
        {/* Performance metrics calculated from real data         */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "stats" && (
          <div className="bg-white rounded-xl p-6 border">
            {/* ── Stats Grid ── */}
            {/* Each metric is calculated from actual database data */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                {
                  label: t("Συνολικές κρατήσεις", "Total Bookings"),
                  value: bookings.length.toString(),
                },
                {
                  label: t("Ολοκληρωμένες", "Completed"),
                  value: completedCount + " (" + (bookings.length > 0 ? Math.round((completedCount / bookings.length) * 100) : 0) + "%)",
                },
                {
                  label: t("Ακυρωμένες", "Cancelled"),
                  value: cancelledCount + " (" + (bookings.length > 0 ? Math.round((cancelledCount / bookings.length) * 100) : 0) + "%)",
                },
                {
                  label: t("Κριτικές", "Reviews"),
                  value: reviews.length.toString(),
                },
                {
                  label: t("Μέση βαθμολογία", "Avg Rating"),
                  value: pro.rating + " ⭐",
                },
                {
                  label: t("Κατάταξη", "Ranking"),
                  value: "#" + pro.rank + " " + categoryName,
                },
                {
                  label: t("Εκτιμώμενα έσοδα μέσω Trustia", "Estimated revenue via Trustia"),
                  value: "~€" + estimatedRevenue,
                },
                {
                  label: t("Online κρατήσεις", "Online Bookings"),
                  value: pro.booking_enabled
                    ? t("Ενεργές", "Active")
                    : t("Ανενεργές", "Inactive"),
                },
                {
                  label: t("Τιμολόγηση", "Pricing"),
                  value: pro.price_text
                    ? pro.price_text
                    : t("Δεν έχει οριστεί", "Not set"),
                },
              ].map((stat, i) => (
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

            {/* ── Revenue Explanation ── */}
            {/* Explains how estimated revenue is calculated */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl text-xs text-gray-500">
              <p className="font-semibold mb-1">
                {t("Πώς υπολογίζεται:", "How it's calculated:")}
              </p>
              <p>
                {t(
                  "Τα εκτιμώμενα έσοδα βασίζονται στις ολοκληρωμένες κρατήσεις μέσω Trustia.gr πολλαπλασιασμένα με τη μέση τιμή εργασίας της κατηγορίας σου. Δεν περιλαμβάνουν εργασίες εκτός πλατφόρμας. Η τιμολόγηση είναι προαιρετική — μπορείτε να αφήσετε το πεδίο κενό ή να γράψετε «κατόπιν εκτίμησης».",
                  "Estimated revenue is based on completed bookings through Trustia.gr multiplied by the average job price for your category. Does not include off-platform jobs. Pricing is optional — you can leave the field empty or write 'upon assessment'."
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}