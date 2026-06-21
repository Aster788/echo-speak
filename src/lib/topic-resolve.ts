import type { TopicIndexEntry } from "@/types/topic";

export const UNCATEGORIZED_SLUG = "uncategorized";

export function resolveTopicSlug(
  slug: string,
  index: Map<string, TopicIndexEntry>
): string {
  const normalized = slug.trim().toLowerCase();
  const uncategorized = index.get(UNCATEGORIZED_SLUG);
  if (!uncategorized) {
    throw new Error(`Topic "${UNCATEGORIZED_SLUG}" is not configured.`);
  }

  const entry = index.get(normalized);
  if (!entry) {
    return uncategorized.id;
  }

  if (entry.childCount > 0) {
    return uncategorized.id;
  }

  return entry.id;
}
