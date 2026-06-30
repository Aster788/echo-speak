"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CollectionsBackHeader } from "@/components/collections/CollectionsBackHeader";
import { CollectionsTopicTree } from "@/components/collections/CollectionsTopicTree";
import { ExpressionListWithAlphabet } from "@/components/collections/ExpressionListWithAlphabet";
import { MoveSheet } from "@/components/collections/MoveSheet";
import { DismissReasonSheet } from "@/components/collections/DismissReasonSheet";
import { MergeExpressionSheet } from "@/components/collections/MergeExpressionSheet";
import { SuccessToast } from "@/components/collections/SuccessToast";
import {
  ViewTabs,
  type CollectionsViewTab,
} from "@/components/collections/ViewTabs";
import { pageHintFont } from "@/lib/page-hint-font";
import { sortTopicsByName } from "@/lib/sort-collections";
import type { Expression } from "@/types/expression";
import type { TopicTreeNode } from "@/types/topic";
import type { DismissReason } from "@/types/dismiss-reason";

const VIEW_TAB_KEY = "collections-view-tab";
const EXPANDED_KEY = "collections-topic-expanded";
const STICKY_NOTE_BG = "url(/review/sticky-note.png)";
const STICKY_NOTE_TILTS = [-0.65, 0.55, -0.45, 0.7] as const;

type VideoListItem = {
  id: string;
  title: string;
  expressionCount: number;
};

type MoveTarget =
  | { kind: "expression"; id: string }
  | { kind: "topic"; id: string };

type CollectionsManagerProps = {
  initialTree: TopicTreeNode[];
  initialCounts: Record<string, number>;
};

function flattenTree(tree: TopicTreeNode[]): TopicTreeNode[] {
  const result: TopicTreeNode[] = [];
  for (const node of tree) {
    result.push(node);
    result.push(...flattenTree(node.children));
  }
  return result;
}

function collectParentIds(tree: TopicTreeNode[]): string[] {
  const ids: string[] = [];
  for (const node of tree) {
    if (node.children.length > 0) {
      ids.push(node.id);
      ids.push(...collectParentIds(node.children));
    }
  }
  return ids;
}

function readExpandedIds(tree: TopicTreeNode[]): Set<string> {
  if (typeof window === "undefined") {
    return new Set(collectParentIds(tree));
  }

  try {
    const raw = window.localStorage.getItem(EXPANDED_KEY);
    if (!raw) {
      return new Set(collectParentIds(tree));
    }
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set(collectParentIds(tree));
  }
}

function readViewTab(): CollectionsViewTab {
  if (typeof window === "undefined") {
    return "topic";
  }
  const stored = window.localStorage.getItem(VIEW_TAB_KEY);
  if (stored === "video" || stored === "all" || stored === "topic") {
    return stored;
  }
  return "topic";
}

function stickyNoteTilt(index: number) {
  return STICKY_NOTE_TILTS[index % STICKY_NOTE_TILTS.length];
}

