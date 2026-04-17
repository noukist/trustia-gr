// =============================================================
// app/register/page.tsx — Professional Registration form
// =============================================================
// URL: trustia.gr/register
//
// This is where professionals sign up to join Trustia.gr.
// The flow:
// 1. Select category (determines their pricing tier)
// 2. Fill in profile details (name, phone, email, bio, areas)
// 3. Choose Solo or Business account type
// 4. See their pricing (based on selected category)
// 5. Choose payment method (IRIS, Bank Transfer, PayPal)
// 6. Submit registration
//
// After submission, the professional receives a confirmation
// email. Their profile is activated within 24 hours after
// payment is verified (manually by admin in Phase 1).
//
// Later: This form will save to Supabase + create a Brevo
// contact automatically. For now, it's a visual prototype.
// =============================================================

"use client";

import { useState, useMemo } from "react";
import {
  CATEGORIES,
  TIERS,
  REGIONS,
  getAllAreas,
} from "@/lib/constants";

// ── Supabase client — for saving registration data ──
import { supabase } from "@/lib/supabase";
// ── useEffect — for checking auth on page load ──
import { useEffect } from "react";
// ── useRouter — for redirecting unauthenticated users ──
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  // ─── ROUTER (for redirecting if not logged in) ───
  const router = useRouter();

  // ─── AUTH STATE ───
  // Tracks the logged-in user's ID (needed to link professional to their account)
  const [userId, setUserId] = useState<string | null>(null);
  // Shows loading spinner while checking auth
  const [authLoading, setAuthLoading] = useState(true);
  // ─── STATE ───
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [accountType, setAccountType] = useState<"solo" | "business">("solo");
  const [billingPlan, setBillingPlan] = useState<"annual" | "semi" | "monthly">("annual");
  const [submitted, setSubmitted] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
 // ─── CHECK AUTH ON PAGE LOAD ───
  // If user is not logged in, redirect to login page.
  // If logged in, pre-fill name and email from their Google account.
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data } = await supabase.auth.getUser();
        if (!data.user) {
          router.push("/login?redirect=/register");
          return;
        }
        setUserId(data.user.id);
        const meta = data.user.user_metadata;
        if (meta?.full_name) {
          const parts = meta.full_name.split(" ");
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" ") || "");
        }
        if (data.user.email) {
          setEmail(data.user.email);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      }
      setAuthLoading(false);
    }
    checkAuth();
  }, [router]);

  const lang = "el";
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  // Look up selected category and its tier pricing
  const selectedCategory = CATEGORIES.find((c) => c.id === selectedCategoryId);
  const selectedTier = selectedCategory ? TIERS[selectedCategory.tier] : null;

  // Calculate the price based on selections
  const currentPrice = useMemo(() => {
    if (!selectedTier) return 0;
    if (accountType === "solo") {
      if (billingPlan === "annual") return selectedTier.annualMonthly;
      if (billingPlan === "semi") return selectedTier.semiMonthly;
      return selectedTier.monthly;
    } else {
      if (billingPlan === "annual") return selectedTier.businessAnnual;
      if (billingPlan === "semi") return selectedTier.businessSemi;
      return selectedTier.businessMonthly;
    }
  }, [selectedTier, accountType, billingPlan]);

  // Calculate total payment amount
  const totalPayment = useMemo(() => {
    if (billingPlan === "annual") return currentPrice * 12;
    if (billingPlan === "semi") return currentPrice * 6;
    return currentPrice;
  }, [currentPrice, billingPlan]);

  // ─── SUCCESS SCREEN ───
  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h1
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--color-primary)" }}
          >
            {t("Η εγγραφή σας υποβλήθηκε!", "Your registration has been submitted!")}
          </h1>
          <p className="text-gray-600 mb-2">
            {t(
              "Θα λάβετε email επιβεβαίωσης στο",
              "You will receive a confirmation email at"
            )}{" "}
            <strong>{email}</strong>
          </p>
          <p className="text-gray-500 text-sm mb-6">
            {t(
              "Το προφίλ σας θα ενεργοποιηθεί εντός 24 ωρών μετά την επιβεβαίωση πληρωμής.",
              "Your profile will be activated within 24 hours after payment confirmation."
            )}
          </p>
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
            <p className="font-semibold mb-2">{t("Επόμενα βήματα:", "Next steps:")}</p>
            <p>1. {t("Ολοκληρώστε την πληρωμή", "Complete payment")}</p>
            <p>2. {t("Λάβετε email ενεργοποίησης", "Receive activation email")}</p>
            <p>3. {t("Συνδεθείτε και ολοκληρώστε το προφίλ σας", "Log in and complete your profile")}</p>
          </div>
        </div>
      </div>
    );
  }
