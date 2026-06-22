"use client";

import type { ReviewMode } from "@/types/review";
import { highlightSurfaceClassName } from "@/lib/highlight-surface";
import {
  pageHintColumnClassName,
  pageHintColumnWidthVar,
} from "@/lib/page-hint-column";
import { pageHintFont, pageHintTextClassName } from "@/lib/page-hint-font";

type ReviewModeSelectorProps = {
  phase: "select-mode" | "active";
  mode: ReviewMode | null;
  onSelectMode: (mode: ReviewMode) => void;
  onBack: () => void;
};

const MODE_ICONS: Record<ReviewMode, string> = {
  video: "/review/microphone-button.png",
  topic: "/review/mic-button.png",
};

function ModeTile({
  label,
  imageSrc,
  onClick,
}: {
  label: string;
  imageSrc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center justify-center gap-3 rounded-full px-5 py-3 transition-opacity duration-150 active:opacity-80 ${highlightSurfaceClassName}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt=""
        className="h-10 w-10 shrink-0 object-contain"
      />
      <span
        className={`text-base ${pageHintFont.className} ${pageHintTextClassName}`}
      >
        {label}
      </span>
    </button>
  );
}

export function ReviewModeSelector({
  phase,
  mode,
  onSelectMode,
  onBack,
}: ReviewModeSelectorProps) {
  if (phase === "active" && mode) {
    const label = mode === "video" ? "Video Mode Now" : "Topic Mode Now";
    return (
      <div
        className={`relative z-10 flex items-center gap-3 ${pageHintColumnClassName}`}
        style={{ width: `var(${pageHintColumnWidthVar}, fit-content)` }}
      >
        <div
          className={`flex h-12 flex-1 items-center justify-center gap-3 rounded-full px-4 text-base ${pageHintFont.className} ${pageHintTextClassName} ${highlightSurfaceClassName}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={MODE_ICONS[mode]}
            alt=""
            className="h-10 w-10 shrink-0 object-contain"
          />
          <span className="shrink-0 whitespace-nowrap">{label}</span>
        </div>
        <button
          type="button"
          onClick={onBack}
          className={`flex h-12 shrink-0 items-center rounded-full px-5 text-base ${pageHintFont.className} ${pageHintTextClassName} transition-opacity duration-150 active:opacity-80 ${highlightSurfaceClassName}`}
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative z-10 flex flex-col gap-3 ${pageHintColumnClassName}`}
      style={{ width: `var(${pageHintColumnWidthVar}, fit-content)` }}
    >
      <ModeTile
        label="Video Mode"
        imageSrc={MODE_ICONS.video}
        onClick={() => onSelectMode("video")}
      />
      <ModeTile
        label="Topic Mode"
        imageSrc={MODE_ICONS.topic}
        onClick={() => onSelectMode("topic")}
      />
    </div>
  );
}
