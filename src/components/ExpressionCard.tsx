import type { Expression } from "@/types/expression";

interface ExpressionCardProps {
  expression: Expression;
}

export function ExpressionCard({ expression }: ExpressionCardProps) {
  return (
    <article className="rounded-lg border p-4">
      <h3 className="font-semibold">{expression.phrase}</h3>
      <p className="text-sm text-[#222222]">{expression.meaning}</p>
      {expression.example_en && (
        <p className="mt-2 text-sm italic">&ldquo;{expression.example_en}&rdquo;</p>
      )}
      <p className="mt-2 text-xs text-[#222222] opacity-70">
        Weight: {expression.weight}
      </p>
    </article>
  );
}