// ─── LOADING STATE ───
  // Show spinner while checking if user is logged in
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Φόρτωση...</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* ─── PAGE HEADING ─── */}
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: "var(--color-primary)" }}
        >
          {t("Εγγραφή Επαγγελματία", "Professional Registration")}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {t("Βήμα", "Step")} {step} {t("από", "of")} 3
        </p>

        {/* ─── PROGRESS BAR ─── */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="flex-1 h-2 rounded-full transition-all"
              style={{
                backgroundColor:
                  s <= step ? "var(--color-primary)" : "#E5E7EB",
              }}
            ></div>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* STEP 1: Category Selection                            */}
        {/* ═══════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4">
              {t("Τι δουλειά κάνεις;", "What do you do?")}
            </h2>

            {/* Category dropdown */}
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 mb-4"
            >
              <option value="">{t("Επίλεξε κατηγορία...", "Select category...")}</option>
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
              {/* Option for unlisted categories */}
              <option value="other">
                {t("❓ Άλλη υπηρεσία (δεν υπάρχει στη λίστα)", "❓ Other service (not listed)")}
              </option>
            </select>
            {/* "Other" category text field */}
            {/* Shows only when "other" is selected from dropdown */}
            {selectedCategoryId === "other" && (
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  {t("Περιγράψτε την υπηρεσία σας:", "Describe your service:")}
                </label>
                <input
                  placeholder={t(
                    "π.χ. Τεχνικός πισίνας, Κηπουρός γκαζόν, Ταπετσέρης επίπλων...",
                    "e.g. Pool technician, Lawn care, Upholstery..."
                  )}
                  className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {t(
                    "Θα εξετάσουμε την κατηγορία σας και θα επικοινωνήσουμε μαζί σας εντός 48 ωρών.",
                    "We'll review your category and contact you within 48 hours."
                  )}
                </p>
              </div>
            )}

            {/* Account type selection */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setAccountType("solo")}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all border-2 ${
                  accountType === "solo"
                    ? "border-[var(--color-primary)] bg-[var(--color-bg-blue)]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-bold">{t("Ατομικός", "Solo")}</div>
                <div className="text-xs text-gray-500">{t("Ένα άτομο", "One person")}</div>
              </button>
              <button
                onClick={() => setAccountType("business")}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all border-2 ${
                  accountType === "business"
                    ? "border-[var(--color-primary)] bg-[var(--color-bg-blue)]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-bold">{t("Επιχείρηση", "Business")}</div>
                <div className="text-xs text-gray-500">{t("2+ άτομα", "2+ people")}</div>
              </button>
            </div>

            {/* Show pricing if category is selected */}
            {selectedCategory && selectedTier && (
              <div className="border-t pt-4 mt-4">
                <p className="text-sm text-gray-500 mb-3">
                  {t("Τιμή Εκκίνησης 2026:", "Launch Price 2026:")}
                </p>

                {/* Billing plan options */}
                <div className="space-y-2">
                  {[
                    { plan: "annual" as const, labelEl: "Ετήσιο", labelEn: "Annual", badge: true },
                    { plan: "semi" as const, labelEl: "Εξαμηνιαίο", labelEn: "Semi-Annual", badge: false },
                    { plan: "monthly" as const, labelEl: "Μηνιαίο", labelEn: "Monthly", badge: false },
                  ].map((option) => {
                    const price =
                      accountType === "solo"
                        ? option.plan === "annual" ? selectedTier.annualMonthly
                          : option.plan === "semi" ? selectedTier.semiMonthly
                          : selectedTier.monthly
                        : option.plan === "annual" ? selectedTier.businessAnnual
                          : option.plan === "semi" ? selectedTier.businessSemi
                          : selectedTier.businessMonthly;

                    return (
                      <button
                        key={option.plan}
                        onClick={() => setBillingPlan(option.plan)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                          billingPlan === option.plan
                            ? "border-[var(--color-accent)] bg-[var(--color-bg-amber)]"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="text-left">
                          <span className="font-semibold text-sm">
                            {t(option.labelEl, option.labelEn)}
                          </span>
                          {option.badge && (
                            <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-[var(--color-accent)] text-gray-900 font-semibold">
                              {t("Δημοφιλές", "Popular")}
                            </span>
                          )}
                        </div>
                        <span className="font-bold" style={{ color: "var(--color-primary)" }}>
                          €{price}/μο
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Locked price badge */}
                <p className="text-xs text-center mt-3" style={{ color: "var(--color-accent)" }}>
                  🔒 {t("Κλειδωμένη τιμή για όσο παραμένεις μέλος", "Price locked while you're a member")}
                </p>
              </div>
            )}

            {/* Next button */}
            <button
              onClick={() => {
                if (selectedCategoryId) setStep(2);
              }}
              disabled={!selectedCategoryId}
              className={`w-full mt-6 py-3 font-bold rounded-xl text-lg transition-all ${
                selectedCategoryId
                  ? "bg-[var(--color-primary)] text-white hover:opacity-90"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {t("Επόμενο", "Next")} →
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* STEP 2: Profile Details                               */}
        {/* ═══════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4">
              {t("Στοιχεία Προφίλ", "Profile Details")}
            </h2>

            <div className="space-y-3">
              {/* Name fields side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">
                    {t("Όνομα *", "First Name *")}
                  </label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">
                    {t("Επώνυμο *", "Last Name *")}
                  </label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  {t("Τηλέφωνο *", "Phone *")}
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="69X XXX XXXX"
                  className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Email *
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* City */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  {t("Πόλη *", "City *")}
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">{t("Επίλεξε πόλη...", "Select city...")}</option>
                  {REGIONS.map((region) => (
                    <option key={region.id} value={region.name}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service areas info */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  {t("Περιοχές Εξυπηρέτησης", "Service Areas")}
                </label>
                <p className="text-xs text-gray-400 mb-1">
                  {t(
                    "Θα επιλέξετε αναλυτικά τις περιοχές μετά την ενεργοποίηση του λογαριασμού.",
                    "You'll select detailed service areas after account activation."
                  )}
                </p>
                <input
                  placeholder={t("π.χ. Θέρμη, Καλαμαριά, Κέντρο", "e.g. Thermi, Kalamaria, Center")}
                  className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  {t("Βιογραφικό / Περιγραφή", "Bio / Description")}
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder={t(
                    "Περιγράψτε την εμπειρία σας, τις υπηρεσίες σας, τι σας ξεχωρίζει...",
                    "Describe your experience, services, what sets you apart..."
                  )}
                  className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-all"
              >
                ← {t("Πίσω", "Back")}
              </button>
              <button
                onClick={() => {
                  if (firstName && lastName && phone && email) setStep(3);
                }}
                disabled={!firstName || !lastName || !phone || !email}
                className={`flex-1 py-3 font-bold rounded-xl text-lg transition-all ${
                  firstName && lastName && phone && email
                    ? "bg-[var(--color-primary)] text-white hover:opacity-90"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {t("Επόμενο", "Next")} →
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* STEP 3: Payment                                       */}
        {/* ═══════════════════════════════════════════════════════ */}
        {step === 3 && selectedCategory && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4">
              {t("Πληρωμή", "Payment")}
            </h2>

            {/* Order summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-sm mb-3">
                {t("Σύνοψη", "Summary")}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("Κατηγορία", "Category")}</span>
                  <span className="font-medium">
                    {selectedCategory.emoji} {lang === "el" ? selectedCategory.nameEl : selectedCategory.nameEn}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("Τύπος", "Type")}</span>
                  <span className="font-medium">
                    {accountType === "solo" ? t("Ατομικός", "Solo") : t("Επιχείρηση", "Business")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("Πλάνο", "Plan")}</span>
                  <span className="font-medium">
                    {billingPlan === "annual" ? t("Ετήσιο", "Annual")
                      : billingPlan === "semi" ? t("Εξαμηνιαίο", "Semi-Annual")
                      : t("Μηνιαίο", "Monthly")}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="font-bold">{t("Σύνολο πληρωμής", "Total payment")}</span>
                  <span className="font-bold text-lg" style={{ color: "var(--color-primary)" }}>
                    €{totalPayment}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  (€{currentPrice}/{t("μήνα", "month")} × {billingPlan === "annual" ? "12" : billingPlan === "semi" ? "6" : "1"}{" "}
                  {billingPlan === "annual" ? t("μήνες", "months") : billingPlan === "semi" ? t("μήνες", "months") : t("μήνας", "month")})
                </p>
              </div>
            </div>

            {/* Payment methods */}
            <h3 className="font-semibold text-sm mb-3">
              {t("Τρόπος Πληρωμής", "Payment Method")}
            </h3>
            <div className="space-y-2">
              {/* IRIS */}
              <div className="p-3 rounded-xl border-2 border-[var(--color-primary)] bg-[var(--color-bg-blue)]">
                <span className="font-bold text-sm">
                  🏦 IRIS ({t("Συνιστάται", "Recommended")})
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {t(
                    "Σκανάρετε τον QR code ή στείλτε στο κινητό: 69X XXX XXXX",
                    "Scan the QR code or send to mobile: 69X XXX XXXX"
                  )}
                </p>
              </div>

              {/* Bank Transfer */}
              <div className="p-3 rounded-xl bg-gray-50">
                <span className="font-bold text-sm">
                  🏛️ {t("Τραπεζική Μεταφορά", "Bank Transfer")}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  IBAN: GR00 0000 0000 0000 0000 0000 000
                </p>
              </div>

              {/* PayPal */}
              <div className="p-3 rounded-xl bg-gray-50">
                <span className="font-bold text-sm">💳 PayPal</span>
                <p className="text-xs text-gray-500 mt-1">info@trustia.gr</p>
              </div>
            </div>

            {/* Locked price reminder */}
            <p className="text-xs text-center mt-4" style={{ color: "var(--color-accent)" }}>
              🔒 {t(
                "Αυτή η τιμή κλειδώνει για όσο παραμένεις μέλος",
                "This price is locked while you remain a member"
              )}
            </p>

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-all"
              >
                ← {t("Πίσω", "Back")}
              </button>
              <button
                onClick={async () => {
                  // ── SAVE TO SUPABASE ──
                  // Creates a new professional record linked to the logged-in user
                  // Status is 'pending' — admin activates after payment verification
                  if (!userId || !selectedCategory) return;
                  const { error } = await supabase.from("professionals").insert({
                    user_id: userId,
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone,
                    email: email,
                    category_id: selectedCategoryId,
                    tier: selectedCategory.tier,
                    city: city,
                    bio: bio,
                    account_type: accountType,
                    billing_plan: billingPlan,
                    price_text: "",
                    rank: 0,
                    rating: 0,
                    review_count: 0,
                    job_count: 0,
                    booking_enabled: false,
                    featured: false,
                    status: "pending",
                  });
                  if (error) {
                    alert("Σφάλμα: " + error.message);
                    return;
                  }
                  setSubmitted(true);
                }}
                className="
                  flex-1 py-3 font-bold rounded-xl text-lg
                  bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)]
                  text-gray-900 transition-all
                "
              >
                {t("Ολοκλήρωση Εγγραφής", "Complete Registration")}
              </button>
            </div>

            {/* Fine print */}
            <p className="text-xs text-center text-gray-400 mt-4">
              {t(
                "Το προφίλ σας θα ενεργοποιηθεί εντός 24 ωρών μετά την επιβεβαίωση πληρωμής.",
                "Your profile will be activated within 24 hours after payment confirmation."
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}