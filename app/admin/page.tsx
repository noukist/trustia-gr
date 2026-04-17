// =============================================================
// app/admin/page.tsx — Admin Panel for Trustia.gr
// =============================================================
// URL: trustia.gr/admin
//
// The admin's control center. Only accessible by users whose
// email is in the ADMIN_EMAILS list (later: user_roles table).
//
// Tabs:
// 1. Dashboard — key business metrics from real Supabase data
// 2. Professionals — manage all professionals, search, toggle status
// 3. Bookings — view all bookings across the platform
// 4. Reviews — moderate reviews (approve/hide)
// 5. Categories — add/edit/delete/toggle service categories
// 6. Roles — create custom groups, assign permissions
// 7. Settings — pricing config
//
// Security:
// - Non-admin users see "Access Denied" message
// - Categories with active professionals cannot be deleted
// - Delete actions require confirmation dialog
// =============================================================

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// ─── ADMIN EMAILS ───
// Hardcoded for now. Later: check user_roles table
const ADMIN_EMAILS = ["noukist@gmail.com"];

// ─── PERMISSION LIST ───
// All available permissions that can be assigned to custom roles
const ALL_PERMISSIONS = [
  { id: "review.view", labelEl: "Προβολή κριτικών", labelEn: "View reviews" },
  { id: "review.moderate", labelEl: "Διαχείριση κριτικών", labelEn: "Moderate reviews" },
  { id: "professional.view", labelEl: "Προβολή επαγγελματιών", labelEn: "View professionals" },
  { id: "professional.edit", labelEl: "Επεξεργασία επαγγελματιών", labelEn: "Edit professionals" },
  { id: "professional.deactivate", labelEl: "Απενεργοποίηση επαγγελματιών", labelEn: "Deactivate professionals" },
  { id: "booking.view", labelEl: "Προβολή κρατήσεων", labelEn: "View bookings" },
  { id: "subscription.view", labelEl: "Προβολή συνδρομών", labelEn: "View subscriptions" },
  { id: "subscription.edit", labelEl: "Επεξεργασία συνδρομών", labelEn: "Edit subscriptions" },
  { id: "pricing.view", labelEl: "Προβολή τιμών", labelEn: "View pricing" },
  { id: "pricing.edit", labelEl: "Επεξεργασία τιμών", labelEn: "Edit pricing" },
  { id: "category.manage", labelEl: "Διαχείριση κατηγοριών", labelEn: "Manage categories" },
  { id: "announcement.manage", labelEl: "Διαχείριση ανακοινώσεων", labelEn: "Manage announcements" },
  { id: "audit.view", labelEl: "Προβολή audit log", labelEn: "View audit log" },
  { id: "roles.manage", labelEl: "Διαχείριση ρόλων", labelEn: "Manage roles" },
];

// ─── TypeScript Interfaces ───
interface Professional {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  category_id: string;
  tier: string;
  city: string;
  rating: number;
  review_count: number;
  status: string;
}

interface Category {
  id: string;
  name_el: string;
  name_en: string;
  tier: string;
  emoji: string;
  icon: string;
  active: boolean;
  sort_order: number;
}

interface Review {
  id: string;
  professional_id: string;
  rating: number;
  text: string;
  type: string;
  status: string;
  created_at: string;
}

interface Booking {
  id: string;
  professional_id: string;
  booking_date: string;
  booking_time: string;
  description: string;
  status: string;
  created_at: string;
}

interface Role {
  id: string;
  name: string;
  created_at: string;
}

interface RolePermission {
  role_id: string;
  permission: string;
}

