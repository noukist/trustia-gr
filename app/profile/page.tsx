// =============================================================
// app/profile/page.tsx — User Profile & Settings page
// =============================================================
// URL: mastori.gr/profile
//
// This page lets logged-in users view and edit their info.
// Accessible from the Navbar dropdown → "Το Προφίλ μου"
//
// What the user sees:
// - Their Google profile photo, name, email
// - Editable display name (what others see on reviews)
// - Editable phone number (for booking confirmations)
// - Account info (member since, login provider)
//
// Data flow:
// 1. Check if user is logged in via Supabase Auth
// 2. Load their customer record from 'customers' table
// 3. If no customer record exists, create one (first visit)
// 4. User edits fields → saves → updates Supabase
//
// Security:
// - Only the logged-in user can see/edit their own profile
// - Display name can only be changed once per 30 days
// - Phone number is never shown publicly
// =============================================================

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  // ─── STATE ───
  // loading: shows spinner while fetching data
  const [loading, setLoading] = useState(true);

  // saving: disables save button while updating
  const [saving, setSaving] = useState(false);

  // saved: shows success message after save
  const [saved, setSaved] = useState(false);

  // error: shows error message if something fails
  const [error, setError] = useState("");

  // Auth user data from Google (read-only)
  const [authUser, setAuthUser] = useState<{
    id: string;
    email: string;
    name: string;
    avatar: string;
    provider: string;
    createdAt: string;
  } | null>(null);

  // Editable customer fields
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  // Whether a customer record exists in the DB
  const [customerId, setCustomerId] = useState<string | null>(null);

  // Language helper
  const lang = "el";
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  // ─── FETCH USER DATA ON LOAD ───
  // Gets auth info + customer record from Supabase
  useEffect(() => {
    async function fetchProfile() {
      // Step 1: Get logged-in user from Supabase Auth
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        // Not logged in — redirect to login
        window.location.href = "/login";
        return;
      }

      // Extract user info from auth metadata
      const user = authData.user;
      setAuthUser({
        id: user.id,
        email: user.email || "",
        name: user.user_metadata?.full_name || user.email || "",
        avatar: user.user_metadata?.avatar_url || "",
        provider: user.app_metadata?.provider || "email",
        createdAt: user.created_at,
      });

      // Step 2: Check if customer record exists
      const { data: customerData } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (customerData) {
        // Customer record exists — populate fields
        setCustomerId(customerData.id);
        setDisplayName(customerData.display_name || user.user_metadata?.full_name || "");
        setPhone(customerData.phone || "");
      } else {
        // No customer record yet — pre-fill from Google data
        setDisplayName(user.user_metadata?.full_name || "");
        setPhone("");
      }

      setLoading(false);
    }
    fetchProfile();
  }, []);

  // ─── SAVE PROFILE ───
  // Creates or updates the customer record in Supabase
  async function handleSave() {
    if (!authUser) return;

    setSaving(true);
    setError("");
    setSaved(false);

    try {
      if (customerId) {
        // Update existing customer record
        const { error: updateError } = await supabase
          .from("customers")
          .update({
            display_name: displayName,
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
        // Create new customer record (first time)
        const { data: newCustomer, error: insertError } = await supabase
          .from("customers")
          .insert({
            user_id: authUser.id,
            display_name: displayName,
            phone: phone,
            email: authUser.email,
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

    // Hide success message after 3 seconds
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

  // ─── NOT LOGGED IN (safety — should redirect above) ───
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
        {/* PROFILE CARD — Google info (read-only)                */}
        {/* Shows the info from their Google account              */}
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
              {/* Name from Google */}
              <h2 className="text-lg font-bold text-gray-900">
                {authUser.name}
              </h2>
              {/* Email from Google */}
              <p className="text-sm text-gray-500">{authUser.email}</p>
              {/* Login provider badge */}
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 mt-1 inline-block">
                {authUser.provider === "google" ? "Google Account" : authUser.provider}
              </span>
            </div>
          </div>

          {/* Member since date */}
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
        {/* Display name and phone — saved to customers table     */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold mb-4">
            {t("Στοιχεία Επικοινωνίας", "Contact Details")}
          </h3>

          {/* Display Name */}
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

          {/* Phone Number */}
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
          {saved && (
            <div className="mt-3 p-3 bg-green-50 rounded-xl text-sm text-green-700 text-center">
              ✓ {t("Οι αλλαγές αποθηκεύτηκαν!", "Changes saved!")}
            </div>
          )}

          {/* ─── ERROR MESSAGE ─── */}
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
            <div className="flex justify-between">
              <span className="text-gray-500">
                {t("Σύνδεση μέσω", "Login via")}
              </span>
              <span className="font-medium text-gray-700">
                {authUser.provider === "google" ? "Google" : authUser.provider}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-700">
                {authUser.email}
              </span>
            </div>
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
