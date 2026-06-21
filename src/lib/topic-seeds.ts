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

export function formatTopicTreeForPrompt(
  seeds: TopicSeed[] = TOPIC_SEEDS,
  indent = 0
): string {
  const pad = "  ".repeat(indent);
  return seeds
    .map((seed) => {
      const line = `${pad}- ${seed.slug} (${seed.name})`;
      if (!seed.children?.length) {
        return line;
      }
      return `${line}\n${formatTopicTreeForPrompt(seed.children, indent + 1)}`;
    })
    .join("\n");
}

export function listLeafTopicSlugs(seeds: TopicSeed[] = TOPIC_SEEDS): string[] {
  const leaves: string[] = [];
  for (const seed of seeds) {
    if (seed.children?.length) {
      leaves.push(...listLeafTopicSlugs(seed.children));
    } else {
      leaves.push(seed.slug);
    }
  }
  return leaves;
}
