import type { Expression } from "@/types/expression";
import type { Topic, TopicTreeNode } from "@/types/topic";
import type { Video } from "@/types/transcript";

const LOCALE_EN = "en";
const LOCALE_ZH_PINYIN = "zh-Hans-CN";

/** True when the first letter-like character in the title is CJK. */
export function isChinesePrimaryTitle(title: string): boolean {
  const match = title.trim().match(/[a-zA-Z\u4e00-\u9fff\u3400-\u4dbf]/);
  if (!match) return false;
  return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(match[0]);
}

export function compareNames(a: string, b: string): number {
  return a.localeCompare(b, LOCALE_EN, { sensitivity: "base" });
}

export function compareVideoTitles(a: string, b: string): number {
  const aChinese = isChinesePrimaryTitle(a);
  const bChinese = isChinesePrimaryTitle(b);
  if (aChinese !== bChinese) {
    return aChinese ? 1 : -1;
  }
  const locale = aChinese ? LOCALE_ZH_PINYIN : LOCALE_EN;
  return a.trim().localeCompare(b.trim(), locale, {
    sensitivity: "base",
    numeric: true,
  });
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
    const cmp = compareVideoTitles(a.title, b.title);
    if (cmp !== 0) return cmp;
    return a.id.localeCompare(b.id);
  });
}
