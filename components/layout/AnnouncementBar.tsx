// =============================================================
// components/layout/AnnouncementBar.tsx
// =============================================================
// Displays the active announcement (if any) at the top of every
// page, above the Navbar.
//
// SERVER COMPONENT — fetches the latest active announcement from
// Supabase at request time. Shows nothing if no active announcement
// exists or if it's outside the starts_at / ends_at window.
// =============================================================

import { createClient } from "@/lib/supabase/server";
import AnnouncementBarClient from "./AnnouncementBarClient";

export default async function AnnouncementBar({ locale }: { locale: string }) {
  const supabase = await createClient();

  // Fetch the most recent active announcement
  const { data } = await supabase
    .from("announcements")
    .select("id, text_el, text_en, link_url")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Nothing to show
  if (!data) return null;

  const text = locale === "en" && data.text_en ? data.text_en : data.text_el;

  return (
    <AnnouncementBarClient
      id={data.id}
      text={text}
      linkUrl={data.link_url ?? null}
    />
  );
}
