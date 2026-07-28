"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  pickReviewCardColor,
  reviewCardTextColor,
} from "@/lib/review-card-palette";
import { formatExampleIndexLabel } from "@/lib/example-index-label";
import {
  applyExpressionCorrection,
  collectCorrectableExamples,
  isExampleCorrectionField,
  prefillCorrectionValue,
} from "@/lib/expression-correction";
import { splitPhraseAndPhonetic } from "@/lib/feishu-phonetic";
import type { ExpressionCorrectionField } from "@/types/expression-correction";
import type { ReviewDeckCard, ReviewMode, ReviewRating } from "@/types/review";
import type { ExpressionExample } from "@/types/expression";
import { ReviewRatingActions } from "./ReviewRatingActions";

type ReviewCardProps = {
  card: ReviewDeckCard;
  mode: ReviewMode;
  onRate: (rating: ReviewRating) => void;
};

type DisplayCardContent = Pick<
  ReviewDeckCard,
  "phrase" | "meaning" | "example_en" | "example_zh" | "examples" | "phonetic"
>;

function collectExamples(
  card: Pick<ReviewDeckCard, "examples" | "example_en" | "example_zh">
): ExpressionExample[] {
  return collectCorrectableExamples(card).filter((example) =>
    example.en?.trim()
  );
}

function cardToDisplay(card: ReviewDeckCard): DisplayCardContent {
  const examples = collectExamples(card);
  const { lemma, phonetic } = splitPhraseAndPhonetic(
    card.phrase,
    card.phonetic
  );
  return {
    phrase: lemma,
    meaning: card.meaning,
    example_en: examples[0]?.en ?? card.example_en,
    example_zh: examples[0]?.zh ?? card.example_zh,
    examples,
    phonetic,
  };
}

function exampleDiffersFromLemma(exampleEn: string, lemma: string): boolean {
  return exampleEn.trim().toLowerCase() !== lemma.trim().toLowerCase();
}

