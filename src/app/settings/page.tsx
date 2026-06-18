import { Navbar } from "@/components/Navbar";

export default function SettingsPage() {
  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          API keys are configured via environment variables.
        </p>
        <ul className="mt-6 list-inside list-disc text-sm text-gray-600">
          <li>OPENAI_API_KEY</li>
          <li>NEXT_PUBLIC_SUPABASE_URL</li>
          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
          <li>SUPABASE_SERVICE_ROLE_KEY (scripts only)</li>
        </ul>
      </main>
    </div>
  );
}
