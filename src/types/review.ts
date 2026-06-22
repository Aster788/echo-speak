export type ReviewRating = "mastered" | "again" | "unsure";
export type ReviewMode = "video" | "topic";

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
  topic_id: string;
  source_type: "transcript" | "feishu";
  weight: number;
  topic_locked: boolean;
  created_at: string;
  videoTitle: string;
  topicName: string;
}

export interface ReviewScopeOption {
  id: string;
  label: string;
  count: number;
}