const REPORT_TYPES: Array<{
  value: ExpressionCorrectionField;
  label: string;
}> = [
  { value: "meaning", label: "短语释义有误" },
  { value: "example_zh", label: "例句释义有误" },
  { value: "phrase", label: "短语英文有误" },
  { value: "example_en", label: "例句英文有误" },
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
  const [reportType, setReportType] =
    useState<ExpressionCorrectionField>("meaning");
  const [exampleIndex, setExampleIndex] = useState(0);
  const [correctContent, setCorrectContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);
  const [displayCard, setDisplayCard] = useState<DisplayCardContent>(() =>
    cardToDisplay(card)
  );
  const examples = collectExamples(displayCard);
  const isMultiExample = examples.length > 1;
  const needsExamplePicker =
    isExampleCorrectionField(reportType) && isMultiExample;

  const background = useMemo(
    () => pickReviewCardColor(card.id),
    [card.id]
  );
  const textColor = reviewCardTextColor(background);
  const footerDividerClassName =
    textColor === "#FFFFFF"
      ? "border-t border-[#FFFFFF]/45"
      : "border-t border-[#222222]/40";
  const sourceLabel = mode === "topic" ? card.topicName : card.videoTitle;
  const hiddenFaceStyle: CSSProperties = {
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
  };

  useEffect(() => {
    setDisplayCard(cardToDisplay(card));
    setIsBack(false);
    setReportOpen(false);
    setReportType("meaning");
    setExampleIndex(0);
    setCorrectContent("");
    setSubmitting(false);
    setReportError(null);
    setSuccessVisible(false);
  }, [card]);

  function openReport() {
    const nextType: ExpressionCorrectionField = "meaning";
    setReportType(nextType);
    setExampleIndex(0);
    setCorrectContent(prefillCorrectionValue(displayCard, nextType, 0));
    setReportError(null);
    setReportOpen(true);
  }

  function selectReportType(nextType: ExpressionCorrectionField) {
    setReportType(nextType);
    setReportError(null);
    const nextIndex =
      isExampleCorrectionField(nextType) && examples.length > 0
        ? Math.min(exampleIndex, examples.length - 1)
        : 0;
    setExampleIndex(nextIndex);
    setCorrectContent(
      prefillCorrectionValue(displayCard, nextType, nextIndex)
    );
  }

  function selectExampleIndex(nextIndex: number) {
    setExampleIndex(nextIndex);
    setReportError(null);
    setCorrectContent(
      prefillCorrectionValue(displayCard, reportType, nextIndex)
    );
  }

  function handleRate(rating: ReviewRating) {
    setFeedback(rating);
    window.setTimeout(() => {
      onRate(rating);
      setIsBack(false);
      setFeedback(null);
    }, 900);
  }

  async function handleSubmitReport() {
    const nextContent = correctContent.trim();
    if (!nextContent || submitting) return;

    setSubmitting(true);
    setReportError(null);

    try {
      const payload: {
        field: ExpressionCorrectionField;
        value: string;
        exampleIndex?: number;
      } = {
        field: reportType,
        value: nextContent,
      };
      if (isExampleCorrectionField(reportType)) {
        payload.exampleIndex = needsExamplePicker ? exampleIndex : 0;
      }

      const response = await fetch(`/api/expressions/${card.id}/correct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        message?: string;
        expression?: ReviewDeckCard;
      };
      if (!response.ok || !body.ok) {
        throw new Error(body.message ?? "提交失败，请重试。");
      }

      // Prefer server payload; fall back to local apply so the card updates
      // even if the response shape is partial.
      if (body.expression) {
        setDisplayCard(cardToDisplay({ ...card, ...body.expression }));
      } else {
        const next = applyExpressionCorrection(displayCard, {
          field: reportType,
          value: nextContent,
          exampleIndex: payload.exampleIndex,
        });
        setDisplayCard({
          ...displayCard,
          ...next,
          phonetic: displayCard.phonetic,
        });
      }

      setReportOpen(false);
      setCorrectContent("");
      setSuccessVisible(true);
      window.setTimeout(() => setSuccessVisible(false), 1100);
    } catch (error) {
      setReportError(
        error instanceof Error ? error.message : "提交失败，请重试。"
      );
    } finally {
      setSubmitting(false);
    }
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
                openReport();
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
                        <p className="text-[0.6875rem] font-medium tabular-nums tracking-wide opacity-70">
                          {formatExampleIndexLabel(index)}
                        </p>
                      )}
                      {example.zh ? (
                        <p className="text-[1rem] leading-relaxed opacity-90">
                          {example.zh}
                        </p>
                      ) : (
                        <p className="text-[1rem] leading-relaxed opacity-50">
                          —
                        </p>
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
                openReport();
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
                {displayCard.phonetic ? (
                  <p className="mt-2 text-[0.9375rem] leading-snug opacity-70">
                    {displayCard.phonetic}
                  </p>
                ) : null}
                <div className="mt-4 w-full space-y-3">
                  {examples.map((example, index) => {
                    if (
                      !example.en ||
                      !exampleDiffersFromLemma(example.en, displayCard.phrase)
                    ) {
                      return null;
                    }
                    return (
                      <div key={index} className="space-y-1">
                        {isMultiExample && (
                          <p className="text-[0.6875rem] font-medium tabular-nums tracking-wide opacity-70">
                            {formatExampleIndexLabel(index)}
                          </p>
                        )}
                        <p className="text-[0.9375rem] leading-relaxed opacity-90">
                          {example.en}
                        </p>
                      </div>
                    );
                  })}
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
          onClick={() => {
            if (!submitting) setReportOpen(false);
          }}
        >
          <div
            className="relative flex w-full max-w-[340px] flex-col bg-[length:100%_100%] bg-center bg-no-repeat px-9 py-12 text-[#222222]"
            style={{
              backgroundImage: "url(/review/paper.png)",
              minHeight: 470,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-1 flex-col justify-center gap-6">
              <div>
                <p className="mb-3 text-center text-[0.9375rem] font-medium">
                  错误类型
                </p>
                <div className="grid grid-cols-2 gap-2 text-[0.8125rem]">
                  {REPORT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => selectReportType(type.value)}
                      disabled={submitting}
                      className={`rounded-full border px-2.5 py-1.5 transition-opacity duration-150 active:opacity-70 disabled:opacity-50 ${
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

              {needsExamplePicker && (
                <div>
                  <p className="mb-2 text-center text-[0.875rem]">选择例句</p>
                  <div className="flex flex-wrap justify-center gap-2 text-[0.8125rem]">
                    {examples.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectExampleIndex(index)}
                        disabled={submitting}
                        className={`rounded-full border px-3 py-1 transition-opacity duration-150 active:opacity-70 disabled:opacity-50 ${
                          exampleIndex === index
                            ? "border-[#222222]/55 bg-[#FFFFFF]/35"
                            : "border-[#222222]/20"
                        }`}
                      >
                        例句 {index + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <label className="block text-[0.875rem]">
                <span>请输入正确内容：</span>
                <input
                  value={correctContent}
                  onChange={(event) => setCorrectContent(event.target.value)}
                  disabled={submitting}
                  className="mt-1 block w-full border-0 border-b border-[#222222]/50 bg-transparent px-0 py-1 outline-none focus:ring-0 disabled:opacity-50"
                />
              </label>

              {reportError ? (
                <p className="text-center text-[0.8125rem] text-[#B33A3A]" role="alert">
                  {reportError}
                </p>
              ) : null}

              <div className="flex items-center justify-center gap-4 pt-1 text-[0.875rem]">
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  disabled={submitting}
                  className="rounded-full border border-[#222222]/20 px-5 py-2 transition-opacity duration-150 active:opacity-70 disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleSubmitReport();
                  }}
                  disabled={submitting || !correctContent.trim()}
                  className="rounded-full border border-[#222222]/20 px-5 py-2 transition-opacity duration-150 active:opacity-70 disabled:opacity-50"
                >
                  {submitting ? "提交中…" : "提交"}
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
