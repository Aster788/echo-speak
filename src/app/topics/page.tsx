import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";
import {
  getTopicExpressionCounts,
  listLeafTopics,
  listTopicTree,
  listTopics,
} from "@/db/topics";
import { getSupabaseAdmin } from "@/lib/supabase";
import { TopicsManager } from "./TopicsManager";

export const dynamic = "force-dynamic";

export default async function TopicsPage() {
  const supabase = getSupabaseAdmin();
  const topics = await listTopics(supabase);
  const tree = listTopicTree(topics);
  const counts = await getTopicExpressionCounts(supabase);
  const dockTopics = listLeafTopics(topics).map((topic) => ({
    id: topic.id,
    name: topic.name,
    slug: topic.slug,
  }));

  return (
    <PageShell mainClassName="pb-32">
      <PageHeader description="Curate your topic tree, move expressions, or drag to the trash." />
      <div className="mt-6">
        <TopicsManager
          initialTree={tree}
          initialCounts={Object.fromEntries(counts)}
          dockTopics={dockTopics}
        />
      </div>
    </PageShell>
  );
}
