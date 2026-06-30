import type { Topic } from "@/types/topic";

export type TopicSeed = {
  slug: string;
  name: string;
  children?: TopicSeed[];
};

export const TOPIC_SEEDS: TopicSeed[] = [
  {
    slug: "food",
    name: "Food",
    children: [
      { slug: "drinks", name: "Drinks" },
      { slug: "cooking", name: "Cooking" },
      { slug: "dining-out", name: "Dining Out" },
      { slug: "grocery", name: "Grocery" },
    ],
  },
  {
    slug: "workout",
    name: "Workout",
    children: [
      { slug: "gym", name: "Gym" },
      { slug: "recovery", name: "Recovery" },
    ],
  },
  {
    slug: "travel",
    name: "Travel",
    children: [
      { slug: "packing", name: "Packing" },
      { slug: "airport", name: "Airport" },
      { slug: "hotel", name: "Hotel" },
    ],
  },
  { slug: "shopping", name: "Shopping" },
  { slug: "productivity", name: "Productivity" },
  { slug: "daily", name: "Daily" },
  { slug: "work", name: "Work" },
  { slug: "social", name: "Social" },
  { slug: "uncategorized", name: "Uncategorized" },
];

export function flattenTopicSeeds(
  seeds: TopicSeed[] = TOPIC_SEEDS,
  parentSlug: string | null = null
): Array<{ slug: string; name: string; parentSlug: string | null }> {
  const rows: Array<{ slug: string; name: string; parentSlug: string | null }> =
    [];

  for (const seed of seeds) {
    rows.push({ slug: seed.slug, name: seed.name, parentSlug });
    if (seed.children?.length) {
      rows.push(...flattenTopicSeeds(seed.children, seed.slug));
    }
  }

  return rows;
}

/**
 * Build a nested seed tree from flat DB topic rows (joined via parent_id).
 * Topics with a `merged_into_id` are skipped (already merged away).
 */
export function topicsToSeeds(topics: Topic[]): TopicSeed[] {
  const active = topics.filter((t) => !t.merged_into_id);
  const byParent = new Map<string | null, Topic[]>();
  for (const topic of active) {
    const key = topic.parent_id ?? null;
    const list = byParent.get(key) ?? [];
    list.push(topic);
    byParent.set(key, list);
  }

  function build(parentId: string | null): TopicSeed[] {
    const children = byParent.get(parentId) ?? [];
    return children.map((topic) => {
      const childSeeds = build(topic.id);
      return {
        slug: topic.slug,
        name: topic.name,
        ...(childSeeds.length ? { children: childSeeds } : {}),
      };
    });
  }

  return build(null);
}

/**
 * Format the topic tree for the extraction prompt.
 *
 * Production callers should pass the live `topics` loaded from the DB so the
 * prompt reflects user-curated topics. The no-arg overload (TOPIC_SEEDS) is
 * kept for unit-test fixtures only and is deprecated for production use.
 */
export function formatTopicTreeForPrompt(topics?: Topic[]): string {
  const seeds = topics ? topicsToSeeds(topics) : TOPIC_SEEDS;
  return formatTopicTreeFromSeeds(seeds, 0);
}

function formatTopicTreeFromSeeds(seeds: TopicSeed[], indent: number): string {
  const pad = "  ".repeat(indent);
  return seeds
    .map((seed) => {
      const line = `${pad}- ${seed.slug} (${seed.name})`;
      if (!seed.children?.length) {
        return line;
      }
      return `${line}\n${formatTopicTreeFromSeeds(seed.children, indent + 1)}`;
    })
    .join("\n");
}

/**
 * List leaf topic slugs (topics with no children).
 *
 * Production callers should pass live `topics`; the no-arg overload uses
 * TOPIC_SEEDS for unit-test fixtures only.
 */
export function listLeafTopicSlugs(topics?: Topic[]): string[] {
  const seeds = topics ? topicsToSeeds(topics) : TOPIC_SEEDS;
  return collectLeafSlugs(seeds);
}

function collectLeafSlugs(seeds: TopicSeed[]): string[] {
  const leaves: string[] = [];
  for (const seed of seeds) {
    if (seed.children?.length) {
      leaves.push(...collectLeafSlugs(seed.children));
    } else {
      leaves.push(seed.slug);
    }
  }
  return leaves;
}
