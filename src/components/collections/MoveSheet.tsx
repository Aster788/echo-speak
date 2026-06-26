"use client";

import Image from "next/image";

type MoveSheetProps = {
  open: boolean;
  topicOptions: Array<{ id: string; name: string }>;
  selectedTopicId: string;
  onSelectTopic: (topicId: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
  showRootOption?: boolean;
};

export function MoveSheet({
  open,
  topicOptions,
  selectedTopicId,
  onSelectTopic,
  onCancel,
  onConfirm,
  busy = false,
  showRootOption = false,
}: MoveSheetProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#222222]/20 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Move into topic"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-[340px] px-6 py-10"
        onClick={(event) => event.stopPropagation()}
      >
        <Image
          src="/collections/paper.png"
          alt=""
          width={622}
          height={1071}
          className="pointer-events-none absolute inset-0 h-full w-full object-fill"
          aria-hidden="true"
        />
        <div className="relative z-10 space-y-4 text-[#222222]">
          <p className="text-center text-[1rem] font-medium">Move into...</p>
          <select
            value={selectedTopicId}
            onChange={(event) => onSelectTopic(event.target.value)}
            className="w-full rounded border border-[#222222]/25 bg-[#FFFFFF]/80 px-3 py-2 text-sm"
          >
            <option value="">Select topic</option>
            {showRootOption && <option value="__root__">Root level</option>}
            {topicOptions.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-center gap-6 pt-2 text-[0.875rem]">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-full border border-[#222222]/20 px-5 py-2 transition-opacity duration-150 active:opacity-70 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy || !selectedTopicId}
              className="rounded-full border border-[#222222]/20 px-5 py-2 transition-opacity duration-150 active:opacity-70 disabled:opacity-50"
            >
              Move
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
