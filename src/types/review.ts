import type { ExpressionExample } from "@/types/expression";

export type ReviewRating = "mastered" | "again" | "unsure";
export type ReviewMode = "todays_review" | "video" | "topic";
export type MemoryState = "learning" | "reviewing";

export type CardType = "phrase_to_meaning" | "meaning_to_phrase" | "fill_blank";

export interface ReviewCard {
  prompt: string;
  answer: string;
  hint?: string;
  cardType: CardType;
}

export interface Review {
  id: string;
  expressionId: string;
  dueAt: string;
  completedAt: string | null;
  rating: number | null;
}

export interface ReviewHistoryEntry {
  id: string;
  expression_id: string;
  rating: ReviewRating;
  reviewed_at: string;
  mode: ReviewMode;
  scope_id: string;
}

export interface ReviewDeckCard {
  id: string;
  video_id: string;
  phrase: string;
  meaning: string;
  example_en: string;
  example_zh: string | null;
  examples?: ExpressionExample[] | null;
  topic_id: string | null;
  source_type: "transcript" | "feishu";
  weight: number;
  topic_locked: boolean;
  feishu_section?: string | null;
  phonetic?: string | null;
  created_at: string;
  videoTitle: string;
  topicName: string;
}

export interface ReviewScopeOption {
  id: string;
  label: string;
  count: number;
}

export type ReviewQueueSource = "transcript" | "feishu" | "manual";

export type ReviewQueueRow = {
  id: string;
  expression_id: string;
  due_at: string;
  source: ReviewQueueSource;
  created_at: string;
  memory_state: MemoryState;
  interval_days: number;
  last_reviewed_at: string | null;
  first_reviewed_at: string | null;
};

export type ReviewQueueUpsert = {
  expressionId: string;
  dueAt: Date;
  memoryState: MemoryState;
  intervalDays: number;
  lastReviewedAt: string;
  firstReviewedAt: string;
  source?: ReviewQueueSource;
};

export type TodaysReviewSummary = {
  budget: number;
  sliceSize: number;
  dueEligible: number;
  newEligible: number;
  totalEligible: number;
  displayLabel: string;
  canContinueToday: boolean;
  isCaughtUp: boolean;
};

export type NewExpressionCandidate = {
  id: string;
  video_id: string;
  topic_id: string | null;
  created_at: string;
};
