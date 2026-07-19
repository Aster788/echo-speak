"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import {
  TODAYS_REVIEW_SCOPE_ID,
} from "@/lib/review-constants";
import {
  buildTodaysReviewDeck,
  flushDeferredUnsureSchedules,
  getTodaysReviewSummary,
  loadReviewDeck,
  submitReviewRating,
} from "@/app/review/actions";
import { ReviewCard } from "@/components/review/ReviewCard";
import { ReviewEmptyDecoration } from "@/components/review/ReviewEmptyDecoration";
import { ReviewModeSelector } from "@/components/review/ReviewModeSelector";
import { ReviewScopePicker } from "@/components/review/ReviewScopePicker";
import { useReviewReset } from "@/components/review/ReviewResetContext";
import {
  insertCardAtGap,
  shouldReinsertUnsure,
  unsureReinsertGap,
} from "@/services/session-queue";
import type {
  ReviewDeckCard,
  ReviewMode,
  ReviewRating,
  ReviewScopeOption,
  TodaysReviewSummary,
} from "@/types/review";

type SessionPhase =
  | "select-mode"
  | "pick-scope"
  | "reviewing"
  | "complete"
  | "caught-up";

type ReviewSessionProps = {
  videoScopes: ReviewScopeOption[];
  topicScopes: ReviewScopeOption[];
  initialSummary: TodaysReviewSummary;
  initialTodaysCards: ReviewDeckCard[];
  autoStartTodaysReview?: boolean;
};

