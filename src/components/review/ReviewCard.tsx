"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  pickReviewCardColor,
  reviewCardTextColor,
} from "@/lib/review-card-palette";
import type { ReviewDeckCard, ReviewMode, ReviewRating } from "@/types/review";
import type { ExpressionExample } from "@/types/expression";
import { ReviewRatingActions } from "./ReviewRatingActions";

type ReviewCardProps = {
  card: ReviewDeckCard;
  mode: ReviewMode;
  onRate: (rating: ReviewRating) => void;
};

type ReportType = "english" | "chinese" | "punctuation";

type DisplayCardContent = Pick<
  ReviewDeckCard,
  "phrase" | "meaning" | "example_en" | "example_zh" | "examples"
>;

const EXAMPLE_ORDINALS = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];

function collectExamples(card: Pick<ReviewDeckCard, "examples" | "example_en" | "example_zh">): ExpressionExample[] {
  if (card.examples && card.examples.length > 0) {
    return card.examples;
  }
  return [{ en: card.example_en, zh: card.example_zh }];
}

function cardToDisplay(card: ReviewDeckCard): DisplayCardContent {
  const examples = collectExamples(card);
  return {
    phrase: card.phrase,
    meaning: card.meaning,
    example_en: examples[0]?.en ?? card.example_en,
    example_zh: examples[0]?.zh ?? card.example_zh,
    examples,
  };
}

const REPORT_TYPES: Array<{ value: ReportType; label: string }> = [
  { value: "english", label: "英文有误" },
  { value: "chinese", label: "中文有误" },
  { value: "punctuation", label: "标点有误" },
];
const REPORT_FIREWORK_COLORS = [
  "#F5C84B",
  "#E86F7C",
  "#7CC6FF",
  "#78D694",
  "#B88CFF",
];

