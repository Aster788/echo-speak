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
