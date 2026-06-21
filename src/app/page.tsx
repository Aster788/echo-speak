import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";

export default function HomePage() {
  return (
    <PageShell>
      <PageHeader
        title="Echo Speak"
        description="Turn video transcripts into expressions you actually remember."
      />
      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/import"
          className="rounded-[1rem] border-[2.5px] border-[#000000] bg-[#000000] px-4 py-2.5 text-center text-[0.8125rem] font-medium text-[#FFFFFF] transition-opacity duration-150 hover:opacity-90"
        >
          Import transcript
        </Link>
        <Link
          href="/review"
          className="rounded-[1rem] border-[2.5px] border-[#D4D4D4] px-4 py-2.5 text-center text-[0.8125rem] font-medium text-[#222222] transition-opacity duration-150 hover:opacity-80"
        >
          Start review
        </Link>
      </div>
    </PageShell>
  );
}
