import type { ExpressionExample } from "@/types/expression";
import type {
  ExpressionCorrectionField,
  ExpressionCorrectionInput,
} from "@/types/expression-correction";

export type CorrectableExpressionFields = {
  phrase: string;
  meaning: string;
  example_en: string | null;
  example_zh: string | null;
  examples?: ExpressionExample[] | null;
};

export function collectCorrectableExamples(
  expression: Pick<
    CorrectableExpressionFields,
    "examples" | "example_en" | "example_zh"
  >
): ExpressionExample[] {
  if (expression.examples && expression.examples.length > 0) {
    return expression.examples.map((example) => ({
      en: example.en ?? "",
      zh: example.zh ?? null,
    }));
  }
  if (expression.example_en?.trim()) {
    return [{ en: expression.example_en, zh: expression.example_zh }];
  }
  return [];
}

export function isExampleCorrectionField(
  field: ExpressionCorrectionField
): field is "example_en" | "example_zh" {
  return field === "example_en" || field === "example_zh";
}

export function prefillCorrectionValue(
  expression: CorrectableExpressionFields,
  field: ExpressionCorrectionField,
  exampleIndex = 0
): string {
  if (field === "phrase") return expression.phrase;
  if (field === "meaning") return expression.meaning;

  const examples = collectCorrectableExamples(expression);
  const example = examples[exampleIndex];
  if (!example) return "";
  return field === "example_en" ? example.en : (example.zh ?? "");
}

/**
 * Apply a learner correction to expression content fields.
 * Keeps `example_en` / `example_zh` mirrored from `examples[0]`.
 */
export function applyExpressionCorrection(
  current: CorrectableExpressionFields,
  input: ExpressionCorrectionInput
): CorrectableExpressionFields {
  const value = input.value.trim();
  if (!value) {
    throw new Error("Corrected content cannot be empty.");
  }

  if (input.field === "phrase") {
    return { ...current, phrase: value };
  }

  if (input.field === "meaning") {
    return { ...current, meaning: value };
  }

  const examples = collectCorrectableExamples(current);
  if (examples.length === 0) {
    throw new Error("This expression has no examples to correct.");
  }

  const exampleIndex = input.exampleIndex ?? 0;
  if (
    !Number.isInteger(exampleIndex) ||
    exampleIndex < 0 ||
    exampleIndex >= examples.length
  ) {
    throw new Error("exampleIndex is out of range.");
  }

  const nextExamples = examples.map((example, index) => {
    if (index !== exampleIndex) return example;
    if (input.field === "example_en") {
      return { ...example, en: value };
    }
    return { ...example, zh: value };
  });

  return {
    ...current,
    examples: nextExamples,
    example_en: nextExamples[0]?.en ?? current.example_en,
    example_zh: nextExamples[0]?.zh ?? current.example_zh,
  };
}
