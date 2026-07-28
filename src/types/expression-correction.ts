export type ExpressionCorrectionField =
  | "phrase"
  | "meaning"
  | "example_en"
  | "example_zh";

export const EXPRESSION_CORRECTION_FIELDS: ExpressionCorrectionField[] = [
  "phrase",
  "meaning",
  "example_en",
  "example_zh",
];

export function isExpressionCorrectionField(
  value: string
): value is ExpressionCorrectionField {
  return EXPRESSION_CORRECTION_FIELDS.includes(
    value as ExpressionCorrectionField
  );
}

export type ExpressionCorrectionInput = {
  field: ExpressionCorrectionField;
  value: string;
  /** Zero-based index into examples[]; required for example_en / example_zh. */
  exampleIndex?: number;
};
