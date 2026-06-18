import type { Expression } from "@/types/expression";

interface ExpressionCardProps {
  expression: Expression;
}

export function ExpressionCard({ expression }: ExpressionCardProps) {
  return (
    <article className="rounded-lg border p-4">
      <h3 className="font-semibold">{expression.phrase}</h3>
      <p className="text-sm text-gray-600">{expression.definition}</p>
      {expression.example && (
        <p className="mt-2 text-sm italic">&ldquo;{expression.example}&rdquo;</p>
      )}
      <p className="mt-2 text-xs text-gray-400">
        Score: {Math.round(expression.score * 100)}%
      </p>
    </article>
  );
}
