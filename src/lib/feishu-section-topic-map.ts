import type { Topic, TopicIndexEntry } from "@/types/topic";

/**
 * Optional overrides when a Feishu section label differs from the topic slug/name.
 * Default rule: section label matches a topic slug or name (case-insensitive),
 * including topics that have children (e.g. 【Shopping】 → Shopping).
 */
export const FEISHU_SECTION_TOPIC_SLUG_OVERRIDES: Record<string, string> = {};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function resolveTopicIdBySlug(
  slug: string,
  topicIndex: Map<string, TopicIndexEntry>
): string | null {
  const entry = topicIndex.get(normalizeKey(slug));
  return entry?.id ?? null;
}

/**
 * Resolve `topic_id` for a Feishu section label using static rules (no LLM).
 * Returns null when unmapped — never falls back to uncategorized.
 * Exact slug/name matches may target parent topics that still have children.
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
    return resolveTopicIdBySlug(overrideSlug, topicIndex);
  }

  const bySlug = resolveTopicIdBySlug(trimmed, topicIndex);
  if (bySlug) return bySlug;

  const normalizedSection = normalizeKey(trimmed);
  // Also try spaced names as kebab slug: "Social Media" → "social-media"
  const kebabSlug = normalizedSection.replace(/\s+/g, "-");
  const byKebab = resolveTopicIdBySlug(kebabSlug, topicIndex);
  if (byKebab) return byKebab;

  for (const topic of topics) {
    if (normalizeKey(topic.name) === normalizedSection) {
      return resolveTopicIdBySlug(topic.slug, topicIndex);
    }
  }

  return null;
}
