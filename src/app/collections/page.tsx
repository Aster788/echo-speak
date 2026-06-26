import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";
import { CollectionsError } from "@/components/collections/CollectionsError";
import {
  getTopicExpressionCounts,
  listTopicTree,
  listTopics,
} from "@/db/topics";
import { isSupabaseConfigError } from "@/lib/supabase-env";
import { getSupabaseAdmin } from "@/lib/supabase";
import { CollectionsManager } from "./CollectionsManager";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  try {
    const supabase = getSupabaseAdmin();
    const topics = await listTopics(supabase);
    const tree = listTopicTree(topics);
    const counts = await getTopicExpressionCounts(supabase);

    return (
      <PageShell>
        <PageHeader description="Build your personal library of natural English expressions." />
        <div className="mt-4">
          <CollectionsManager
            initialTree={tree}
            initialCounts={Object.fromEntries(counts)}
          />
        </div>
      </PageShell>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to connect to Supabase.";

    return (
      <PageShell>
        <PageHeader description="Build your personal library of natural English expressions." />
        <div className="mt-4">
          <CollectionsError
            message={
              isSupabaseConfigError(message)
                ? message
                : "Database request failed. Check that Supabase is running and env keys match the URL."
            }
          />
        </div>
      </PageShell>
    );
  }
}
