import { PageHeader } from "@/components/PageHeader";
import {
  listLeafTopics,
  listTopicTree,
  listTopicsWithExpressionCounts,
} from "@/db/topics";
import { getSupabaseAdmin } from "@/lib/supabase";
import { TopicsManager } from "./TopicsManager";

export const dynamic = "force-dynamic";

export default async function TopicsPage() {
  const supabase = getSupabaseAdmin();
  const { topics, counts } =
    await listTopicsWithExpressionCounts(supabase);
  const tree = listTopicTree(topics);
  const dockTopics = listLeafTopics(topics).map((topic) => ({
    id: topic.id,
    name: topic.name,
    slug: topic.slug,
  }));

  return (
    <div className="pb-32">
      <PageHeader description="Curate your topic tree, move expressions, or drag to the trash." />
      <div className="mt-6">
        <TopicsManager
          initialTree={tree}
          initialCounts={Object.fromEntries(counts)}
          dockTopics={dockTopics}
        />
      </div>
    </div>
  );
}
