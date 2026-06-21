"use client";

import type { Topic } from "@/types/topic";

type DockTopic = Pick<Topic, "id" | "name" | "slug">;

type TopicDockProps = {
  topics: DockTopic[];
  activeTarget: string | null;
  trashActive: boolean;
};

export function TopicDock({ topics, activeTarget, trashActive }: TopicDockProps) {
  return (
    <div className="fixed bottom-0 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-[430px] -translate-x-1/2 border-t-[2.5px] border-[#D4D4D4] bg-[#FFFFFF] shadow-[0_-2px_8px_rgba(34,34,34,0.04)] max-md:rounded-b-[36px] md:rounded-b-[40px]">
      <div className="mx-auto flex w-full items-center gap-2 px-3 py-3">
        <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
          {topics.map((topic) => (
            <div
              key={topic.id}
              data-drop-target="topic"
              data-topic-id={topic.id}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-opacity duration-150 ${
                activeTarget === topic.id
                  ? "border-[#222222] bg-[#222222] text-[#FFFFFF]"
                  : "border-[#222222]/25 text-[#222222]"
              }`}
              title={topic.name}
            >
              {topic.name}
            </div>
          ))}
        </div>
        <div
          data-drop-target="trash"
          className={`shrink-0 rounded-full border px-3 py-2 text-xs transition-opacity duration-150 ${
            trashActive
              ? "border-[#222222] bg-[#222222] text-[#FFFFFF]"
              : "border-[#222222]/25 text-[#222222]"
          }`}
          aria-label="Trash"
        >
          🗑
        </div>
      </div>
    </div>
  );
}

export function findDropTarget(
  clientX: number,
  clientY: number
): { type: "topic"; topicId: string } | { type: "trash" } | null {
  const elements = document.elementsFromPoint(clientX, clientY);
  for (const element of elements) {
    if (!(element instanceof HTMLElement)) {
      continue;
    }
    if (element.dataset.dropTarget === "trash") {
      return { type: "trash" };
    }
    if (
      element.dataset.dropTarget === "topic" &&
      element.dataset.topicId
    ) {
      return { type: "topic", topicId: element.dataset.topicId };
    }
  }
  return null;
}
