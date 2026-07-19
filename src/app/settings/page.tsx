import { PageHeader } from "@/components/PageHeader";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { loadSettings } from "@/app/settings/actions";
import { getUserSettings } from "@/db/user-settings";
import { DEFAULT_DAILY_REVIEW_BUDGET } from "@/lib/daily-review-budget";
import { parseEmailOtpAuthReason } from "@/lib/auth-email-otp";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams: Promise<{ auth?: string; reason?: string }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const initial = await loadSettings();
  const authReason =
    params.auth === "error" ? parseEmailOtpAuthReason(params.reason) : null;

  const user = await getAuthenticatedUser();
  let reviewBudget: number = DEFAULT_DAILY_REVIEW_BUDGET;
  if (user) {
    const settings = await getUserSettings(user.id, getSupabaseAdmin());
    reviewBudget = settings?.daily_review_budget ?? DEFAULT_DAILY_REVIEW_BUDGET;
  }

  return (
    <>
      <PageHeader description="Sign in to save your own keys. The site provides the shared database." />
      <SettingsForm
        initial={initial}
        authReason={authReason}
        reviewBudget={reviewBudget}
      />
    </>
  );
}
