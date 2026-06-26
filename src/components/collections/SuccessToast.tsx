"use client";

import type { CSSProperties } from "react";

const FIREWORK_COLORS = [
  "#F5C84B",
  "#E86F7C",
  "#7CC6FF",
  "#78D694",
  "#B88CFF",
];

type SuccessToastProps = {
  message: string;
  visible: boolean;
};

export function SuccessToast({ message, visible }: SuccessToastProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center"
      aria-live="polite"
    >
      <div className="review-report-success relative rounded-full bg-[#C9C4B0] px-8 py-4 text-[1.125rem] font-medium text-[#222222] shadow-[0_8px_24px_rgba(34,34,34,0.18)]">
        {message}
        {Array.from({ length: 12 }, (_, index) => (
          <span
            key={index}
            className="review-report-firework absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
            style={
              {
                backgroundColor:
                  FIREWORK_COLORS[index % FIREWORK_COLORS.length],
                "--firework-x": `${Math.cos((index / 12) * Math.PI * 2) * 64}px`,
                "--firework-y": `${Math.sin((index / 12) * Math.PI * 2) * 46}px`,
                animationDelay: `${index * 18}ms`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}
