import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";
import { ReviewSession } from "@/components/review/ReviewSession";
import {
  listReviewTopicScopes,
  listReviewVideoScopes,
} from "@/app/review/actions";

export default async function ReviewPage() {
  const [videoScopes, topicScopes] = await Promise.all([
    listReviewVideoScopes(),
    listReviewTopicScopes(),
  ]);

  return (
    <PageShell mainClassName="relative flex min-h-0 flex-1 flex-col">
      <PageHeader description="Flip your cards and recall the English." />
      <div className="mt-1 flex min-h-0 flex-1 flex-col min-w-0">
        <ReviewSession videoScopes={videoScopes} topicScopes={topicScopes} />
      </div>
    </PageShell>
  );
}
