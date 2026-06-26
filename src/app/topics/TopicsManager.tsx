"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExpressionRow } from "@/components/topics/ExpressionRow";
import { DismissReasonDialog } from "@/components/topics/DismissReasonDialog";
import { burstConfetti } from "@/components/topics/confetti";
import { findDropTarget, TopicDock } from "@/components/topics/TopicDock";
import { TopicTree } from "@/components/topics/TopicTree";
import type { Expression } from "@/types/expression";
import type { DismissReason } from "@/types/dismiss-reason";
import type { TopicTreeNode } from "@/types/topic";

type DockTopic = { id: string; name: string; slug: string };

type TopicsManagerProps = {
  initialTree: TopicTreeNode[];
  initialCounts: Record<string, number>;
  dockTopics: DockTopic[];
};

type DragState = {
  expression: Expression;
  x: number;
  y: number;
};

type PendingDismiss = {
  expressionId: string;
  phrase: string;
  viaTrash?: boolean;
  x?: number;
  y?: number;
};

export function TopicsManager({
  initialTree,
  initialCounts,
  dockTopics,
}: TopicsManagerProps) {
  const [tree, setTree] = useState(initialTree);
  const [counts, setCounts] = useState(initialCounts);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedTopicName, setSelectedTopicName] = useState("");
  const [expressions, setExpressions] = useState<Expression[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [loadingExpressions, setLoadingExpressions] = useState(false);
  const [message, setMessage] = useState("");
  const [childTopicName, setChildTopicName] = useState("");
  const [renameName, setRenameName] = useState("");
  const [mergeSourceId, setMergeSourceId] = useState("");
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [activeTarget, setActiveTarget] = useState<string | null>(null);
  const [trashActive, setTrashActive] = useState(false);
  const [trashHoverSince, setTrashHoverSince] = useState<number | null>(null);
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());
  const [celebratedDismiss, setCelebratedDismiss] = useState(false);
  const [pendingDismiss, setPendingDismiss] = useState<PendingDismiss | null>(
    null
  );
  const dragRef = useRef<DragState | null>(null);
  const trashHoverRef = useRef<number | null>(null);

  useEffect(() => {
    dragRef.current = dragState;
  }, [dragState]);

  const selectedTopic = useMemo(
    () => findTopicNode(tree, selectedTopicId),
    [tree, selectedTopicId]
  );

  const refreshTopics = useCallback(async () => {
    const response = await fetch("/api/topics");
    const data = (await response.json()) as {
      ok: boolean;
      tree?: TopicTreeNode[];
      counts?: Record<string, number>;
      message?: string;
    };
    if (!data.ok || !data.tree || !data.counts) {
      throw new Error(data.message ?? "Failed to refresh topics.");
    }
    setTree(data.tree);
    setCounts(data.counts);
  }, []);

  const loadExpressions = useCallback(async (topicId: string) => {
    setLoadingExpressions(true);
    try {
      const response = await fetch(`/api/topics/${topicId}/expressions`);
      const data = (await response.json()) as {
        ok: boolean;
        expressions?: Expression[];
        topic?: { name: string };
        message?: string;
      };
      if (!data.ok || !data.expressions) {
        throw new Error(data.message ?? "Failed to load expressions.");
      }
      setExpressions(data.expressions);
      setSelectedTopicName(data.topic?.name ?? "");
    } finally {
      setLoadingExpressions(false);
    }
  }, []);

  async function handleSelectTopic(topicId: string) {
    setSelectedTopicId(topicId);
    setMessage("");
    await loadExpressions(topicId);
  }

  function handleToggleTopic(topicId: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  }

  async function handleCreateChildTopic(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedTopicId || !childTopicName.trim()) {
      return;
    }

    const response = await fetch("/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentId: selectedTopicId,
        name: childTopicName.trim(),
      }),
    });
    const data = (await response.json()) as { ok: boolean; message?: string };
    if (!data.ok) {
      setMessage(data.message ?? "Failed to create topic.");
      return;
    }

    setChildTopicName("");
    await refreshTopics();
    setExpandedIds((current) => new Set(current).add(selectedTopicId));
    setMessage("Topic created.");
  }

  async function handleRenameTopic(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedTopicId || !renameName.trim() || selectedTopic?.is_system) {
      return;
    }

    const response = await fetch(`/api/topics/${selectedTopicId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameName.trim() }),
    });
    const data = (await response.json()) as { ok: boolean; message?: string };
    if (!data.ok) {
      setMessage(data.message ?? "Failed to rename topic.");
      return;
    }

    setRenameName("");
    await refreshTopics();
    setMessage("Topic renamed.");
  }

  async function handleDeleteTopic() {
    if (!selectedTopicId || selectedTopic?.is_system) {
      return;
    }

    const response = await fetch(`/api/topics/${selectedTopicId}`, {
      method: "DELETE",
    });
    const data = (await response.json()) as { ok: boolean; message?: string };
    if (!data.ok) {
      setMessage(data.message ?? "Failed to delete topic.");
      return;
    }

    setSelectedTopicId(null);
    setExpressions([]);
    await refreshTopics();
    setMessage("Topic deleted.");
  }

  async function handleMergeTopics(event: React.FormEvent) {
    event.preventDefault();
    if (!mergeSourceId || !mergeTargetId) {
      return;
    }

    const response = await fetch("/api/topics/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceId: mergeSourceId,
        targetId: mergeTargetId,
      }),
    });
    const data = (await response.json()) as {
      ok: boolean;
      movedCount?: number;
      message?: string;
    };
    if (!data.ok) {
      setMessage(data.message ?? "Failed to merge topics.");
      return;
    }

    setMergeSourceId("");
    setMergeTargetId("");
    await refreshTopics();
    if (selectedTopicId) {
      await loadExpressions(selectedTopicId);
    }
    setMessage(`Merged topics. Moved ${data.movedCount ?? 0} expression(s).`);
  }

  function requestDismiss(
    expressionId: string,
    viaTrash = false,
    x?: number,
    y?: number
  ) {
    const expression = expressions.find((item) => item.id === expressionId);
    if (!expression) {
      return;
    }
    setPendingDismiss({
      expressionId,
      phrase: expression.phrase,
      viaTrash,
      x,
      y,
    });
  }

  async function confirmDismiss(reason: DismissReason) {
    if (!pendingDismiss) {
      return;
    }

    const { expressionId, viaTrash, x, y } = pendingDismiss;
    setPendingDismiss(null);
    await dismissWithAnimation(expressionId, reason, viaTrash, x, y);
  }

  async function dismissWithAnimation(
    expressionId: string,
    reason: DismissReason,
    viaTrash = false,
    x?: number,
    y?: number
  ) {
    setFadingIds((current) => new Set(current).add(expressionId));
    await new Promise((resolve) => window.setTimeout(resolve, 180));

    const response = await fetch(`/api/expressions/${expressionId}/dismiss`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = (await response.json()) as { ok: boolean; message?: string };
    if (!data.ok) {
      setFadingIds((current) => {
        const next = new Set(current);
        next.delete(expressionId);
        return next;
      });
      setMessage(data.message ?? "Failed to dismiss expression.");
      return;
    }

    setExpressions((current) =>
      current.filter((item) => item.id !== expressionId)
    );
    setFadingIds((current) => {
      const next = new Set(current);
      next.delete(expressionId);
      return next;
    });

    if (selectedTopicId) {
      setCounts((current) => ({
        ...current,
        [selectedTopicId]: Math.max((current[selectedTopicId] ?? 1) - 1, 0),
      }));
    }

    if (viaTrash && !celebratedDismiss && x !== undefined && y !== undefined) {
      burstConfetti(x, y);
      setCelebratedDismiss(true);
    }

    setMessage("Expression dismissed.");
  }

  async function handleMoveExpression(expressionId: string, topicId: string) {
    const response = await fetch(`/api/expressions/${expressionId}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId }),
    });
    const data = (await response.json()) as { ok: boolean; message?: string };
    if (!data.ok) {
      setMessage(data.message ?? "Failed to move expression.");
      return;
    }

    if (selectedTopicId) {
      await loadExpressions(selectedTopicId);
    }
    await refreshTopics();
    setMessage("Expression moved.");
  }

  async function handleUnlockExpression(expressionId: string) {
    const response = await fetch(`/api/expressions/${expressionId}/unlock`, {
      method: "POST",
    });
    const data = (await response.json()) as {
      ok: boolean;
      expression?: Expression;
      message?: string;
    };
    if (!data.ok || !data.expression) {
      setMessage(data.message ?? "Failed to unlock expression.");
      return;
    }

    setExpressions((current) =>
      current.map((item) =>
        item.id === expressionId ? data.expression! : item
      )
    );
    setMessage("Expression unlocked.");
  }

  function handleDragStart(expression: Expression, x: number, y: number) {
    setDragState({ expression, x, y });
    trashHoverRef.current = null;
    setTrashHoverSince(null);
  }

  const dismissRef = useRef(requestDismiss);
  const moveRef = useRef(handleMoveExpression);
  dismissRef.current = requestDismiss;
  moveRef.current = handleMoveExpression;

  useEffect(() => {
    if (!dragState) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      setDragState((current) =>
        current
          ? { ...current, x: event.clientX, y: event.clientY }
          : current
      );

      const target = findDropTarget(event.clientX, event.clientY);
      if (target?.type === "topic") {
        setActiveTarget(target.topicId);
        setTrashActive(false);
        setTrashHoverSince(null);
      } else if (target?.type === "trash") {
        setActiveTarget(null);
        setTrashActive(true);
        if (trashHoverRef.current === null) {
          trashHoverRef.current = Date.now();
        }
        setTrashHoverSince(trashHoverRef.current);
      } else {
        setActiveTarget(null);
        setTrashActive(false);
        trashHoverRef.current = null;
        setTrashHoverSince(null);
      }
    }

    async function handlePointerUp(event: PointerEvent) {
      const currentDrag = dragRef.current;
      if (!currentDrag) {
        return;
      }

      const target = findDropTarget(event.clientX, event.clientY);
      setDragState(null);
      dragRef.current = null;
      setActiveTarget(null);
      setTrashActive(false);

      if (target?.type === "topic") {
        await moveRef.current(currentDrag.expression.id, target.topicId);
        trashHoverRef.current = null;
        setTrashHoverSince(null);
        return;
      }

      if (target?.type === "trash") {
        const hoveredMs = trashHoverRef.current
          ? Date.now() - trashHoverRef.current
          : 0;
        if (hoveredMs >= 450) {
          await dismissRef.current(
            currentDrag.expression.id,
            true,
            event.clientX,
            event.clientY
          );
        }
      }

      trashHoverRef.current = null;
      setTrashHoverSince(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [dragState]);

  useEffect(() => {
    if (selectedTopic) {
      setRenameName(selectedTopic.name);
    }
  }, [selectedTopic]);

  const flatTopics = useMemo(() => flattenTopics(tree), [tree]);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-medium text-[#222222]">Topic tree</h2>
        <div className="mt-3">
          <TopicTree
            tree={tree}
            counts={counts}
            selectedId={selectedTopicId}
            expandedIds={expandedIds}
            onSelect={handleSelectTopic}
            onToggle={handleToggleTopic}
          />
        </div>
      </section>

      {selectedTopic && (
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-medium text-[#222222]">
              {selectedTopicName || selectedTopic.name}
            </h2>
            <p className="mt-1 text-xs text-[#222222] opacity-70">
              Expressions assigned directly to this topic
            </p>
          </div>

          {!selectedTopic.is_system && (
            <form onSubmit={handleRenameTopic} className="flex gap-2">
              <input
                value={renameName}
                onChange={(event) => setRenameName(event.target.value)}
                className="flex-1 rounded border border-[#222222]/20 px-3 py-2 text-sm"
                placeholder="Rename topic"
              />
              <button
                type="submit"
                className="rounded border border-[#222222] px-3 py-2 text-sm"
              >
                Rename
              </button>
            </form>
          )}

          {!selectedTopic.is_system && (
            <button
              type="button"
              onClick={handleDeleteTopic}
              className="text-xs text-[#222222] underline opacity-80"
            >
              Delete empty topic
            </button>
          )}

          <form onSubmit={handleCreateChildTopic} className="flex gap-2">
            <input
              value={childTopicName}
              onChange={(event) => setChildTopicName(event.target.value)}
              className="flex-1 rounded border border-[#222222]/20 px-3 py-2 text-sm"
              placeholder="New child topic name"
            />
            <button
              type="submit"
              className="rounded border border-[#222222] px-3 py-2 text-sm"
            >
              Add
            </button>
          </form>

          <form onSubmit={handleMergeTopics} className="space-y-2 rounded border border-[#222222]/15 p-3">
            <p className="text-xs text-[#222222] opacity-80">Merge leaf topics</p>
            <select
              value={mergeSourceId}
              onChange={(event) => setMergeSourceId(event.target.value)}
              className="w-full rounded border border-[#222222]/20 px-3 py-2 text-sm"
            >
              <option value="">Merge from</option>
              {flatTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
            <select
              value={mergeTargetId}
              onChange={(event) => setMergeTargetId(event.target.value)}
              className="w-full rounded border border-[#222222]/20 px-3 py-2 text-sm"
            >
              <option value="">Merge into</option>
              {flatTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="w-full rounded border border-[#222222] px-3 py-2 text-sm"
            >
              Merge
            </button>
          </form>

          <div className="space-y-3">
            {loadingExpressions && (
              <p className="text-sm text-[#222222] opacity-70">Loading…</p>
            )}
            {!loadingExpressions && expressions.length === 0 && (
              <p className="text-sm text-[#222222] opacity-70">
                No expressions in this topic.
              </p>
            )}
            {expressions.map((expression) => (
              <ExpressionRow
                key={expression.id}
                expression={expression}
                fadingOut={fadingIds.has(expression.id)}
                onDismiss={(id) => requestDismiss(id)}
                onUnlock={handleUnlockExpression}
                onDragStart={handleDragStart}
                moveTopicOptions={dockTopics}
                onMove={handleMoveExpression}
              />
            ))}
          </div>
        </section>
      )}

      {message && (
        <p className="text-sm text-[#222222] opacity-80" role="status">
          {message}
        </p>
      )}

      <TopicDock
        topics={dockTopics}
        activeTarget={activeTarget}
        trashActive={trashActive}
      />

      {dragState && (
        <div
          className="pointer-events-none fixed z-50 max-w-[220px] rounded border border-[#222222] bg-[#FFFFFF] p-3 text-sm shadow-sm"
          style={{
            left: dragState.x + 12,
            top: dragState.y + 12,
          }}
        >
          {dragState.expression.phrase}
        </div>
      )}

      <DismissReasonDialog
        open={pendingDismiss !== null}
        phrase={pendingDismiss?.phrase ?? ""}
        onCancel={() => setPendingDismiss(null)}
        onConfirm={confirmDismiss}
      />
    </div>
  );
}

function findTopicNode(
  tree: TopicTreeNode[],
  topicId: string | null
): TopicTreeNode | null {
  if (!topicId) {
    return null;
  }

  for (const node of tree) {
    if (node.id === topicId) {
      return node;
    }
    const child = findTopicNode(node.children, topicId);
    if (child) {
      return child;
    }
  }
  return null;
}

function flattenTopics(tree: TopicTreeNode[]): TopicTreeNode[] {
  const result: TopicTreeNode[] = [];
  for (const node of tree) {
    result.push(node);
    result.push(...flattenTopics(node.children));
  }
  return result;
}
