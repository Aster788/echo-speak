"use client";

import { pageHintFont } from "@/lib/page-hint-font";
import type { ReviewScopeOption } from "@/types/review";

type ReviewScopePickerProps = {
  title: string;
  options: ReviewScopeOption[];
  onSelect: (scopeId: string) => void;
  onBack: () => void;
};

const STICKY_NOTE_BG = "url(/review/sticky-note.png)";
const STICKY_NOTE_TILTS = [-0.65, 0.55, -0.45, 0.7] as const;

function stickyNoteTilt(index: number) {
  return STICKY_NOTE_TILTS[index % STICKY_NOTE_TILTS.length];
}

function ReviewScopeNote({
  option,
  index,
  onSelect,
}: {
  option: ReviewScopeOption;
  index: number;
  onSelect: (scopeId: string) => void;
}) {
  return (
    <li className="px-0.5 py-0.5">
      <button
        type="button"
        onClick={() => onSelect(option.id)}
        className={`relative flex h-[52px] w-full items-center justify-between border-0 bg-transparent bg-[length:100%_100%] bg-center bg-no-repeat px-7 py-2 text-left transition-opacity duration-150 active:opacity-80 ${pageHintFont.className}`}
        style={{
          backgroundImage: STICKY_NOTE_BG,
          transform: `rotate(${stickyNoteTilt(index)}deg)`,
        }}
      >
        <span className="relative z-10 min-w-0 truncate text-sm italic leading-snug text-[#2a1f14]/95">
          {option.label}
        </span>
        <span className="relative z-10 ml-3 shrink-0 text-xs italic tabular-nums text-[#2a1f14]/70">
          {option.count}
        </span>
      </button>
    </li>
  );
}

export function ReviewScopePicker({
  title,
  options,
  onSelect,
  onBack,
}: ReviewScopePickerProps) {
  return (
    <div className="relative z-10 mt-4">
      <div className="mb-3 flex items-center justify-between">
        <h2
          className={`text-sm italic text-[#222222]/80 ${pageHintFont.className}`}
        >
          {title}
        </h2>
        <button
          type="button"
          onClick={onBack}
          className={`text-sm italic text-[#222222]/70 transition-opacity duration-150 active:opacity-100 ${pageHintFont.className}`}
        >
          Back
        </button>
      </div>
      {options.length === 0 ? (
        <p
          className={`text-center text-[0.8125rem] italic text-[#222222]/70 ${pageHintFont.className}`}
        >
          No expressions available for this mode yet.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {options.map((option, index) => (
            <ReviewScopeNote
              key={option.id}
              option={option}
              index={index}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