export function ReviewSession({
  videoScopes,
  topicScopes,
  initialSummary,
  initialTodaysCards,
  autoStartTodaysReview = false,
}: ReviewSessionProps) {
  const [phase, setPhase] = useState<SessionPhase>("select-mode");
  const [mode, setMode] = useState<ReviewMode | null>(null);
  const [scopeId, setScopeId] = useState<string | null>(null);
  const [scopeLabel, setScopeLabel] = useState("");
  const [deck, setDeck] = useState<ReviewDeckCard[]>([]);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState(initialSummary);
  const [shownIds, setShownIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const reviewReset = useReviewReset();
  const unsureReinserts = useRef(new Map<string, number>());
  const deferredUnsureIds = useRef(new Set<string>());
  const autoStarted = useRef(false);
  const preloadedTodaysCards = useRef<ReviewDeckCard[] | null>(
    initialTodaysCards
  );

  const currentCard = deck[index] ?? null;

  const resetSession = useCallback(() => {
    setPhase("select-mode");
    setMode(null);
    setScopeId(null);
    setScopeLabel("");
    setDeck([]);
    setIndex(0);
    setError(null);
    setShownIds([]);
    unsureReinserts.current = new Map();
    deferredUnsureIds.current = new Set();
  }, []);

  const refreshSummary = useCallback(async (exclude: string[] = []) => {
    const next = await getTodaysReviewSummary(exclude);
    setSummary(next);
    return next;
  }, []);

  const backToScopePicker = useCallback(() => {
    void flushDeferredUnsureSchedules([...deferredUnsureIds.current]);
    deferredUnsureIds.current = new Set();
    setPhase("pick-scope");
    setScopeId(null);
    setScopeLabel("");
    setDeck([]);
    setIndex(0);
    setError(null);
  }, []);

  const startTodaysReview = useCallback(
    (excludeIds: string[] = []) => {
      const preloaded =
        excludeIds.length === 0 ? preloadedTodaysCards.current : null;
      if (preloaded) {
        preloadedTodaysCards.current = null;
        setMode("todays_review");
        setScopeId(TODAYS_REVIEW_SCOPE_ID);
        setScopeLabel("Today's Review");
        setDeck(preloaded);
        setShownIds(preloaded.map((card) => card.id));
        setIndex(0);
        unsureReinserts.current = new Map();
        setPhase(
          preloaded.length > 0
            ? "reviewing"
            : initialSummary.isCaughtUp
              ? "caught-up"
              : "complete"
        );
        return;
      }

      startTransition(async () => {
        setError(null);
        const result = await buildTodaysReviewDeck(excludeIds);
        setSummary(result.summary);
        setMode("todays_review");
        setScopeId(TODAYS_REVIEW_SCOPE_ID);
        setScopeLabel("Today's Review");
        setDeck(result.cards);
        setShownIds((current) => [
          ...current,
          ...result.cards.map((card) => card.id),
        ]);
        setIndex(0);
        unsureReinserts.current = new Map();

        if (result.cards.length > 0) {
          setPhase("reviewing");
        } else if (result.summary.isCaughtUp) {
          setPhase("caught-up");
        } else {
          setPhase("complete");
        }
      });
    },
    [initialSummary.isCaughtUp]
  );

  useEffect(() => {
    if (!reviewReset) return;
    return reviewReset.registerReset(resetSession);
  }, [reviewReset, resetSession]);

  useEffect(() => {
    if (!autoStartTodaysReview || autoStarted.current) return;
    autoStarted.current = true;
    startTodaysReview();
  }, [autoStartTodaysReview, startTodaysReview]);

  function handleSelectMode(nextMode: ReviewMode) {
    if (nextMode === "todays_review") {
      startTodaysReview(shownIds);
      return;
    }
    setMode(nextMode);
    setPhase("pick-scope");
    setError(null);
  }

  function handlePickScope(nextScopeId: string) {
    if (!mode) return;

    startTransition(async () => {
      setError(null);
      const result = await loadReviewDeck(mode, nextScopeId);
      setScopeId(nextScopeId);
      setScopeLabel(result.scopeLabel);
      setDeck(result.cards);
      setIndex(0);
      setPhase(result.cards.length > 0 ? "reviewing" : "complete");
    });
  }

  function handleRate(rating: ReviewRating) {
    if (!mode || !scopeId || !currentCard) return;

    startTransition(async () => {
      const expressionId = currentCard.id;
      let deferSchedule = false;

      if (rating === "unsure" && mode === "todays_review") {
        const count = unsureReinserts.current.get(expressionId) ?? 0;
        if (shouldReinsertUnsure(count)) {
          deferSchedule = true;
          deferredUnsureIds.current.add(expressionId);
          unsureReinserts.current.set(expressionId, count + 1);
        }
      }

      const result = await submitReviewRating(
        expressionId,
        rating,
        mode,
        scopeId,
        { deferSchedule }
      );

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (rating !== "unsure" || !deferSchedule) {
        deferredUnsureIds.current.delete(expressionId);
      }

      if (rating === "unsure" && deferSchedule) {
        const gap = unsureReinsertGap();
        const nextDeck = insertCardAtGap(deck, index, currentCard, gap);
        setDeck(nextDeck);
        setIndex(index + 1);
        return;
      }

      const nextIndex = index + 1;
      if (nextIndex >= deck.length) {
        await flushDeferredUnsureSchedules([...deferredUnsureIds.current]);
        deferredUnsureIds.current = new Set();
        const nextSummary = await refreshSummary(shownIds);
        if (mode === "todays_review" && nextSummary.canContinueToday) {
          setPhase("caught-up");
        } else {
          setPhase("complete");
        }
      } else {
        setIndex(nextIndex);
      }
    });
  }

  function handleContinueToday() {
    startTodaysReview(shownIds);
  }

  const scopeOptions = mode === "video" ? videoScopes : topicScopes;
  const fillCompleteArea = phase === "complete" || phase === "caught-up";

  return (
    <div
      className={`flex min-w-0 flex-col ${
        phase === "select-mode" || fillCompleteArea
          ? "min-h-0 flex-1"
          : "gap-4"
      }`}
    >
      {phase === "select-mode" ? (
        <>
          <div className="min-h-0 flex-1" aria-hidden="true" />
          <div className="relative z-10 shrink-0">
            <ReviewModeSelector
              phase="select-mode"
              mode={mode}
              todaysReviewLabel={summary.displayLabel}
              onSelectMode={handleSelectMode}
              onBack={resetSession}
            />
          </div>
          <div className="min-h-0 flex-1" aria-hidden="true" />
          <ReviewEmptyDecoration visible fillRemaining={false} />
        </>
      ) : (
      <div
        className={`relative z-10 ${
          fillCompleteArea
            ? "flex min-h-0 flex-1 flex-col"
            : "shrink-0 space-y-6"
        }`}
      >
        {(phase === "reviewing" ||
          phase === "complete" ||
          phase === "caught-up") && (
          <ReviewModeSelector
            phase="active"
            mode={mode}
            todaysReviewLabel={summary.displayLabel}
            onSelectMode={handleSelectMode}
            onBack={
              mode === "todays_review" ? resetSession : backToScopePicker
            }
          />
        )}

        {phase === "pick-scope" && mode && (
          <ReviewScopePicker
            title={mode === "video" ? "Choose a video" : "Choose a topic"}
            options={scopeOptions}
            onSelect={handlePickScope}
            onBack={resetSession}
          />
        )}

        {phase === "reviewing" && currentCard && mode && (
          <div>
            <p className="mb-4 text-center text-xs text-[#222222] opacity-60">
              {index + 1} / {deck.length}
            </p>
            <ReviewCard card={currentCard} mode={mode} onRate={handleRate} />
          </div>
        )}

        {phase === "caught-up" && (
          <div className="mt-8 shrink-0 text-center">
            <p className="text-[0.875rem] text-[#222222]">
              🎉 You&apos;re all caught up.
            </p>
            {summary.canContinueToday && (
              <button
                type="button"
                onClick={handleContinueToday}
                className="mt-3 text-sm font-medium text-[#222222] underline opacity-90"
              >
                Continue Today
              </button>
            )}
            {summary.dueEligible > (summary.budget || summary.sliceSize) && (
              <p className="mt-2 text-xs text-[#222222] opacity-60">
                Continue later
              </p>
            )}
          </div>
        )}

        {phase === "complete" && (
          <>
            <div className="mt-8 shrink-0 text-center">
              <p className="text-[0.875rem] text-[#222222]">You have completed.</p>
              <button
                type="button"
                onClick={resetSession}
                className="mt-3 text-sm text-[#222222] underline opacity-80"
              >
                choose another mode
              </button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center py-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/review/congrats.png"
                alt=""
                className="w-full max-w-[400px] object-contain"
                aria-hidden="true"
              />
            </div>
          </>
        )}

        {isPending && (
          <p className="text-center text-xs text-[#222222] opacity-50">Loading…</p>
        )}

        {error && (
          <p className="text-center text-xs text-[#6B4242]">{error}</p>
        )}
      </div>
      )}
    </div>
  );
}
