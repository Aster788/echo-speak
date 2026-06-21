import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";

export default function ReviewPage() {
  return (
    <PageShell>
      <PageHeader
        title="Review"
        description="Spaced-repetition cards due today."
      />
      <p className="mt-8 text-center text-[0.8125rem] font-normal text-[#222222] opacity-70">
        No reviews due.
      </p>
    </PageShell>
  );
}
