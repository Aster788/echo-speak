import type { ReviewCard } from "@/types/review";

interface ReviewCardProps {
  card: ReviewCard;
  onRate?: (rating: number) => void;
}

export function ReviewCard({ card, onRate }: ReviewCardProps) {
  return (
    <article className="rounded-lg border p-6">
      <p className="text-lg">{card.prompt}</p>
      {card.hint && (
        <p className="mt-2 text-sm text-gray-500">Hint: {card.hint}</p>
      )}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-blue-600">Show answer</summary>
        <p className="mt-2">{card.answer}</p>
      </details>
      {onRate && (
        <div className="mt-4 flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onRate(n)}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
