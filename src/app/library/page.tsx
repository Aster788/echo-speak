import { PageHeader } from "@/components/PageHeader";

export default function LibraryPage() {
  return (
    <>
      <PageHeader description="All expressions extracted from your transcripts." />
      <p className="mt-8 text-center text-[0.8125rem] font-normal text-[#222222] opacity-70">
        No expressions yet.
      </p>
    </>
  );
}