export function CollectionsManager({
  initialTree,
  initialCounts,
}: CollectionsManagerProps) {
  const [viewTab, setViewTab] = useState<CollectionsViewTab>("topic");
  const [tree, setTree] = useState(initialTree);
  const [counts, setCounts] = useState(initialCounts);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [topicLevel, setTopicLevel] = useState<"l1" | "l2">("l1");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedTopicName, setSelectedTopicName] = useState("");
  const [topicExpressions, setTopicExpressions] = useState<Expression[]>([]);
  const [videoLevel, setVideoLevel] = useState<"l1" | "l2">("l1");
  const [videos, setVideos] = useState<VideoListItem[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedVideoTitle, setSelectedVideoTitle] = useState("");
  const [videoExpressions, setVideoExpressions] = useState<Expression[]>([]);
  const [allExpressions, setAllExpressions] = useState<Expression[]>([]);
  const [allVideoCount, setAllVideoCount] = useState(0);
  const [allExpressionCount, setAllExpressionCount] = useState(0);
  const [newTopicName, setNewTopicName] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [moveTarget, setMoveTarget] = useState<MoveTarget | null>(null);
  const [moveTopicId, setMoveTopicId] = useState("");
  const [moveBusy, setMoveBusy] = useState(false);
  const [dismissTarget, setDismissTarget] = useState<{
    id: string;
    phrase: string;
  } | null>(null);
  const [dismissReason, setDismissReason] = useState<DismissReason | null>(null);
  const [dismissBusy, setDismissBusy] = useState(false);
  const [mergeSource, setMergeSource] = useState<{
    id: string;
    phrase: string;
  } | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [mergeBusy, setMergeBusy] = useState(false);
  const [reextractBusy, setReextractBusy] = useState(false);
  const [reextractConfirmOpen, setReextractConfirmOpen] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setViewTab(readViewTab());
    setExpandedIds(readExpandedIds(initialTree));
  }, [initialTree]);

  useEffect(() => {
    window.localStorage.setItem(VIEW_TAB_KEY, viewTab);
  }, [viewTab]);

  useEffect(() => {
    window.localStorage.setItem(
      EXPANDED_KEY,
      JSON.stringify(Array.from(expandedIds))
    );
  }, [expandedIds]);

  const flatTopics = useMemo(() => sortTopicsByName(flattenTree(tree)), [tree]);

  const moveTopicOptions = useMemo(() => {
    if (!moveTarget || moveTarget.kind !== "topic") {
      return flatTopics.map((topic) => ({ id: topic.id, name: topic.name }));
    }

    const blocked = new Set(
      collectSubtreeIds(
        tree,
        moveTarget.id
      )
    );
    return flatTopics
      .filter((topic) => !blocked.has(topic.id))
      .map((topic) => ({ id: topic.id, name: topic.name }));
  }, [flatTopics, moveTarget, tree]);

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

  const loadVideos = useCallback(async () => {
    const response = await fetch("/api/videos");
    const data = (await response.json()) as {
      ok: boolean;
      videos?: VideoListItem[];
      message?: string;
    };
    if (!data.ok || !data.videos) {
      throw new Error(data.message ?? "Failed to load videos.");
    }
    setVideos(data.videos);
  }, []);

  const loadAllExpressions = useCallback(async () => {
    const response = await fetch("/api/expressions");
    const data = (await response.json()) as {
      ok: boolean;
      expressions?: Expression[];
      videoCount?: number;
      expressionCount?: number;
      message?: string;
    };
    if (!data.ok || !data.expressions) {
      throw new Error(data.message ?? "Failed to load expressions.");
    }
    setAllExpressions(data.expressions);
    setAllVideoCount(data.videoCount ?? 0);
    setAllExpressionCount(data.expressionCount ?? data.expressions.length);
  }, []);

  const loadTopicExpressions = useCallback(async (topicId: string) => {
    setLoading(true);
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
      setTopicExpressions(data.expressions);
      setSelectedTopicName(data.topic?.name ?? "");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadVideoExpressions = useCallback(async (videoId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/videos/${videoId}/expressions`);
      const data = (await response.json()) as {
        ok: boolean;
        expressions?: Expression[];
        video?: { title: string };
        message?: string;
      };
      if (!data.ok || !data.expressions) {
        throw new Error(data.message ?? "Failed to load expressions.");
      }
      setVideoExpressions(data.expressions);
      setSelectedVideoTitle(data.video?.title ?? "");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewTab === "video" && videoLevel === "l1") {
      void loadVideos().catch((error: Error) => setMessage(error.message));
    }
    if (viewTab === "all") {
      void loadAllExpressions().catch((error: Error) => setMessage(error.message));
    }
  }, [viewTab, videoLevel, loadVideos, loadAllExpressions]);

  function showSuccess(text: string) {
    setMessage("");
    setToastMessage(text);
    setSuccessVisible(true);
    window.setTimeout(() => {
      setSuccessVisible(false);
      setToastMessage("");
    }, 1100);
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

  async function handleSelectTopic(topicId: string) {
    setActiveRowId(topicId);
    await new Promise((resolve) => window.setTimeout(resolve, 140));
    setSelectedTopicId(topicId);
    setTopicLevel("l2");
    setActiveRowId(null);
    await loadTopicExpressions(topicId);
  }

  async function handleCreateTopic(event: React.FormEvent) {
    event.preventDefault();
    if (!newTopicName.trim()) {
      return;
    }

    const response = await fetch("/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTopicName.trim() }),
    });
    const data = (await response.json()) as { ok: boolean; message?: string };
    if (!data.ok) {
      setMessage(data.message ?? "Failed to create topic.");
      return;
    }

    setNewTopicName("");
    await refreshTopics();
    showSuccess("Topic created.");
  }

  async function handleDeleteTopic(topicId: string) {
    const response = await fetch(`/api/topics/${topicId}`, {
      method: "DELETE",
    });
    const data = (await response.json()) as { ok: boolean; message?: string };
    if (!data.ok) {
      setMessage(data.message ?? "Failed to delete topic.");
      return;
    }

    if (selectedTopicId === topicId) {
      setSelectedTopicId(null);
      setTopicLevel("l1");
      setTopicExpressions([]);
    }
    await refreshTopics();
    showSuccess("Topic deleted.");
  }

  function openDismiss(expressionId: string, phrase: string) {
    setDismissTarget({ id: expressionId, phrase });
    setDismissReason(null);
  }

  async function dismissExpression(expressionId: string, reason: DismissReason) {
    setDismissBusy(true);
    const previousTopicExpressions = topicExpressions;
    const previousVideoExpressions = videoExpressions;
    const previousAllExpressions = allExpressions;

    setTopicExpressions((current) =>
      current.filter((item) => item.id !== expressionId)
    );
    setVideoExpressions((current) =>
      current.filter((item) => item.id !== expressionId)
    );
    setAllExpressions((current) =>
      current.filter((item) => item.id !== expressionId)
    );
    setAllExpressionCount((count) => Math.max(0, count - 1));

    try {
      const response = await fetch(`/api/expressions/${expressionId}/dismiss`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setTopicExpressions(previousTopicExpressions);
        setVideoExpressions(previousVideoExpressions);
        setAllExpressions(previousAllExpressions);
        setAllExpressionCount(previousAllExpressions.length);
        setMessage(data.message ?? "Failed to dismiss expression.");
        return;
      }

      setDismissTarget(null);
      setDismissReason(null);
      await refreshTopics();
      if (viewTab === "video" && videoLevel === "l1") {
        await loadVideos();
      }
    } catch {
      setTopicExpressions(previousTopicExpressions);
      setVideoExpressions(previousVideoExpressions);
      setAllExpressions(previousAllExpressions);
      setAllExpressionCount(previousAllExpressions.length);
      setMessage("Failed to dismiss expression.");
    } finally {
      setDismissBusy(false);
    }
  }

  function openMoveExpression(expressionId: string) {
    setMoveTopicId("");
    setMoveTarget({ kind: "expression", id: expressionId });
  }

  function openMergeExpression(expressionId: string, phrase: string) {
    setMergeSource({ id: expressionId, phrase });
    setMergeTargetId("");
  }

  async function confirmMergeExpression() {
    if (!mergeSource || !mergeTargetId) return;
    setMergeBusy(true);
    const previousTopicExpressions = topicExpressions;
    const previousAllExpressions = allExpressions;
    // Optimistically remove the source row (it will be deleted by the merge).
    const removeSource = (list: Expression[]) =>
      list.filter((item) => item.id !== mergeSource.id);
    setTopicExpressions(removeSource);
    setAllExpressions(removeSource);
    setAllExpressionCount((count) => Math.max(0, count - 1));

    try {
      const response = await fetch(
        `/api/expressions/${mergeSource.id}/merge`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetId: mergeTargetId }),
        }
      );
      const data = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setTopicExpressions(previousTopicExpressions);
        setAllExpressions(previousAllExpressions);
        setAllExpressionCount(previousAllExpressions.length);
        setMessage(data.message ?? "Failed to merge expressions.");
        return;
      }
      setMergeSource(null);
      setMergeTargetId("");
      showSuccess("Merged successfully.");
      await refreshTopics();
      if (viewTab === "all") {
        await loadAllExpressions();
      } else if (viewTab === "topic" && selectedTopicId) {
        await loadTopicExpressions(selectedTopicId);
      }
    } catch {
      setTopicExpressions(previousTopicExpressions);
      setAllExpressions(previousAllExpressions);
      setAllExpressionCount(previousAllExpressions.length);
      setMessage("Failed to merge expressions.");
    } finally {
      setMergeBusy(false);
    }
  }

  function openMoveTopic(topicId: string) {
    setMoveTopicId("");
    setMoveTarget({ kind: "topic", id: topicId });
  }

  async function handleReextract() {
    if (!selectedVideoId) return;
    setReextractConfirmOpen(false);
    setReextractBusy(true);
    try {
      const response = await fetch(
        `/api/videos/${selectedVideoId}/reextract`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        expressionCount?: number;
      };
      if (!response.ok || !data.ok) {
        setMessage(data.message ?? "Failed to re-extract expressions.");
        return;
      }
      await loadVideoExpressions(selectedVideoId);
      showSuccess(`Re-extracted ${data.expressionCount ?? 0} expressions.`);
    } catch {
      setMessage("Failed to re-extract expressions.");
    } finally {
      setReextractBusy(false);
    }
  }

  async function confirmMove() {
    if (!moveTarget || !moveTopicId) {
      return;
    }

    setMoveBusy(true);
    try {
      if (moveTarget.kind === "expression") {
        const response = await fetch(
          `/api/expressions/${moveTarget.id}/move`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topicId: moveTopicId }),
          }
        );
        const data = (await response.json()) as {
          ok: boolean;
          message?: string;
        };
        if (!data.ok) {
          setMessage(data.message ?? "Failed to move expression.");
          return;
        }

        if (selectedTopicId) {
          await loadTopicExpressions(selectedTopicId);
        }
        if (viewTab === "all") {
          await loadAllExpressions();
        }
      } else {
        const response = await fetch(`/api/topics/${moveTarget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentId: moveTopicId === "__root__" ? null : moveTopicId,
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          message?: string;
        };
        if (!data.ok) {
          setMessage(data.message ?? "Failed to move topic.");
          return;
        }
        await refreshTopics();
      }

      setMoveTarget(null);
      showSuccess("Moved successfully.");
    } finally {
      setMoveBusy(false);
    }
  }

  function handleViewTabChange(tab: CollectionsViewTab) {
    setViewTab(tab);
    setTopicLevel("l1");
    setVideoLevel("l1");
    setSelectedTopicId(null);
    setSelectedVideoId(null);
    setMessage("");
  }

  function handleBackFromTopicL2() {
    setTopicLevel("l1");
    setSelectedTopicId(null);
    setTopicExpressions([]);
  }

  function handleBackFromVideoL2() {
    setVideoLevel("l1");
    setSelectedVideoId(null);
    setVideoExpressions([]);
  }

  function handleBackFromAll() {
    handleViewTabChange("topic");
  }

  async function handleSelectVideo(video: VideoListItem) {
    setSelectedVideoId(video.id);
    setSelectedVideoTitle(video.title);
    setVideoLevel("l2");
    await loadVideoExpressions(video.id);
  }

  return (
    <div className="space-y-4">
      <ViewTabs active={viewTab} onChange={handleViewTabChange} />

      {viewTab === "topic" && topicLevel === "l1" && (
        <section className="space-y-3">
          <form onSubmit={handleCreateTopic} className="flex gap-2 px-2">
            <input
              value={newTopicName}
              onChange={(event) => setNewTopicName(event.target.value)}
              placeholder="New topic name"
              className="h-8 min-w-0 flex-1 rounded border border-[#222222]/15 bg-[#FFFFFF] px-3 text-[0.875rem] text-[#222222] outline-none placeholder:text-[#222222]/35"
            />
            <button
              type="submit"
              className="h-8 shrink-0 rounded border border-[#222222]/30 bg-[#FFFFFF] px-3 text-[0.875rem] text-[#222222] transition-opacity duration-150 active:opacity-70"
            >
              Add
            </button>
          </form>
          <CollectionsTopicTree
            tree={tree}
            counts={counts}
            expandedIds={expandedIds}
            activeRowId={activeRowId}
            onToggle={handleToggleTopic}
            onSelect={handleSelectTopic}
            onMove={openMoveTopic}
            onDelete={handleDeleteTopic}
          />
        </section>
      )}

      {viewTab === "topic" && topicLevel === "l2" && (
        <section className="space-y-4">
          <CollectionsBackHeader
            title={
              <p className="collections-title-scroll min-w-0 overflow-x-auto whitespace-nowrap text-[0.9375rem] font-medium italic leading-snug">
                {selectedTopicName}
              </p>
            }
            onBack={handleBackFromTopicL2}
          />
          {loading && (
            <p className="text-sm text-[#222222] opacity-70">Loading…</p>
          )}
          {!loading && topicExpressions.length === 0 && (
            <p className="text-sm text-[#222222] opacity-70">
              No expressions in this topic.
            </p>
          )}
          <ExpressionListWithAlphabet
            expressions={topicExpressions}
            scopeId="topic-expressions"
            onMove={openMoveExpression}
            onMerge={(expressionId) => {
              const expr = topicExpressions.find((e) => e.id === expressionId);
              openMergeExpression(expressionId, expr?.phrase ?? "");
            }}
            onDelete={(expressionId) => {
              const expr =
                topicExpressions.find((e) => e.id === expressionId) ??
                videoExpressions.find((e) => e.id === expressionId) ??
                allExpressions.find((e) => e.id === expressionId);
              openDismiss(expressionId, expr?.phrase ?? "");
            }}
          />
        </section>
      )}

      {viewTab === "video" && videoLevel === "l1" && (
        <section className="space-y-2.5">
          {videos.length === 0 && (
            <p className="text-sm text-[#222222] opacity-70">No videos yet.</p>
          )}
          <ul className="space-y-2.5">
            {videos.map((video, index) => (
              <li key={video.id} className="px-0.5 py-0.5">
                <button
                  type="button"
                  onClick={() => void handleSelectVideo(video)}
                  className={`relative flex h-[52px] w-full items-center justify-between border-0 bg-transparent bg-[length:100%_100%] bg-center bg-no-repeat px-7 py-2 text-left transition-opacity duration-150 active:opacity-80 ${pageHintFont.className}`}
                  style={{
                    backgroundImage: STICKY_NOTE_BG,
                    transform: `rotate(${stickyNoteTilt(index)}deg)`,
                  }}
                >
                  <span className="collections-title-scroll relative z-10 min-w-0 flex-1 overflow-x-auto whitespace-nowrap pr-4 text-sm italic leading-snug text-[#2a1f14]/95">
                    {video.title}
                  </span>
                  <span className="relative z-10 ml-3 shrink-0 text-xs italic tabular-nums text-[#2a1f14]/70">
                    {video.expressionCount}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {viewTab === "video" && videoLevel === "l2" && (
        <section className="space-y-4">
          <CollectionsBackHeader
            title={
              <p className="collections-title-scroll min-w-0 overflow-x-auto whitespace-nowrap text-[0.9375rem] italic leading-snug">
                {selectedVideoTitle}
              </p>
            }
            onBack={handleBackFromVideoL2}
            center={
              <button
                type="button"
                onClick={() => setReextractConfirmOpen(true)}
                disabled={reextractBusy}
                className="rounded-full border border-[#222222]/20 px-3 py-1 text-[0.75rem] leading-none transition-opacity duration-150 active:opacity-70 disabled:opacity-50"
              >
                {reextractBusy ? "Re-extracting…" : "Re-extract"}
              </button>
            }
          />
          {loading && (
            <p className="text-sm text-[#222222] opacity-70">Loading…</p>
          )}
          <ExpressionListWithAlphabet
            expressions={videoExpressions}
            scopeId="video-expressions"
            onMove={openMoveExpression}
            onDelete={(expressionId) => {
              const expr =
                topicExpressions.find((e) => e.id === expressionId) ??
                videoExpressions.find((e) => e.id === expressionId) ??
                allExpressions.find((e) => e.id === expressionId);
              openDismiss(expressionId, expr?.phrase ?? "");
            }}
          />
        </section>
      )}

      {viewTab === "all" && (
        <section className="space-y-4">
          <CollectionsBackHeader
            title={
              <p className="collections-title-scroll min-w-0 overflow-x-auto whitespace-nowrap text-[0.875rem] italic leading-snug">
                共 {allVideoCount} 个 video ｜ {allExpressionCount} 条 expressions
              </p>
            }
            onBack={handleBackFromAll}
          />
          <ExpressionListWithAlphabet
            expressions={allExpressions}
            scopeId="all-expressions"
            onMove={openMoveExpression}
            onMerge={(expressionId) => {
              const expr = allExpressions.find((e) => e.id === expressionId);
              openMergeExpression(expressionId, expr?.phrase ?? "");
            }}
            onDelete={(expressionId) => {
              const expr =
                topicExpressions.find((e) => e.id === expressionId) ??
                videoExpressions.find((e) => e.id === expressionId) ??
                allExpressions.find((e) => e.id === expressionId);
              openDismiss(expressionId, expr?.phrase ?? "");
            }}
          />
        </section>
      )}

      {message && !successVisible && (
        <p className="text-sm text-[#222222] opacity-80" role="status">
          {message}
        </p>
      )}

      <MoveSheet
        open={moveTarget !== null}
        topicOptions={moveTopicOptions}
        selectedTopicId={moveTopicId}
        onSelectTopic={setMoveTopicId}
        onCancel={() => setMoveTarget(null)}
        onConfirm={() => void confirmMove()}
        busy={moveBusy}
        showRootOption={moveTarget?.kind === "topic"}
      />

      <SuccessToast
        message={toastMessage || "Moved successfully."}
        visible={successVisible}
      />

      <DismissReasonSheet
        open={dismissTarget !== null}
        phrase={dismissTarget?.phrase}
        selectedReason={dismissReason}
        onSelectReason={setDismissReason}
        onCancel={() => {
          setDismissTarget(null);
          setDismissReason(null);
        }}
        onConfirm={() => {
          if (dismissTarget && dismissReason) {
            void dismissExpression(dismissTarget.id, dismissReason);
          }
        }}
        busy={dismissBusy}
      />

      <MergeExpressionSheet
        open={mergeSource !== null}
        sourcePhrase={mergeSource?.phrase}
        candidates={(viewTab === "topic" ? topicExpressions : allExpressions).filter(
          (expr) => expr.id !== mergeSource?.id
        )}
        selectedTargetId={mergeTargetId}
        onSelectTarget={setMergeTargetId}
        onCancel={() => {
          setMergeSource(null);
          setMergeTargetId("");
        }}
        onConfirm={() => void confirmMergeExpression()}
        busy={mergeBusy}
      />

      {reextractConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#222222]/30 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm re-extract"
          onClick={() => setReextractConfirmOpen(false)}
        >
          <div
            className="w-full max-w-[340px] rounded-2xl bg-[#FBF8F1] p-6 text-center shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="mb-1 text-[1rem] font-medium text-[#222222]">
              Re-extract expressions?
            </p>
            <p className="mb-4 text-sm text-[#222222]/70">
              This will replace non-locked expressions for this video. Locked topics stay. Continue?
            </p>
            <div className="flex items-center justify-center gap-6 text-[0.875rem]">
              <button
                type="button"
                onClick={() => setReextractConfirmOpen(false)}
                className="rounded-full border border-[#222222]/20 px-5 py-2 transition-opacity duration-150 active:opacity-70"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleReextract()}
                className="rounded-full border border-[#222222]/20 px-5 py-2 transition-opacity duration-150 active:opacity-70"
              >
                Re-extract
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function collectSubtreeIds(
  tree: TopicTreeNode[],
  topicId: string
): string[] {
  const node = findNode(tree, topicId);
  if (!node) {
    return [topicId];
  }
  return [node.id, ...flattenTree(node.children).map((item) => item.id)];
}

function findNode(
  tree: TopicTreeNode[],
  topicId: string
): TopicTreeNode | null {
  for (const node of tree) {
    if (node.id === topicId) {
      return node;
    }
    const child = findNode(node.children, topicId);
    if (child) {
      return child;
    }
  }
  return null;
}
