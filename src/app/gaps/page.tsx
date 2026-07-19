import { PageHeader } from "@/components/PageHeader";

export default function GapsPage() {
  return (
    <>
      <PageHeader description="Phrases you encounter but have not mastered." />
      <p className="mt-8 text-center text-[0.8125rem] font-normal text-[#222222] opacity-70">
        No gaps detected.
      </p>
    </>
  );
}
