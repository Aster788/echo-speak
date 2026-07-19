import { PageHeader } from "@/components/PageHeader";
import { GapsManager } from "@/components/gaps/GapsManager";
import { listPendingGapsWithContext } from "@/db/gaps";
import { isSupabaseConfigError } from "@/lib/supabase-env";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function GapsPage() {
  try {
    const gaps = await listPendingGapsWithContext(getSupabaseAdmin());

    return (
      <>
        <PageHeader description="Blind spots: in extract, not in Feishu. Accept to keep; Ignore to delete from library." />
        <GapsManager
          initialGaps={gaps.map((gap) => ({
            id: gap.id,
            phrase: gap.phrase,
            meaning: gap.meaning,
            video_id: gap.video_id,
            video_title: gap.video_title,
            video_creator: gap.video_creator,
            reason: gap.reason,
          }))}
        />
      </>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load gaps.";

    return (
      <>
        <PageHeader description="Blind spots: in extract, not in Feishu. Accept to keep; Ignore to delete from library." />
        <p className="mt-8 text-center text-[0.8125rem] font-normal text-[#222222] opacity-70">
          {isSupabaseConfigError(message)
            ? "Supabase is not configured."
            : message}
        </p>
      </>
    );
  }
}
