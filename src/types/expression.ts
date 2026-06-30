export interface ExpressionExample {
  en: string;
  zh: string | null;
}

export interface Expression {
  id: string;
  video_id: string;
  phrase: string;
  meaning: string;
  example_en: string;
  example_zh: string | null;
  examples: ExpressionExample[] | null;
  topic_id: string;
  source_type: "transcript" | "feishu";
  weight: number;
  topic_locked: boolean;
  created_at: string;
}

export interface ExtractedExpression {
  phrase: string;
  definition: string;
  example: string;
  topic_slug: string;
}

export type CreateExpressionInput = {
  video_id: string;
  phrase: string;
  meaning: string;
  example_en: string;
  example_zh?: string | null;
  examples?: ExpressionExample[] | null;
  topic_id: string;
  source_type?: "transcript" | "feishu";
  weight?: number;
};
