import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { loadSettings } from "@/app/settings/actions";
import { parseMagicLinkAuthReason } from "@/lib/auth-magic-link";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams: Promise<{ auth?: string; reason?: string }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const initial = await loadSettings();
  const authReason =
    params.auth === "error" ? parseMagicLinkAuthReason(params.reason) : null;

  return (
    <PageShell>
      <PageHeader description="Sign in to save your own keys. The site provides the shared database." />
      <SettingsForm initial={initial} authReason={authReason} />
    </PageShell>
  );
}
