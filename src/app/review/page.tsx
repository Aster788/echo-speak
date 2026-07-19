import { PageHeader } from "@/components/PageHeader";
import { ReviewSession } from "@/components/review/ReviewSession";
import {
  buildTodaysReviewDeck,
  listReviewTopicScopes,
  listReviewVideoScopes,
} from "@/app/review/actions";

export const dynamic = "force-dynamic";

type ReviewPageProps = {
  searchParams: Promise<{ start?: string }>;
};

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const params = await searchParams;
  const [videoScopes, topicScopes, todaysReview] = await Promise.all([
    listReviewVideoScopes(),
    listReviewTopicScopes(),
    buildTodaysReviewDeck(),
  ]);

  return (
    <>
      <PageHeader description="Flip your cards and recall the English." />
      <div className="mt-1 flex min-h-0 flex-1 flex-col min-w-0">
        <ReviewSession
          videoScopes={videoScopes}
          topicScopes={topicScopes}
          initialSummary={todaysReview.summary}
          initialTodaysCards={todaysReview.cards}
          autoStartTodaysReview={params.start === "todays"}
        />
      </div>
    </>
  );
}
