import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";
import { ImportForm } from "./ImportForm";

export default function ImportPage() {
  return (
    <PageShell>
      <PageHeader
        title="Import Transcript"
        description="Upload or paste a YouTube transcript to clean and save."
      />
      <div className="mt-6">
        <ImportForm />
      </div>
    </PageShell>
  );
}
