export interface Topic {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  is_system: boolean;
  merged_into_id: string | null;
  created_at: string;
}

export interface TopicTreeNode extends Topic {
  children: TopicTreeNode[];
}

export type TopicIndexEntry = {
  id: string;
  slug: string;
  parent_id: string | null;
  childCount: number;
};
