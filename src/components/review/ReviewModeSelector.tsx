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
  todaysReviewLabel: string;
  onSelectMode: (mode: ReviewMode) => void;
  onBack: () => void;
};

const MODE_ICONS: Record<ReviewMode, string> = {
  todays_review: "/review/microphone-button.png",
  video: "/review/mic-button.png",
  topic: "/review/mic-button.png",
};

function ModeTile({
  label,
  sublabel,
  imageSrc,
  onClick,
}: {
  label: string;
  sublabel?: string;
  imageSrc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full items-center justify-center rounded-full px-5 py-3 transition-opacity duration-150 active:opacity-80 ${highlightSurfaceClassName}`}
    >
      {sublabel ? (
        <span
          className={`absolute right-5 top-1/2 -translate-y-1/2 text-base opacity-70 ${pageHintFont.className} ${pageHintTextClassName}`}
        >
          {sublabel}
        </span>
      ) : null}
      <span className="relative inline-flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt=""
          className="absolute right-[calc(100%+0.625rem)] top-1/2 h-10 w-10 -translate-y-1/2 object-contain"
        />
        <span
          className={`text-base ${pageHintFont.className} ${pageHintTextClassName}`}
        >
          {label}
        </span>
      </span>
    </button>
  );
}

function activeModeLabel(mode: ReviewMode): string {
  switch (mode) {
    case "todays_review":
      return "Today's Review Now";
    case "video":
      return "Video Practice Now";
    case "topic":
      return "Topic Practice Now";
  }
}

export function ReviewModeSelector({
  phase,
  mode,
  todaysReviewLabel,
  onSelectMode,
  onBack,
}: ReviewModeSelectorProps) {
  if (phase === "active" && mode) {
    const label = activeModeLabel(mode);
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
        label="Today's Review"
        sublabel={todaysReviewLabel}
        imageSrc={MODE_ICONS.todays_review}
        onClick={() => onSelectMode("todays_review")}
      />
      <ModeTile
        label="Video Practice"
        imageSrc={MODE_ICONS.video}
        onClick={() => onSelectMode("video")}
      />
      <ModeTile
        label="Topic Practice"
        imageSrc={MODE_ICONS.topic}
        onClick={() => onSelectMode("topic")}
      />
    </div>
  );
}
