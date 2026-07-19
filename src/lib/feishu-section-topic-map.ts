import type { Topic, TopicIndexEntry } from "@/types/topic";

/**
 * Optional overrides when a Feishu section label differs from the topic slug/name.
 * Default rule: section label matches a leaf topic slug or name (case-insensitive).
 */
export const FEISHU_SECTION_TOPIC_SLUG_OVERRIDES: Record<string, string> = {};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function resolveLeafTopicIdBySlug(
  slug: string,
  topicIndex: Map<string, TopicIndexEntry>
): string | null {
  const entry = topicIndex.get(normalizeKey(slug));
  if (!entry || entry.childCount > 0) {
    return null;
  }
  return entry.id;
}

/**
 * Resolve `topic_id` for a Feishu section label using static rules (no LLM).
 * Returns null when unmapped — never falls back to uncategorized.
 */
export function resolveFeishuSectionTopicId(
  feishuSection: string | null | undefined,
  topicIndex: Map<string, TopicIndexEntry>,
  topics: Topic[]
): string | null {
  const trimmed = feishuSection?.trim();
  if (!trimmed) return null;

  const overrideSlug =
    FEISHU_SECTION_TOPIC_SLUG_OVERRIDES[trimmed] ??
    FEISHU_SECTION_TOPIC_SLUG_OVERRIDES[normalizeKey(trimmed)];

  if (overrideSlug) {
    return resolveLeafTopicIdBySlug(overrideSlug, topicIndex);
  }

  const bySlug = resolveLeafTopicIdBySlug(trimmed, topicIndex);
  if (bySlug) return bySlug;

  const normalizedSection = normalizeKey(trimmed);
  for (const topic of topics) {
    if (normalizeKey(topic.name) === normalizedSection) {
      const byName = resolveLeafTopicIdBySlug(topic.slug, topicIndex);
      if (byName) return byName;
    }
  }

  return null;
}
