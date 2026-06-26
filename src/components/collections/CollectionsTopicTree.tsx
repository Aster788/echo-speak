"use client";

import Image from "next/image";
import { pageHintFont } from "@/lib/page-hint-font";
import type { TopicTreeNode } from "@/types/topic";

type CollectionsTopicTreeProps = {
  tree: TopicTreeNode[];
  counts: Record<string, number>;
  expandedIds: Set<string>;
  activeRowId: string | null;
  onToggle: (topicId: string) => void;
  onSelect: (topicId: string) => void;
  onMove: (topicId: string) => void;
  onDelete: (topicId: string) => void;
};

function TopicRow({
  node,
  depth,
  counts,
  expandedIds,
  activeRowId,
  onToggle,
  onSelect,
  onMove,
  onDelete,
}: {
  node: TopicTreeNode;
  depth: number;
  counts: Record<string, number>;
  expandedIds: Set<string>;
  activeRowId: string | null;
  onToggle: (topicId: string) => void;
  onSelect: (topicId: string) => void;
  onMove: (topicId: string) => void;
  onDelete: (topicId: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const expanded = expandedIds.has(node.id);
  const count = counts[node.id] ?? 0;
  const active = activeRowId === node.id;
  const showTargetIcon = depth > 0 && !hasChildren;

  return (
    <li>
      <div
        className={`flex items-center gap-2 py-1 transition-shadow duration-150 ${
          active ? "shadow-[0_4px_12px_rgba(34,34,34,0.12)]" : ""
        }`}
        style={{ paddingLeft: `${depth * 22}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={expanded ? "Collapse topic" : "Expand topic"}
            onClick={(event) => {
              event.stopPropagation();
              onToggle(node.id);
            }}
            className="flex w-6 shrink-0 justify-center p-0.5 transition-transform duration-200"
            style={{ transform: expanded ? "rotate(270deg)" : "rotate(180deg)" }}
          >
            <Image
              src="/collections/arrow.png"
              alt=""
              width={20}
              height={20}
              aria-hidden="true"
            />
          </button>
        ) : showTargetIcon ? (
          <span className="flex w-6 shrink-0 justify-center">
            <Image
              src="/collections/target.png"
              alt=""
              width={18}
              height={18}
              aria-hidden="true"
            />
          </span>
        ) : (
          <span className="w-6 shrink-0" aria-hidden="true" />
        )}
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className={`min-w-0 flex-1 rounded-full bg-[#DED8C8] px-3 py-1.5 text-left text-sm leading-none text-[#2a1f14]/95 transition-opacity duration-150 active:opacity-80 ${pageHintFont.className}`}
        >
          <span>{node.name}</span>
          <span className="ml-1.5 text-xs opacity-70">({count})</span>
        </button>
        <div className="flex shrink-0 items-center gap-1 pl-0.5">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onMove(node.id);
            }}
            className="p-0.5 transition-opacity duration-150 active:opacity-70"
            aria-label={`Move ${node.name}`}
          >
            <Image
              src="/collections/move.png"
              alt=""
              width={18}
              height={18}
              className="h-[18px] w-[18px] object-contain"
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(node.id);
            }}
            className="p-0.5 transition-opacity duration-150 active:opacity-70"
            aria-label={`Delete ${node.name}`}
          >
            <Image
              src="/collections/bin.png"
              alt=""
              width={18}
              height={18}
              className="h-[18px] w-[18px] object-contain"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
      {hasChildren && expanded && (
        <ul>
          {node.children.map((child) => (
            <TopicRow
              key={child.id}
              node={child}
              depth={depth + 1}
              counts={counts}
              expandedIds={expandedIds}
              activeRowId={activeRowId}
              onToggle={onToggle}
              onSelect={onSelect}
              onMove={onMove}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CollectionsTopicTree({
  tree,
  counts,
  expandedIds,
  activeRowId,
  onToggle,
  onSelect,
  onMove,
  onDelete,
}: CollectionsTopicTreeProps) {
  return (
    <ul className="space-y-0.5">
      {tree.map((node) => (
        <TopicRow
          key={node.id}
          node={node}
          depth={0}
          counts={counts}
          expandedIds={expandedIds}
          activeRowId={activeRowId}
          onToggle={onToggle}
          onSelect={onSelect}
          onMove={onMove}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
