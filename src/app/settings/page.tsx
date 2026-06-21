import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";

export default function SettingsPage() {
  return (
    <PageShell>
      <PageHeader
        title="Settings"
        description="API keys are configured via environment variables."
      />
      <ul className="mt-6 space-y-2 text-[0.8125rem] font-normal text-[#222222]">
        <li>LLM_API_KEY</li>
        <li>LLM_BASE_URL (e.g. https://api.deepseek.com)</li>
        <li>LLM_MODEL (e.g. deepseek-chat)</li>
        <li>NEXT_PUBLIC_SUPABASE_URL</li>
        <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
        <li>SUPABASE_SERVICE_ROLE_KEY (scripts only)</li>
      </ul>
    </PageShell>
  );
}