export default function AdminPage() {
  // ─── STATE ───
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Data from Supabase
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);

  // Search and filter
  const [proSearch, setProSearch] = useState("");
  const [reviewFilter, setReviewFilter] = useState("all");

  // Category form state
  const [showCatForm, setShowCatForm] = useState(false);
  const [catId, setCatId] = useState("");
  const [catNameEl, setCatNameEl] = useState("");
  const [catNameEn, setCatNameEn] = useState("");
  const [catTier, setCatTier] = useState("trades");
  const [catEmoji, setCatEmoji] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // Role form state
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  // Language helper
  const lang = "el";
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  // ─── CHECK ADMIN ACCESS + LOAD ALL DATA ───
  useEffect(() => {
    async function loadAdmin() {
      // Step 1: Verify admin access
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user || !ADMIN_EMAILS.includes(authData.user.email || "")) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setIsAdmin(true);

      // Step 2: Fetch all data in parallel
      const [prosRes, catsRes, revsRes, booksRes, rolesRes, permRes] = await Promise.all([
        supabase.from("professionals").select("*").order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("reviews").select("*").order("created_at", { ascending: false }),
        supabase.from("bookings").select("*").order("booking_date", { ascending: false }),
        supabase.from("roles").select("*").order("created_at"),
        supabase.from("role_permissions").select("*"),
      ]);

      if (prosRes.data) setProfessionals(prosRes.data);
      if (catsRes.data) setCategories(catsRes.data);
      if (revsRes.data) setReviews(revsRes.data);
      if (booksRes.data) setBookings(booksRes.data);
      if (rolesRes.data) setRoles(rolesRes.data);
      if (permRes.data) setRolePermissions(permRes.data);

      setLoading(false);
    }
    loadAdmin();
  }, []);

  // ═══════════════════════════════════════════════════════════
  // CATEGORY ACTIONS
  // ═══════════════════════════════════════════════════════════

  // Save new or update existing category
  async function handleSaveCategory() {
    if (!catId || !catNameEl || !catNameEn) return;

    if (editingCatId) {
      await supabase.from("categories").update({
        name_el: catNameEl,
        name_en: catNameEn,
        tier: catTier,
        emoji: catEmoji,
      }).eq("id", editingCatId);
    } else {
      await supabase.from("categories").insert({
        id: catId,
        name_el: catNameEl,
        name_en: catNameEn,
        tier: catTier,
        emoji: catEmoji,
        icon: "",
        active: true,
        sort_order: categories.length + 1,
      });
    }

    // Refresh list
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    if (data) setCategories(data);
    resetCatForm();
  }

  // Toggle category active/inactive
  async function handleToggleCategory(id: string, currentActive: boolean) {
    await supabase.from("categories").update({ active: !currentActive }).eq("id", id);
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    if (data) setCategories(data);
  }

  // Delete a category permanently
  // Safety: blocks deletion if professionals are using this category
  async function handleDeleteCategory(id: string) {
    const prosInCat = professionals.filter((p) => p.category_id === id);
    if (prosInCat.length > 0) {
      alert(t(
        "Δεν μπορείτε να διαγράψετε κατηγορία με ενεργούς επαγγελματίες. Απενεργοποιήστε την αντί αυτού.",
        "Cannot delete a category with active professionals. Deactivate it instead."
      ));
      return;
    }

    const confirmed = window.confirm(t(
      "Είστε σίγουρος; Αυτή η ενέργεια δεν αναιρείται.",
      "Are you sure? This action cannot be undone."
    ));
    if (!confirmed) return;

    await supabase.from("categories").delete().eq("id", id);
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    if (data) setCategories(data);
  }

  // Load category into edit form
  function handleEditCategory(cat: Category) {
    setEditingCatId(cat.id);
    setCatId(cat.id);
    setCatNameEl(cat.name_el);
    setCatNameEn(cat.name_en);
    setCatTier(cat.tier);
    setCatEmoji(cat.emoji);
    setShowCatForm(true);
  }

  // Clear the category form
  function resetCatForm() {
    setShowCatForm(false);
    setEditingCatId(null);
    setCatId("");
    setCatNameEl("");
    setCatNameEn("");
    setCatTier("trades");
    setCatEmoji("");
  }

  // ═══════════════════════════════════════════════════════════
  // ROLE ACTIONS
  // ═══════════════════════════════════════════════════════════

  // Save new or update existing role with permissions
  async function handleSaveRole() {
    if (!roleName) return;

    if (editingRoleId) {
      await supabase.from("roles").update({ name: roleName }).eq("id", editingRoleId);
      await supabase.from("role_permissions").delete().eq("role_id", editingRoleId);
      if (selectedPermissions.length > 0) {
        await supabase.from("role_permissions").insert(
          selectedPermissions.map((p) => ({ role_id: editingRoleId, permission: p }))
        );
      }
    } else {
      const { data: newRole } = await supabase
        .from("roles")
        .insert({ name: roleName })
        .select()
        .single();

      if (newRole && selectedPermissions.length > 0) {
        await supabase.from("role_permissions").insert(
          selectedPermissions.map((p) => ({ role_id: newRole.id, permission: p }))
        );
      }
    }

    const [rolesRes, permRes] = await Promise.all([
      supabase.from("roles").select("*").order("created_at"),
      supabase.from("role_permissions").select("*"),
    ]);
    if (rolesRes.data) setRoles(rolesRes.data);
    if (permRes.data) setRolePermissions(permRes.data);
    resetRoleForm();
  }

  // Delete a role and its permissions
  async function handleDeleteRole(roleId: string) {
    const confirmed = window.confirm(t(
      "Είστε σίγουρος; Ο ρόλος και τα δικαιώματά του θα διαγραφούν.",
      "Are you sure? The role and its permissions will be deleted."
    ));
    if (!confirmed) return;

    await supabase.from("role_permissions").delete().eq("role_id", roleId);
    await supabase.from("roles").delete().eq("id", roleId);

    const [rolesRes, permRes] = await Promise.all([
      supabase.from("roles").select("*").order("created_at"),
      supabase.from("role_permissions").select("*"),
    ]);
    if (rolesRes.data) setRoles(rolesRes.data);
    if (permRes.data) setRolePermissions(permRes.data);
  }

  // Load role into edit form
  function handleEditRole(role: Role) {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setSelectedPermissions(
      rolePermissions.filter((rp) => rp.role_id === role.id).map((rp) => rp.permission)
    );
    setShowRoleForm(true);
  }

  // Clear the role form
  function resetRoleForm() {
    setShowRoleForm(false);
    setEditingRoleId(null);
    setRoleName("");
    setSelectedPermissions([]);
  }

  // Toggle a permission checkbox
  function togglePermission(permId: string) {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  }

  // ═══════════════════════════════════════════════════════════
  // REVIEW + PROFESSIONAL ACTIONS
  // ═══════════════════════════════════════════════════════════

  // Change review status (approve or hide)
  async function handleReviewAction(reviewId: string, action: "active" | "removed") {
    await supabase.from("reviews").update({ status: action }).eq("id", reviewId);
    const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
    if (data) setReviews(data);
  }

  // Toggle professional active/inactive
  async function handleToggleProStatus(proId: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    await supabase.from("professionals").update({ status: newStatus }).eq("id", proId);
    const { data } = await supabase.from("professionals").select("*").order("created_at", { ascending: false });
    if (data) setProfessionals(data);
  }

  // ─── LOADING STATE ───
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-3xl">⏳</div>
      </div>
    );
  }

  // ─── ACCESS DENIED ───
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-gray-700 mb-2">
            {t("Δεν έχετε πρόσβαση", "Access Denied")}
          </h1>
          <p className="text-sm text-gray-500">
            {t("Αυτή η σελίδα είναι μόνο για διαχειριστές.", "This page is for administrators only.")}
          </p>
        </div>
      </div>
    );
  }

  // ─── FILTERED DATA ───
  const filteredPros = professionals.filter(
    (p) =>
      p.first_name.toLowerCase().includes(proSearch.toLowerCase()) ||
      p.last_name.toLowerCase().includes(proSearch.toLowerCase()) ||
      p.category_id.toLowerCase().includes(proSearch.toLowerCase())
  );

  const filteredReviews = reviews.filter(
    (r) => reviewFilter === "all" || r.type === reviewFilter
  );

  // ─── STATS ───
  const activePros = professionals.filter((p) => p.status === "active").length;
  const bookingsThisMonth = bookings.filter((b) => {
    const d = new Date(b.booking_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* ─── HEADER ─── */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
            🔧 Admin Panel
          </h1>
          <span className="text-xs text-gray-400">
            {t("Σύνδεση ως: Admin", "Logged in as: Admin")}
          </span>
        </div>

        {/* ─── TABS ─── */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "professionals", label: t("Επαγγελματίες", "Professionals") },
            { id: "bookings", label: t("Κρατήσεις", "Bookings") },
            { id: "reviews", label: t("Κριτικές", "Reviews") },
            { id: "categories", label: t("Κατηγορίες", "Categories") },
            { id: "roles", label: t("Ρόλοι", "Roles") },
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
        {/* DASHBOARD TAB                                         */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "dashboard" && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: t("Ενεργοί Επαγγ.", "Active Pros"), value: activePros.toString(), icon: "👥" },
                { label: t("Κρατήσεις (μήνας)", "Bookings (month)"), value: bookingsThisMonth.toString(), icon: "📅" },
                { label: t("Σύνολο κριτικών", "Total Reviews"), value: reviews.length.toString(), icon: "⭐" },
                { label: t("Κατηγορίες", "Categories"), value: categories.filter((c) => c.active).length.toString(), icon: "📂" },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl p-4 text-center border">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* PROFESSIONALS TAB                                     */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "professionals" && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <input
                id="pro-search"
                name="pro-search"
                value={proSearch}
                onChange={(e) => setProSearch(e.target.value)}
                placeholder={t("Αναζήτηση...", "Search...")}
                className="px-4 py-2 border rounded-lg text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <span className="text-sm text-gray-500">{filteredPros.length} {t("επαγγελματίες", "professionals")}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {[t("Όνομα", "Name"), t("Κατηγορία", "Category"), t("Βαθμ.", "Rating"), t("Κατάσταση", "Status"), t("Ενέργειες", "Actions")].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPros.map((pro) => {
                    const cat = categories.find((c) => c.id === pro.category_id);
                    return (
                      <tr key={pro.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium">{pro.first_name} {pro.last_name}</div>
                          <div className="text-xs text-gray-400">{pro.phone}</div>
                        </td>
                        <td className="px-4 py-3">{cat ? cat.emoji + " " + (lang === "el" ? cat.name_el : cat.name_en) : pro.category_id}</td>
                        <td className="px-4 py-3">⭐ {pro.rating} ({pro.review_count})</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${pro.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {pro.status === "active" ? t("Ενεργός", "Active") : t("Ανενεργός", "Inactive")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleProStatus(pro.id, pro.status)}
                            className={`text-xs px-3 py-1 rounded-lg ${pro.status === "active" ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                          >
                            {pro.status === "active" ? t("Απενεργοποίηση", "Deactivate") : t("Ενεργοποίηση", "Activate")}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* BOOKINGS TAB                                          */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "bookings" && (
          <div className="bg-white rounded-xl p-4 border">
            <h3 className="font-bold mb-4">{t("Όλες οι Κρατήσεις", "All Bookings")}</h3>
            {bookings.length > 0 ? (
              <div className="space-y-2">
                {bookings.map((bk) => {
                  const pro = professionals.find((p) => p.id === bk.professional_id);
                  return (
                    <div key={bk.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                      <div>
                        <span className="font-medium">{pro ? pro.first_name + " " + pro.last_name : "Unknown"}</span>
                        <span className="text-gray-400"> — {bk.description}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">📅 {bk.booking_date} {bk.booking_time}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          bk.status === "pending" ? "bg-yellow-100 text-yellow-700"
                          : bk.status === "confirmed" ? "bg-blue-100 text-blue-700"
                          : bk.status === "completed" ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                        }`}>
                          {bk.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">{t("Δεν υπάρχουν κρατήσεις.", "No bookings yet.")}</p>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* REVIEWS TAB                                           */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "reviews" && (
          <div className="bg-white rounded-xl p-4 border">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-bold">{t("Διαχείριση Κριτικών", "Review Moderation")}</h3>
              <div className="flex gap-2">
                {["all", "verified", "founding"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setReviewFilter(f)}
                    className={`text-xs px-3 py-1 rounded-lg transition-all ${
                      reviewFilter === f ? "bg-[var(--color-primary)] text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {f === "all" ? t("Όλες", "All") : f === "verified" ? t("Επαληθευμένες", "Verified") : t("Ιδρυτικές", "Founding")}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {filteredReviews.map((review) => {
                const pro = professionals.find((p) => p.id === review.professional_id);
                return (
                  <div key={review.id} className="border rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-medium text-sm">{pro ? pro.first_name + " " + pro.last_name : "Unknown"}</span>
                        <span className="text-yellow-500 text-sm ml-2">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                        <span className="text-xs text-gray-400 ml-2">{new Date(review.created_at).toLocaleDateString("el-GR")}</span>
                        <span className={`text-xs ml-2 px-2 py-0.5 rounded-full ${review.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {review.status}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {review.status !== "active" && (
                          <button onClick={() => handleReviewAction(review.id, "active")}
                            className="text-xs px-3 py-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100">
                            ✓ {t("Έγκριση", "Approve")}
                          </button>
                        )}
                        {review.status !== "removed" && (
                          <button onClick={() => handleReviewAction(review.id, "removed")}
                            className="text-xs px-3 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                            ✗ {t("Απόκρυψη", "Hide")}
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{review.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* CATEGORIES TAB                                        */}
        {/* Add, edit, delete, toggle categories                  */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "categories" && (
          <div>
            <div className="bg-white rounded-xl p-4 border mb-4">
              {/* Header with add button */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">📂 {t("Διαχείριση Κατηγοριών", "Category Management")}</h3>
                <button
                  onClick={() => { resetCatForm(); setShowCatForm(!showCatForm); }}
                  className="text-sm px-4 py-2 rounded-lg text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: "var(--color-success)" }}
                >
                  {showCatForm ? t("Κλείσιμο", "Close") : "+ " + t("Νέα Κατηγορία", "New Category")}
                </button>
              </div>

              {/* Add/Edit form */}
              {showCatForm && (
                <div className="border rounded-xl p-4 mb-4 bg-gray-50">
                  <h4 className="font-semibold text-sm mb-3">
                    {editingCatId ? t("Επεξεργασία Κατηγορίας", "Edit Category") : t("Νέα Κατηγορία", "New Category")}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {/* ID — only editable for new categories */}
                    <div>
                      <label htmlFor="cat-id" className="text-xs font-semibold text-gray-600 block mb-1">ID (URL-friendly)</label>
                      <input
                        id="cat-id"
                        name="cat-id"
                        value={catId}
                        onChange={(e) => setCatId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                        disabled={!!editingCatId}
                        placeholder="e.g. pool-technician"
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-200"
                      />
                    </div>
                    {/* Greek name */}
                    <div>
                      <label htmlFor="cat-name-el" className="text-xs font-semibold text-gray-600 block mb-1">{t("Ελληνικά", "Greek")}</label>
                      <input
                        id="cat-name-el"
                        name="cat-name-el"
                        value={catNameEl}
                        onChange={(e) => setCatNameEl(e.target.value)}
                        placeholder="π.χ. Τεχνικός Πισίνας"
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    {/* English name */}
                    <div>
                      <label htmlFor="cat-name-en" className="text-xs font-semibold text-gray-600 block mb-1">{t("Αγγλικά", "English")}</label>
                      <input
                        id="cat-name-en"
                        name="cat-name-en"
                        value={catNameEn}
                        onChange={(e) => setCatNameEn(e.target.value)}
                        placeholder="e.g. Pool Technician"
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    {/* Tier */}
                    <div>
                      <label htmlFor="cat-tier" className="text-xs font-semibold text-gray-600 block mb-1">Tier</label>
                      <select
                        id="cat-tier"
                        name="cat-tier"
                        value={catTier}
                        onChange={(e) => setCatTier(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        <option value="free">Free (€0 — testing/promo)</option>
                        <option value="light">Light (€10/mo)</option>
                        <option value="trades">Trades (€15/mo)</option>
                        <option value="specialists">Specialists (€25/mo)</option>
                      </select>
                    </div>
                    {/* Emoji */}
                    <div>
                      <label htmlFor="cat-emoji" className="text-xs font-semibold text-gray-600 block mb-1">Emoji</label>
                      <input
                        id="cat-emoji"
                        name="cat-emoji"
                        value={catEmoji}
                        onChange={(e) => setCatEmoji(e.target.value)}
                        placeholder="🏊"
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>
                  {/* Save/Cancel */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleSaveCategory}
                      className="px-6 py-2 text-white text-sm rounded-lg transition-all hover:opacity-90"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      {editingCatId ? t("Αποθήκευση", "Save") : t("Προσθήκη", "Add")}
                    </button>
                    <button onClick={resetCatForm} className="px-6 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200">
                      {t("Ακύρωση", "Cancel")}
                    </button>
                  </div>
                </div>
              )}

              {/* Category count */}
              <p className="text-sm text-gray-500 mb-3">
                {categories.length} {t("κατηγορίες", "categories")} •{" "}
                {categories.filter((c) => c.active).length} {t("ενεργές", "active")}
              </p>

              {/* Category table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {["", t("Ελληνικά", "Greek"), t("Αγγλικά", "English"), "Tier", t("Κατάσταση", "Status"), t("Ενέργειες", "Actions")].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => (
                      <tr key={cat.id} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2 text-lg">{cat.emoji}</td>
                        <td className="px-3 py-2">{cat.name_el}</td>
                        <td className="px-3 py-2 text-gray-500">{cat.name_en}</td>
                        <td className="px-3 py-2 text-xs">{cat.tier}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${cat.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {cat.active ? t("Ενεργή", "Active") : t("Ανενεργή", "Inactive")}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button onClick={() => handleEditCategory(cat)} className="text-xs text-blue-600 hover:underline">
                              {t("Επεξεργασία", "Edit")}
                            </button>
                            <button onClick={() => handleToggleCategory(cat.id, cat.active)}
                              className={`text-xs ${cat.active ? "text-orange-600" : "text-green-600"} hover:underline`}>
                              {cat.active ? t("Απενεργοποίηση", "Disable") : t("Ενεργοποίηση", "Enable")}
                            </button>
                            <button onClick={() => handleDeleteCategory(cat.id)} className="text-xs text-red-600 hover:underline">
                              {t("Διαγραφή", "Delete")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ROLES TAB                                             */}
        {/* Create/edit custom role groups with permissions       */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "roles" && (
          <div>
            <div className="bg-white rounded-xl p-4 border mb-4">
              {/* Header with add button */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">👥 {t("Διαχείριση Ρόλων", "Role Management")}</h3>
                <button
                  onClick={() => { resetRoleForm(); setShowRoleForm(!showRoleForm); }}
                  className="text-sm px-4 py-2 rounded-lg text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: "var(--color-success)" }}
                >
                  {showRoleForm ? t("Κλείσιμο", "Close") : "+ " + t("Νέος Ρόλος", "New Role")}
                </button>
              </div>

              {/* Role form */}
              {showRoleForm && (
                <div className="border rounded-xl p-4 mb-4 bg-gray-50">
                  <h4 className="font-semibold text-sm mb-3">
                    {editingRoleId ? t("Επεξεργασία Ρόλου", "Edit Role") : t("Νέος Ρόλος", "New Role")}
                  </h4>

                  {/* Role name */}
                  <div className="mb-4">
                    <label htmlFor="role-name" className="text-xs font-semibold text-gray-600 block mb-1">
                      {t("Όνομα Ρόλου", "Role Name")}
                    </label>
                    <input
                      id="role-name"
                      name="role-name"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      placeholder={t("π.χ. Senior Moderator", "e.g. Senior Moderator")}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  {/* Permission checkboxes */}
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-600 block mb-2">
                      {t("Δικαιώματα", "Permissions")}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {ALL_PERMISSIONS.map((perm) => (
                        <label
                          key={perm.id}
                          className={`flex items-center gap-2 p-2 rounded-lg text-sm cursor-pointer transition-all ${
                            selectedPermissions.includes(perm.id)
                              ? "bg-blue-50 border border-blue-200"
                              : "bg-white border border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                            className="rounded"
                          />
                          <span>{lang === "el" ? perm.labelEl : perm.labelEn}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Save/Cancel */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveRole}
                      className="px-6 py-2 text-white text-sm rounded-lg transition-all hover:opacity-90"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      {editingRoleId ? t("Αποθήκευση", "Save") : t("Δημιουργία", "Create")}
                    </button>
                    <button onClick={resetRoleForm} className="px-6 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200">
                      {t("Ακύρωση", "Cancel")}
                    </button>
                  </div>
                </div>
              )}

              {/* Existing roles list */}
              {roles.length > 0 ? (
                <div className="space-y-3">
                  {roles.map((role) => {
                    const perms = rolePermissions.filter((rp) => rp.role_id === role.id);
                    return (
                      <div key={role.id} className="border rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm">{role.name}</span>
                          <div className="flex gap-2">
                            <button onClick={() => handleEditRole(role)} className="text-xs text-blue-600 hover:underline">
                              {t("Επεξεργασία", "Edit")}
                            </button>
                            <button onClick={() => handleDeleteRole(role.id)} className="text-xs text-red-600 hover:underline">
                              {t("Διαγραφή", "Delete")}
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {perms.map((p) => {
                            const permInfo = ALL_PERMISSIONS.find((ap) => ap.id === p.permission);
                            return (
                              <span key={p.permission} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                                {permInfo ? (lang === "el" ? permInfo.labelEl : permInfo.labelEn) : p.permission}
                              </span>
                            );
                          })}
                          {perms.length === 0 && (
                            <span className="text-xs text-gray-400">{t("Χωρίς δικαιώματα", "No permissions")}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">
                  {t("Δεν υπάρχουν ρόλοι. Δημιουργήστε τον πρώτο!", "No roles yet. Create the first one!")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* SETTINGS TAB                                          */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-4 border">
              <h3 className="font-bold mb-4">💰 {t("Τιμοκατάλογος", "Pricing")}</h3>
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
                    <tr className="border-b"><td className="px-3 py-2 font-medium">Free</td><td className="px-3 py-2 text-center">€0</td><td className="px-3 py-2 text-center">€0</td><td className="px-3 py-2 text-center">€0</td></tr>
                    <tr className="border-b bg-gray-50"><td className="px-3 py-2 font-medium">Light</td><td className="px-3 py-2 text-center">€10</td><td className="px-3 py-2 text-center">€15</td><td className="px-3 py-2 text-center">€20</td></tr>
                    <tr className="border-b"><td className="px-3 py-2 font-medium">Trades</td><td className="px-3 py-2 text-center">€15</td><td className="px-3 py-2 text-center">€20</td><td className="px-3 py-2 text-center">€25</td></tr>
                    <tr><td className="px-3 py-2 font-medium">Specialists</td><td className="px-3 py-2 text-center">€25</td><td className="px-3 py-2 text-center">€35</td><td className="px-3 py-2 text-center">€45</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}