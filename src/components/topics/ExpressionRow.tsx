"use client";

import { useRef, useState } from "react";
import type { Expression } from "@/types/expression";

type ExpressionRowProps = {
  expression: Expression;
  fadingOut: boolean;
  onDismiss: (id: string, viaTrash?: boolean) => void;
  onUnlock: (id: string) => void;
  onDragStart: (expression: Expression, x: number, y: number) => void;
  moveTopicOptions: Array<{ id: string; name: string }>;
  onMove: (expressionId: string, topicId: string) => void;
};

export function ExpressionRow({
  expression,
  fadingOut,
  onDismiss,
  onUnlock,
  onDragStart,
  moveTopicOptions,
  onMove,
}: ExpressionRowProps) {
  const [offsetX, setOffsetX] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const longPressTimer = useRef<number | null>(null);

  function clearLongPress() {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handleTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchMove(event: React.TouchEvent) {
    if (touchStartX.current === null) {
      return;
    }
    const currentX = event.touches[0]?.clientX ?? touchStartX.current;
    const delta = Math.min(0, currentX - touchStartX.current);
    setOffsetX(delta);
  }

  function handleTouchEnd() {
    if (offsetX < -80) {
      onDismiss(expression.id);
    }
    setOffsetX(0);
    touchStartX.current = null;
  }

  function handlePointerDown(event: React.PointerEvent) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    clearLongPress();
    longPressTimer.current = window.setTimeout(() => {
      onDragStart(expression, event.clientX, event.clientY);
    }, 450);
  }

  function handlePointerUp() {
    clearLongPress();
  }

  return (
    <div className="relative overflow-hidden rounded border border-[#222222]/15">
      <div
        className={`absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-[#222222] text-xs text-[#FFFFFF] transition-opacity duration-150 ${
          offsetX < -40 ? "opacity-100" : "opacity-0"
        }`}
      >
        Delete
      </div>
      <article
        className={`relative bg-[#FFFFFF] p-3 transition-opacity duration-200 ${
          fadingOut ? "opacity-0" : "opacity-100"
        }`}
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-[#222222]">{expression.phrase}</h3>
            <p className="mt-1 text-sm text-[#222222]">{expression.meaning}</p>
            {expression.example_en && (
              <p className="mt-2 text-sm italic text-[#222222] opacity-80">
                &ldquo;{expression.example_en}&rdquo;
              </p>
            )}
            {expression.topic_locked && (
              <p className="mt-2 text-xs text-[#222222] opacity-60">
                Locked topic
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-1">
            <button
              type="button"
              onClick={() => onDismiss(expression.id)}
              className="rounded border border-[#222222]/25 px-2 py-1 text-xs text-[#222222]"
            >
              Delete
            </button>
            {expression.topic_locked && (
              <button
                type="button"
                onClick={() => onUnlock(expression.id)}
                className="rounded border border-[#222222]/25 px-2 py-1 text-xs text-[#222222]"
              >
                Unlock
              </button>
            )}
            <select
              aria-label="Move to topic"
              defaultValue=""
              onChange={(event) => {
                const topicId = event.target.value;
                if (topicId) {
                  onMove(expression.id, topicId);
                  event.target.value = "";
                }
              }}
              className="max-w-[88px] rounded border border-[#222222]/25 px-1 py-1 text-xs text-[#222222]"
            >
              <option value="">Move…</option>
              {moveTopicOptions.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </article>
    </div>
  );
}
