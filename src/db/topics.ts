import { slugifyName, uniqueTopicSlug } from "@/lib/slugify";
import { getSupabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Topic, TopicIndexEntry, TopicTreeNode } from "@/types/topic";

export async function listTopics(client?: SupabaseClient): Promise<Topic[]> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .order("slug");
  if (error) throw error;
  return (data ?? []) as Topic[];
}

export async function getTopicBySlug(
  slug: string,
  client?: SupabaseClient
): Promise<Topic | null> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as Topic | null) ?? null;
}

export function buildTopicIndex(topics: Topic[]): Map<string, TopicIndexEntry> {
  const childCounts = new Map<string, number>();
  for (const topic of topics) {
    if (topic.parent_id) {
      childCounts.set(
        topic.parent_id,
        (childCounts.get(topic.parent_id) ?? 0) + 1
      );
    }
  }

  const index = new Map<string, TopicIndexEntry>();
  for (const topic of topics) {
    index.set(topic.slug, {
      id: topic.id,
      slug: topic.slug,
      parent_id: topic.parent_id,
      childCount: childCounts.get(topic.id) ?? 0,
    });
  }
  return index;
}

export function listTopicSubtreeIds(
  topicId: string,
  topics: Topic[]
): string[] {
  const childrenByParent = new Map<string, string[]>();
  for (const topic of topics) {
    if (!topic.parent_id) continue;
    const siblings = childrenByParent.get(topic.parent_id) ?? [];
    siblings.push(topic.id);
    childrenByParent.set(topic.parent_id, siblings);
  }

  const result: string[] = [];
  const queue = [topicId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);
    const children = childrenByParent.get(current) ?? [];
    queue.push(...children);
  }
  return result;
}

export function listTopicTree(topics: Topic[]): TopicTreeNode[] {
  const nodes = new Map<string, TopicTreeNode>();
  for (const topic of topics) {
    nodes.set(topic.id, { ...topic, children: [] });
  }

  const roots: TopicTreeNode[] = [];
  for (const node of nodes.values()) {
    if (node.parent_id) {
      const parent = nodes.get(node.parent_id);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (items: TopicTreeNode[]): TopicTreeNode[] =>
    items
      .map((item) => ({ ...item, children: sortNodes(item.children) }))
      .sort((a, b) => a.slug.localeCompare(b.slug));

  return sortNodes(roots);
}

export async function getTopic(
  id: string,
  client?: SupabaseClient
): Promise<Topic | null> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Topic | null) ?? null;
}

export function listLeafTopics(topics: Topic[]): Topic[] {
  const childCounts = buildTopicIndex(topics);
  return topics.filter((topic) => {
    const entry = childCounts.get(topic.slug);
    return (entry?.childCount ?? 0) === 0;
  });
}

export async function getTopicExpressionCounts(
  client?: SupabaseClient
): Promise<Map<string, number>> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase.from("expressions").select("topic_id");
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const topicId = row.topic_id as string;
    counts.set(topicId, (counts.get(topicId) ?? 0) + 1);
  }
  return counts;
}

export async function createUserTopic(
  parentId: string,
  name: string,
  client?: SupabaseClient
): Promise<Topic> {
  const supabase = client ?? getSupabase();
  const parent = await getTopic(parentId, supabase);
  if (!parent) {
    throw new Error("Parent topic not found.");
  }

  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Topic name is required.");
  }

  const baseSlug = slugifyName(trimmed);
  if (!baseSlug) {
    throw new Error("Topic name must contain letters or numbers.");
  }

  const slug = await uniqueTopicSlug(baseSlug, async (candidate) => {
    const existing = await getTopicBySlug(candidate, supabase);
    return existing !== null;
  });

  const { data, error } = await supabase
    .from("topics")
    .insert({
      name: trimmed,
      slug,
      parent_id: parentId,
      is_system: false,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Topic;
}

export async function renameUserTopic(
  topicId: string,
  name: string,
  client?: SupabaseClient
): Promise<Topic> {
  const supabase = client ?? getSupabase();
  const topic = await getTopic(topicId, supabase);
  if (!topic) {
    throw new Error("Topic not found.");
  }
  if (topic.is_system) {
    throw new Error("System topics cannot be renamed.");
  }

  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Topic name is required.");
  }

  const baseSlug = slugifyName(trimmed);
  if (!baseSlug) {
    throw new Error("Topic name must contain letters or numbers.");
  }

  const slug = await uniqueTopicSlug(baseSlug, async (candidate) => {
    if (candidate === topic.slug) {
      return false;
    }
    const existing = await getTopicBySlug(candidate, supabase);
    return existing !== null;
  });

  const { data, error } = await supabase
    .from("topics")
    .update({ name: trimmed, slug })
    .eq("id", topicId)
    .select()
    .single();
  if (error) throw error;
  return data as Topic;
}

export async function deleteUserTopic(
  topicId: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = client ?? getSupabase();
  const topic = await getTopic(topicId, supabase);
  if (!topic) {
    throw new Error("Topic not found.");
  }
  if (topic.is_system) {
    throw new Error("System topics cannot be deleted.");
  }

  const topics = await listTopics(supabase);
  const hasChildren = topics.some((item) => item.parent_id === topicId);
  if (hasChildren) {
    throw new Error("Delete child topics before removing this topic.");
  }

  const counts = await getTopicExpressionCounts(supabase);
  if ((counts.get(topicId) ?? 0) > 0) {
    throw new Error("Cannot delete a topic that still has expressions.");
  }

  const { error } = await supabase.from("topics").delete().eq("id", topicId);
  if (error) throw error;
}

export async function mergeTopics(
  sourceId: string,
  targetId: string,
  client?: SupabaseClient
): Promise<{ movedCount: number }> {
  const supabase = client ?? getSupabase();
  if (sourceId === targetId) {
    throw new Error("Source and target topics must differ.");
  }

  const source = await getTopic(sourceId, supabase);
  const target = await getTopic(targetId, supabase);
  if (!source || !target) {
    throw new Error("Source or target topic not found.");
  }

  const topics = await listTopics(supabase);
  const hasChildren = topics.some((item) => item.parent_id === sourceId);
  if (hasChildren) {
    throw new Error("Cannot merge a topic that has child topics.");
  }

  const { data: expressions, error: listError } = await supabase
    .from("expressions")
    .select("id")
    .eq("topic_id", sourceId);
  if (listError) throw listError;

  const movedCount = expressions?.length ?? 0;
  if (movedCount > 0) {
    const { error: updateError } = await supabase
      .from("expressions")
      .update({ topic_id: targetId, topic_locked: true })
      .eq("topic_id", sourceId);
    if (updateError) throw updateError;
  }

  const { error: mergeError } = await supabase
    .from("topics")
    .update({ merged_into_id: targetId })
    .eq("id", sourceId);
  if (mergeError) throw mergeError;

  const { error: deleteError } = await supabase
    .from("topics")
    .delete()
    .eq("id", sourceId);
  if (deleteError) throw deleteError;

  return { movedCount };
}
