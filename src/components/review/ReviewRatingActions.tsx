"use client";

import type { CSSProperties } from "react";
import type { ReviewRating } from "@/types/review";

type ReviewRatingActionsProps = {
  textColor: "#FFFFFF" | "#222222";
  onRate: (rating: ReviewRating) => void;
  feedback: ReviewRating | null;
};

const RATINGS: ReviewRating[] = ["mastered", "again", "unsure"];
const FIREWORK_COLORS = ["#F5C84B", "#E86F7C", "#7CC6FF", "#78D694", "#B88CFF"];
const AGAIN_OFFSETS = [-30, -15, 0, 15, 30];

export function ReviewRatingActions({
  textColor,
  onRate,
  feedback,
}: ReviewRatingActionsProps) {
  const borderColor =
    textColor === "#FFFFFF" ? "border-[#FFFFFF]/35" : "border-[#222222]/25";

  return (
    <div className="relative grid grid-cols-3 border-t border-inherit">
      {RATINGS.map((rating, index) => (
        <button
          key={rating}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRate(rating);
          }}
          className={`relative px-2 py-4 text-center text-[0.8125rem] font-normal capitalize transition-opacity duration-150 active:opacity-70 ${
            index > 0 ? `border-l ${borderColor}` : ""
          }`}
        >
          {rating}
          {feedback === rating && rating === "again" && (
            <span className="pointer-events-none absolute inset-0 overflow-visible">
              {AGAIN_OFFSETS.map((offset, plusIndex) => (
                <span
                  key={offset}
                  className="review-float-plus absolute left-1/2 top-2 text-xs font-medium"
                  style={
                    {
                      color: textColor,
                      "--plus-x": `${offset}px`,
                      animationDelay: `${plusIndex * 70}ms`,
                    } as CSSProperties
                  }
                >
                  +1
                </span>
              ))}
            </span>
          )}
          {feedback === rating && rating === "mastered" && (
            <span className="pointer-events-none absolute inset-0 overflow-visible">
              {Array.from({ length: 14 }, (_, sparkIndex) => (
                <span
                  key={sparkIndex}
                  className="review-spark-dot absolute h-2 w-2 rounded-full"
                  style={
                    {
                      backgroundColor:
                        FIREWORK_COLORS[sparkIndex % FIREWORK_COLORS.length],
                      left: `${50 + Math.cos((sparkIndex / 14) * Math.PI * 2) * 44}%`,
                      top: `${50 + Math.sin((sparkIndex / 14) * Math.PI * 2) * 62}%`,
                      "--spark-x": `${Math.cos((sparkIndex / 14) * Math.PI * 2) * 16}px`,
                      "--spark-y": `${Math.sin((sparkIndex / 14) * Math.PI * 2) * 12}px`,
                      animationDelay: `${sparkIndex * 28}ms`,
                    } as CSSProperties
                  }
                />
              ))}
            </span>
          )}
          {feedback === rating && rating === "unsure" && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/review/broken-heart.png"
                alt=""
                className="review-broken-heart pointer-events-none absolute right-1 -top-4 h-8 w-8 object-contain"
                aria-hidden="true"
              />
            </>
          )}
        </button>
      ))}
    </div>
  );
}
