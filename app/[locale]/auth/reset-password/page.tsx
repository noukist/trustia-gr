// =============================================================
// app/[locale]/auth/reset-password/page.tsx
// =============================================================
// Thin server component — provides generateMetadata (requires
// a server component) and renders the client-side ResetPasswordForm.
//
// FLOW
//   1. User clicks "Forgot password" on /login
//   2. supabase.auth.resetPasswordForEmail() is called with
//      redirectTo: `/auth/reset-password`
//   3. User clicks the magic link in their email
//   4. Supabase redirects here with an access_token in the URL hash
//   5. Supabase JS client picks up the token automatically (PKCE)
//   6. ResetPasswordForm calls supabase.auth.updateUser({ password })
// =============================================================

import type { Metadata }      from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

type PageParams = Promise<{ locale: string }>;

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.resetPassword" });
  return { title: t("pageTitle") };
}

export default async function ResetPasswordPage({
  params,
}: {
  params: PageParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // All UI is in the client component (needs useState for form).
  return <ResetPasswordForm />;
}