export function ReviewCard({ card, mode, onRate }: ReviewCardProps) {
  const [isBack, setIsBack] = useState(false);
  const [feedback, setFeedback] = useState<ReviewRating | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("chinese");
  const [correctContent, setCorrectContent] = useState("");
  const [successVisible, setSuccessVisible] = useState(false);
  const [displayCard, setDisplayCard] = useState<DisplayCardContent>(() =>
    cardToDisplay(card)
  );
  const examples = collectExamples(displayCard);
  const isMultiExample = examples.length > 1;

  const background = useMemo(
    () => pickReviewCardColor(card.id),
    [card.id]
  );
  const textColor = reviewCardTextColor(background);
  const footerDividerClassName =
    textColor === "#FFFFFF"
      ? "border-t border-[#FFFFFF]/45"
      : "border-t border-[#222222]/40";
  const sourceLabel = mode === "video" ? card.videoTitle : card.topicName;
  const hiddenFaceStyle: CSSProperties = {
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
  };

  useEffect(() => {
    setDisplayCard(cardToDisplay(card));
    setIsBack(false);
    setReportOpen(false);
    setReportType("chinese");
    setCorrectContent("");
    setSuccessVisible(false);
  }, [card]);

  function handleRate(rating: ReviewRating) {
    setFeedback(rating);
    window.setTimeout(() => {
      onRate(rating);
      setIsBack(false);
      setFeedback(null);
    }, 900);
  }

  function handleSubmitReport() {
    const nextContent = correctContent.trim();
    if (!nextContent) return;

    setDisplayCard((current) => {
      if (reportType === "english") {
        return { ...current, phrase: nextContent };
      }

      if (reportType === "chinese") {
        return { ...current, meaning: nextContent };
      }

      return { ...current, example_zh: nextContent };
    });

    setReportOpen(false);
    setCorrectContent("");
    setSuccessVisible(true);
    window.setTimeout(() => setSuccessVisible(false), 1100);
  }

  return (
    <>
      <div className="relative mx-auto min-h-[min(72vh,560px)] w-full max-w-[360px] [perspective:1200px]">
        <div
          className="relative min-h-[min(72vh,560px)] w-full transition-transform duration-500 ease-out [transform-style:preserve-3d]"
          style={{
            transform: isBack ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <article
            className="absolute inset-0 flex flex-col overflow-hidden rounded-[6px] border border-[#222222]/20 shadow-[0_2px_10px_rgba(34,34,34,0.08)]"
            style={{
              ...hiddenFaceStyle,
              backgroundColor: background,
              color: textColor,
              transform: "rotateY(0deg)",
              pointerEvents: isBack ? "none" : "auto",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, currentColor 0.6px, transparent 0)",
                backgroundSize: "4px 4px",
              }}
            />
            <button
              type="button"
              className="absolute right-3 top-3 z-30 h-10 w-10 transition-opacity duration-150 active:opacity-70"
              onClick={(event) => {
                event.stopPropagation();
                setReportOpen(true);
              }}
              aria-label="Report card issue"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/review/confused.png"
                alt=""
                className="h-full w-full object-contain"
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              className="relative z-10 flex flex-1 flex-col text-left"
              onClick={() => setIsBack(true)}
              aria-label="Flip to back"
            >
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
                <p className="text-[1.375rem] font-normal leading-relaxed">
                  {displayCard.meaning}
                </p>
                <div className="mt-4 w-full space-y-3">
                  {examples.map((example, index) => (
                    <div key={index} className="space-y-1">
                      {isMultiExample && (
                        <p className="text-[0.6875rem] font-medium uppercase tracking-wide opacity-70">
                          Example {EXAMPLE_ORDINALS[index] ?? index + 1}
                        </p>
                      )}
                      {example.zh ? (
                        <p className="text-[1rem] leading-relaxed opacity-90">
                          {example.zh}
                        </p>
                      ) : (
                        <p className="text-[1rem] leading-relaxed opacity-50">—</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div
                className={`${footerDividerClassName} px-4 py-3 text-center text-[0.75rem] opacity-80`}
              >
                {sourceLabel}
              </div>
            </button>
          </article>

          <article
            className="absolute inset-0 flex flex-col overflow-hidden rounded-[6px] border border-[#222222]/20 shadow-[0_2px_10px_rgba(34,34,34,0.08)]"
            style={{
              ...hiddenFaceStyle,
              backgroundColor: background,
              color: textColor,
              transform: "rotateY(180deg)",
              pointerEvents: isBack ? "auto" : "none",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, currentColor 0.6px, transparent 0)",
                backgroundSize: "4px 4px",
              }}
            />
            <button
              type="button"
              className="absolute right-3 top-3 z-30 h-10 w-10 transition-opacity duration-150 active:opacity-70"
              onClick={(event) => {
                event.stopPropagation();
                setReportOpen(true);
              }}
              aria-label="Report card issue"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/review/confused.png"
                alt=""
                className="h-full w-full object-contain"
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              className="relative z-10 flex flex-1 flex-col text-left"
              onClick={() => setIsBack(false)}
              aria-label="Flip to front"
            >
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
                <p className="text-[1.5rem] font-normal leading-snug">
                  {displayCard.phrase}
                </p>
                <div className="mt-4 w-full space-y-3">
                  {examples.map((example, index) => (
                    <div key={index} className="space-y-1">
                      {isMultiExample && (
                        <p className="text-[0.6875rem] font-medium uppercase tracking-wide opacity-70">
                          Example {EXAMPLE_ORDINALS[index] ?? index + 1}
                        </p>
                      )}
                      {example.en ? (
                        <p className="text-[0.9375rem] leading-relaxed opacity-90">
                          {example.en}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </button>
            <ReviewRatingActions
              textColor={textColor}
              onRate={handleRate}
              feedback={feedback}
            />
          </article>
        </div>
      </div>
      {reportOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#222222]/15 px-5"
          role="dialog"
          aria-modal="true"
          aria-label="Report card issue"
          onClick={() => setReportOpen(false)}
        >
          <div
            className="relative flex w-full max-w-[340px] flex-col bg-[length:100%_100%] bg-center bg-no-repeat px-9 py-12 text-[#222222]"
            style={{
              backgroundImage: "url(/review/paper.png)",
              minHeight: 470,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-1 flex-col justify-center gap-8">
              <div>
                <p className="mb-3 text-center text-[0.9375rem] font-medium">
                  错误类型
                </p>
                <div className="flex justify-center gap-2 text-[0.8125rem]">
                  {REPORT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setReportType(type.value)}
                      className={`rounded-full border px-3 py-1 transition-opacity duration-150 active:opacity-70 ${
                        reportType === type.value
                          ? "border-[#222222]/55 bg-[#FFFFFF]/35"
                          : "border-[#222222]/20"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block text-[0.875rem]">
                <span>请输入正确内容：</span>
                <input
                  value={correctContent}
                  onChange={(event) => setCorrectContent(event.target.value)}
                  className="mt-1 block w-full border-0 border-b border-[#222222]/50 bg-transparent px-0 py-1 outline-none focus:ring-0"
                />
              </label>

              <div className="flex items-center justify-center gap-4 pt-1 text-[0.875rem]">
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="rounded-full border border-[#222222]/20 px-5 py-2 transition-opacity duration-150 active:opacity-70"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReport}
                  className="rounded-full border border-[#222222]/20 px-5 py-2 transition-opacity duration-150 active:opacity-70"
                >
                  提交
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {successVisible && (
        <div
          className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center"
          aria-live="polite"
        >
          <div className="review-report-success relative rounded-full bg-[#C9C4B0] px-8 py-4 text-[1.125rem] font-medium text-[#222222] shadow-[0_8px_24px_rgba(34,34,34,0.18)]">
            提交成功：）
            {Array.from({ length: 12 }, (_, index) => (
              <span
                key={index}
                className="review-report-firework absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
                style={
                  {
                    backgroundColor:
                      REPORT_FIREWORK_COLORS[
                        index % REPORT_FIREWORK_COLORS.length
                      ],
                    "--firework-x": `${Math.cos((index / 12) * Math.PI * 2) * 64}px`,
                    "--firework-y": `${Math.sin((index / 12) * Math.PI * 2) * 46}px`,
                    animationDelay: `${index * 18}ms`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
