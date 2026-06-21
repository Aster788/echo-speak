"use client";

import type { TopicTreeNode } from "@/types/topic";

type TopicTreeProps = {
  tree: TopicTreeNode[];
  counts: Record<string, number>;
  selectedId: string | null;
  expandedIds: Set<string>;
  onSelect: (topicId: string) => void;
  onToggle: (topicId: string) => void;
};

function TopicTreeNodeItem({
  node,
  depth,
  counts,
  selectedId,
  expandedIds,
  onSelect,
  onToggle,
}: {
  node: TopicTreeNode;
  depth: number;
  counts: Record<string, number>;
  selectedId: string | null;
  expandedIds: Set<string>;
  onSelect: (topicId: string) => void;
  onToggle: (topicId: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const expanded = expandedIds.has(node.id);
  const count = counts[node.id] ?? 0;
  const selected = selectedId === node.id;

  return (
    <li>
      <div
        className="flex items-center gap-1"
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={expanded ? "Collapse" : "Expand"}
            onClick={() => onToggle(node.id)}
            className="w-5 text-xs text-[#222222] opacity-70"
          >
            {expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className={`flex-1 rounded px-2 py-1.5 text-left text-sm transition-opacity duration-150 ${
            selected
              ? "bg-[#222222] text-[#FFFFFF]"
              : "text-[#222222] hover:opacity-80"
          }`}
        >
          <span>{node.name}</span>
          <span className="ml-2 text-xs opacity-70">({count})</span>
        </button>
      </div>
      {hasChildren && expanded && (
        <ul>
          {node.children.map((child) => (
            <TopicTreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              counts={counts}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function TopicTree({
  tree,
  counts,
  selectedId,
  expandedIds,
  onSelect,
  onToggle,
}: TopicTreeProps) {
  return (
    <ul className="space-y-1">
      {tree.map((node) => (
        <TopicTreeNodeItem
          key={node.id}
          node={node}
          depth={0}
          counts={counts}
          selectedId={selectedId}
          expandedIds={expandedIds}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ))}
    </ul>
  );
}
