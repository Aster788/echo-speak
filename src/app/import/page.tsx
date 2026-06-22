import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";
import { ImportForm } from "./ImportForm";

export default function ImportPage() {
  return (
    <PageShell mainClassName="flex min-h-0 flex-1 flex-col">
      <PageHeader description="Add a new collection to your archive." />
      <div className="mt-6 flex min-h-0 flex-1 flex-col min-w-0">
        <ImportForm />
      </div>
    </PageShell>
  );
}
