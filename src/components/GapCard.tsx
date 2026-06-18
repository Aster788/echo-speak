import type { Gap } from "@/services/gap-detector";

interface GapCardProps {
  gap: Gap;
}

const priorityColor: Record<Gap["priority"], string> = {
  high: "border-red-300 bg-red-50",
  medium: "border-yellow-300 bg-yellow-50",
  low: "border-gray-200",
};

export function GapCard({ gap }: GapCardProps) {
  return (
    <article className={`rounded-lg border p-4 ${priorityColor[gap.priority]}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{gap.phrase}</h3>
        <span className="text-xs uppercase text-gray-500">{gap.priority}</span>
      </div>
      <p className="mt-1 text-sm text-gray-600">{gap.reason}</p>
      <blockquote className="mt-2 border-l-2 pl-3 text-sm italic">
        {gap.evidence}
      </blockquote>
    </article>
  );
}
