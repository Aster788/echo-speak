import type { Expression } from "@/types/expression";
import type { Topic, TopicTreeNode } from "@/types/topic";
import type { Video } from "@/types/transcript";

const LOCALE = "en";

export function compareNames(a: string, b: string): number {
  return a.localeCompare(b, LOCALE, { sensitivity: "base" });
}

export function sortExpressionsByPhrase(
  expressions: Expression[]
): Expression[] {
  return [...expressions].sort((a, b) => {
    const phraseCmp = compareNames(
      a.phrase.trim() || a.example_en,
      b.phrase.trim() || b.example_en
    );
    if (phraseCmp !== 0) return phraseCmp;
    return a.id.localeCompare(b.id);
  });
}

export function sortTopicsByName<T extends Pick<Topic, "name" | "id">>(
  topics: T[]
): T[] {
  return [...topics].sort((a, b) => {
    const cmp = compareNames(a.name, b.name);
    if (cmp !== 0) return cmp;
    return a.id.localeCompare(b.id);
  });
}

export function sortTopicTreeByName(tree: TopicTreeNode[]): TopicTreeNode[] {
  return sortTopicsByName(tree).map((node) => ({
    ...node,
    children: sortTopicTreeByName(node.children),
  }));
}

export function sortVideosByTitle(videos: Video[]): Video[] {
  return [...videos].sort((a, b) => {
    const cmp = compareNames(a.title, b.title);
    if (cmp !== 0) return cmp;
    return a.id.localeCompare(b.id);
  });
}
