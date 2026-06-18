export interface Expression {
  id: string;
  phrase: string;
  definition: string;
  example: string;
  sourceTranscriptId: string | null;
  score: number;
  createdAt: string;
}

export interface ExtractedExpression {
  phrase: string;
  definition: string;
  example: string;
  context?: string;
}
