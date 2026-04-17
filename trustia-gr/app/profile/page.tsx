// =============================================================
// app/profile/page.tsx — User Profile & Settings page
// =============================================================
// URL: trustia.gr/profile
//
// This page lets logged-in users view and edit their info.
// Accessible from the Navbar dropdown → "Το Προφίλ μου"
//
// What the user sees:
// - Their Google profile photo, name, email (read-only)
// - Editable display name (what others see on reviews)
// - Editable contact email (defaults to Google email)
// - Editable phone number (for booking confirmations)
// - Account info (member since, login provider)
//
// Data flow:
// 1. Check if user is logged in via Supabase Auth
// 2. Load their customer record from 'customers' table
// 3. If no customer record exists, create one on first save
// 4. User edits fields → saves → updates Supabase
//
// Security:
// - Only the logged-in user can see/edit their own profile
// - RLS policies enforce this at database level
// - Phone number is never shown publicly
// =============================================================

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  // ─── STATE ───
  // loading: shows spinner while fetching data from Supabase
  const [loading, setLoading] = useState(true);

  // saving: disables save button while the update is in progress
  const [saving, setSaving] = useState(false);

  // saved: shows green success message after successful save
  const [saved, setSaved] = useState(false);

  // error: shows red error message if save fails
  const [error, setError] = useState("");

  // authUser: read-only data from Google account
  const [authUser, setAuthUser] = useState<{
    id: string;
    email: string;
    name: string;
    avatar: string;
    provider: string;
    createdAt: string;
  } | null>(null);

  // ─── EDITABLE FIELDS ───
  // These are saved to the 'customers' table in Supabase

  // displayName: how the user appears on bookings and reviews
  const [displayName, setDisplayName] = useState("");

  // contactEmail: where booking confirmations are sent
  // Defaults to Google email, but user can change it
  const [contactEmail, setContactEmail] = useState("");

  // phone: used for booking confirmations, never shown publicly
  const [phone, setPhone] = useState("");

  // customerId: tracks whether a customer record exists in DB
  // null = no record yet (first visit), string = record exists
  const [customerId, setCustomerId] = useState<string | null>(null);

  // Language helper
  const lang = "el";
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  // ─── FETCH USER DATA ON LOAD ───
  // Runs once when the page loads
  // Step 1: Get logged-in user from Supabase Auth
  // Step 2: Check if they have a customer record in the DB
  // Step 3: Pre-fill form fields with existing data or Google defaults
  useEffect(() => {
    async function fetchProfile() {
      // Step 1: Get the currently logged-in user
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        // Not logged in — send them to the login page
        window.location.href = "/login";
        return;
      }

      // Extract useful info from Google auth metadata
      const user = authData.user;
      setAuthUser({
        id: user.id,
        email: user.email || "",
        name: user.user_metadata?.full_name || user.email || "",
        avatar: user.user_metadata?.avatar_url || "",
        provider: user.app_metadata?.provider || "email",
        createdAt: user.created_at,
      });

      // Step 2: Check if a customer record already exists for this user
      const { data: customerData } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (customerData) {
        // Customer record exists — populate form with saved values
        setCustomerId(customerData.id);
        setDisplayName(customerData.display_name || user.user_metadata?.full_name || "");
        setContactEmail(customerData.email || user.email || "");
        setPhone(customerData.phone || "");
      } else {
        // No customer record yet — pre-fill from Google account data
        // Record will be created when they click "Save" for the first time
        setDisplayName(user.user_metadata?.full_name || "");
        setContactEmail("");
        setPhone("");
      }

      setLoading(false);
    }
    fetchProfile();
  }, []);

  // ─── SAVE PROFILE ───
  // Called when user clicks "Αποθήκευση Αλλαγών"
  // Creates a new customer record (first time) or updates existing one
  async function handleSave() {
    if (!authUser) return;

    setSaving(true);
    setError("");
    setSaved(false);
    // Validate email format if contact email is provided
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      setError(t("Μη έγκυρη διεύθυνση email.", "Invalid email address."));
      setSaving(false);
      return;
    }

    try {
      if (customerId) {
        // ── UPDATE existing customer record ──
        const { error: updateError } = await supabase
          .from("customers")
          .update({
            display_name: displayName,
            email: contactEmail || authUser.email,
            phone: phone,
            updated_at: new Date().toISOString(),
          })
          .eq("id", customerId);

        if (updateError) {
          setError(updateError.message);
        } else {
          setSaved(true);
        }
      } else {
        // ── INSERT new customer record (first save) ──
        const { data: newCustomer, error: insertError } = await supabase
          .from("customers")
          .insert({
            user_id: authUser.id,
            display_name: displayName,
            email: contactEmail || authUser.email,
            phone: phone,
          })
          .select()
          .single();

        if (insertError) {
          setError(insertError.message);
        } else if (newCustomer) {
          setCustomerId(newCustomer.id);
          setSaved(true);
        }
      }
    } catch {
      setError(t("Κάτι πήγε στραβά. Δοκιμάστε ξανά.", "Something went wrong. Try again."));
    }

    setSaving(false);

    // Auto-hide success message after 3 seconds
    if (!error) {
      setTimeout(() => setSaved(false), 3000);
    }
  }

  // ─── LOADING STATE ───
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-3xl">⏳</div>
      </div>
    );
  }

  // ─── NOT LOGGED IN (safety fallback) ───
  if (!authUser) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">

        {/* ─── PAGE HEADING ─── */}
        <h1
          className="text-2xl font-bold mb-6"
          style={{ color: "var(--color-primary)" }}
        >
          {t("Το Προφίλ μου", "My Profile")}
        </h1>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* GOOGLE ACCOUNT CARD (read-only)                       */}
        {/* Shows info from their Google account — cannot edit    */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            {/* Google profile photo */}
            {authUser.avatar && (
              <img
                src={authUser.avatar}
                alt={authUser.name}
                width={64}
                height={64}
                className="rounded-full border-2 border-gray-200"
              />
            )}
            <div>
              {/* Full name from Google */}
              <h2 className="text-lg font-bold text-gray-900">
                {authUser.name}
              </h2>
              {/* Google email (login email — cannot change) */}
              <p className="text-sm text-gray-500">{authUser.email}</p>
              {/* Badge showing login provider */}
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 mt-1 inline-block">
                {authUser.provider === "google" ? "Google Account" : authUser.provider}
              </span>
            </div>
          </div>

          {/* When the user first created their account */}
          <p className="text-xs text-gray-400">
            {t("Μέλος από", "Member since")}{" "}
            {new Date(authUser.createdAt).toLocaleDateString("el-GR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* EDITABLE FIELDS                                       */}
        {/* Display name, contact email, phone                   */}
        {/* Saved to the 'customers' table in Supabase           */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold mb-4">
            {t("Στοιχεία Επικοινωνίας", "Contact Details")}
          </h3>

          {/* ── Display Name ── */}
          {/* This is how the user appears on bookings and reviews */}
          <div className="mb-4">
            <label
              htmlFor="display-name"
              className="text-xs font-semibold text-gray-600 block mb-1"
            >
              {t("Εμφανιζόμενο Όνομα", "Display Name")}
            </label>
            <input
              id="display-name"
              name="display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("Πώς θέλετε να σας βλέπουν οι επαγγελματίες", "How professionals will see you")}
              className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <p className="text-xs text-gray-400 mt-1">
              {t(
                "Αυτό το όνομα εμφανίζεται στις κρατήσεις και τις κριτικές σας.",
                "This name appears on your bookings and reviews."
              )}
            </p>
          </div>

          {/* ── Contact Email ── */}
          {/* Defaults to Google email but can be changed */}
          {/* Used for booking confirmations and notifications */}
          <div className="mb-4">
            <label
              htmlFor="contact-email"
              className="text-xs font-semibold text-gray-600 block mb-1"
            >
              {t("Email Επικοινωνίας", "Contact Email")}
            </label>
            <input
              id="contact-email"
              name="contact-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder={authUser.email}
              className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <p className="text-xs text-gray-400 mt-1">
            {t(
                "Προαιρετικό. Αν θέλετε ειδοποιήσεις σε διαφορετικό email. Αν μείνει κενό, χρησιμοποιείται αυτόματα το " + authUser.email,
                "Optional. If you want notifications at a different email. If left empty, " + authUser.email + " is used automatically."
              )}
            </p>
          </div>

          {/* ── Phone Number ── */}
          {/* Used for booking confirmations — never shown publicly */}
          <div className="mb-4">
            <label
              htmlFor="phone"
              className="text-xs font-semibold text-gray-600 block mb-1"
            >
              {t("Τηλέφωνο", "Phone")}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="69X XXX XXXX"
              className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <p className="text-xs text-gray-400 mt-1">
              {t(
                "Χρησιμοποιείται μόνο για επιβεβαίωση κρατήσεων. Δεν εμφανίζεται δημόσια.",
                "Used only for booking confirmations. Never shown publicly."
              )}
            </p>
          </div>

          {/* ─── SAVE BUTTON ─── */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 text-white font-bold rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {saving
              ? t("Αποθήκευση...", "Saving...")
              : t("Αποθήκευση Αλλαγών", "Save Changes")}
          </button>

          {/* ─── SUCCESS MESSAGE ─── */}
          {/* Green bar that appears for 3 seconds after saving */}
          {saved && (
            <div className="mt-3 p-3 bg-green-50 rounded-xl text-sm text-green-700 text-center">
              ✓ {t("Οι αλλαγές αποθηκεύτηκαν!", "Changes saved!")}
            </div>
          )}

          {/* ─── ERROR MESSAGE ─── */}
          {/* Red bar that appears if save fails */}
          {error && (
            <div className="mt-3 p-3 bg-red-50 rounded-xl text-sm text-red-600 text-center">
              {error}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ACCOUNT INFO (read-only)                              */}
        {/* Technical details about their account                 */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
          <h3 className="font-bold mb-4">
            {t("Πληροφορίες Λογαριασμού", "Account Info")}
          </h3>
          <div className="space-y-3 text-sm">
            {/* Login provider */}
            <div className="flex justify-between">
              <span className="text-gray-500">
                {t("Σύνδεση μέσω", "Login via")}
              </span>
              <span className="font-medium text-gray-700">
                {authUser.provider === "google" ? "Google" : authUser.provider}
              </span>
            </div>
            {/* Login email (cannot change) */}
            <div className="flex justify-between">
              <span className="text-gray-500">
                {t("Email Σύνδεσης", "Login Email")}
              </span>
              <span className="font-medium text-gray-700">
                {authUser.email}
              </span>
            </div>
            {/* Registration date */}
            <div className="flex justify-between">
              <span className="text-gray-500">
                {t("Εγγραφή", "Registered")}
              </span>
              <span className="font-medium text-gray-700">
                {new Date(authUser.createdAt).toLocaleDateString("el-GR")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}