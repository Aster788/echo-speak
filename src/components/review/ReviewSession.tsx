"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import {
  TODAYS_REVIEW_SCOPE_ID,
} from "@/lib/review-constants";
import {
  clearTodaysReviewSession,
  isResumableTodaysReviewSession,
  loadTodaysReviewSession,
  localDateKey,
  resumeIndexAfterMissingCards,
  saveTodaysReviewSession,
  type PersistedTodaysReviewSession,
} from "@/lib/todays-review-session";
import {
  buildTodaysReviewDeck,
  flushDeferredUnsureSchedules,
  getTodaysReviewSummary,
  loadReviewDeck,
  loadTodaysReviewCardsByIds,
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
  const ratingInFlight = useRef(false);
  const deckRef = useRef(deck);
  const indexRef = useRef(index);
  const shownIdsRef = useRef(shownIds);
  const modeRef = useRef(mode);
  const phaseRef = useRef(phase);

  deckRef.current = deck;
  indexRef.current = index;
  shownIdsRef.current = shownIds;
  modeRef.current = mode;
  phaseRef.current = phase;

  const currentCard = deck[index] ?? null;

  const persistTodaysSession = useCallback(
    (
      nextDeck: ReviewDeckCard[],
      nextIndex: number,
      nextShownIds: string[]
    ) => {
      if (modeRef.current !== "todays_review") return;
      if (nextIndex >= nextDeck.length) {
        clearTodaysReviewSession();
        return;
      }
      const session: PersistedTodaysReviewSession = {
        dateKey: localDateKey(),
        deckIds: nextDeck.map((card) => card.id),
        index: nextIndex,
        shownIds: nextShownIds,
        deferredUnsureIds: [...deferredUnsureIds.current],
        unsureReinsertCounts: Object.fromEntries(unsureReinserts.current),
      };
      saveTodaysReviewSession(session);
    },
    []
  );

  const clearPersistedTodaysSession = useCallback(() => {
    clearTodaysReviewSession();
  }, []);

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
    ratingInFlight.current = false;
    // Keep localStorage session so "Today's Review" can resume after leaving.
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
    ratingInFlight.current = false;
  }, []);

  const applyTodaysDeck = useCallback(
    (
      cards: ReviewDeckCard[],
      nextShownIds: string[],
      nextIndex: number,
      nextSummary?: TodaysReviewSummary
    ) => {
      if (nextSummary) setSummary(nextSummary);
      setMode("todays_review");
      setScopeId(TODAYS_REVIEW_SCOPE_ID);
      setScopeLabel("Today's Review");
      setDeck(cards);
      setShownIds(nextShownIds);
      setIndex(nextIndex);
      setError(null);

      if (cards.length > 0 && nextIndex < cards.length) {
        setPhase("reviewing");
        persistTodaysSession(cards, nextIndex, nextShownIds);
        return;
      }

      clearPersistedTodaysSession();
      setPhase(nextSummary?.isCaughtUp ? "caught-up" : "complete");
    },
    [clearPersistedTodaysSession, persistTodaysSession]
  );

  const resumeTodaysReview = useCallback(async (): Promise<boolean> => {
    const saved = loadTodaysReviewSession();
    if (!isResumableTodaysReviewSession(saved)) return false;

    const cards = await loadTodaysReviewCardsByIds(saved.deckIds);
    const availableIds = new Set(cards.map((card) => card.id));
    if (availableIds.size === 0) {
      clearPersistedTodaysSession();
      return false;
    }

    const uniqueOrder = [...new Set(saved.deckIds)].filter((id) =>
      availableIds.has(id)
    );
    const byId = new Map(cards.map((card) => [card.id, card]));
    const resumedDeck = saved.deckIds
      .map((id) => byId.get(id))
      .filter((card): card is ReviewDeckCard => Boolean(card));
    const nextIndex = resumeIndexAfterMissingCards(
      saved.deckIds,
      saved.index,
      availableIds
    );

    if (nextIndex >= resumedDeck.length) {
      clearPersistedTodaysSession();
      return false;
    }

    unsureReinserts.current = new Map(
      Object.entries(saved.unsureReinsertCounts)
    );
    deferredUnsureIds.current = new Set(
      saved.deferredUnsureIds.filter((id) => availableIds.has(id))
    );

    const nextShownIds =
      saved.shownIds.length > 0
        ? saved.shownIds.filter((id) => availableIds.has(id))
        : uniqueOrder;

    applyTodaysDeck(resumedDeck, nextShownIds, nextIndex);
    return true;
  }, [applyTodaysDeck, clearPersistedTodaysSession]);

  const startTodaysReview = useCallback(
    (excludeIds: string[] = []) => {
      const beginFreshDeck = async (idsToExclude: string[]) => {
        setError(null);
        const preloaded =
          idsToExclude.length === 0 ? preloadedTodaysCards.current : null;
        if (preloaded) {
          preloadedTodaysCards.current = null;
          unsureReinserts.current = new Map();
          deferredUnsureIds.current = new Set();
          applyTodaysDeck(
            preloaded,
            [
              ...new Set([
                ...idsToExclude,
                ...preloaded.map((card) => card.id),
              ]),
            ],
            0,
            initialSummary
          );
          return;
        }

        const result = await buildTodaysReviewDeck(idsToExclude);
        unsureReinserts.current = new Map();
        deferredUnsureIds.current = new Set();
        applyTodaysDeck(
          result.cards,
          [
            ...new Set([
              ...idsToExclude,
              ...result.cards.map((card) => card.id),
            ]),
          ],
          0,
          result.summary
        );
      };

      // Fresh start (not Continue Today): resume unfinished local session.
      if (excludeIds.length === 0) {
        const saved = loadTodaysReviewSession();
        if (isResumableTodaysReviewSession(saved)) {
          startTransition(async () => {
            const resumed = await resumeTodaysReview();
            if (!resumed) await beginFreshDeck([]);
          });
          return;
        }
      }

      startTransition(async () => {
        await beginFreshDeck(excludeIds);
      });
    },
    [applyTodaysDeck, initialSummary, resumeTodaysReview]
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

  // Flush deferred unsure schedules if the tab is closing mid-session.
  useEffect(() => {
    function flushOnHide() {
      if (modeRef.current !== "todays_review") return;
      if (phaseRef.current !== "reviewing") return;
      const ids = [...deferredUnsureIds.current];
      if (ids.length === 0) return;
      void flushDeferredUnsureSchedules(ids);
      // Keep ids in the persisted session; server schedule is already written.
      deferredUnsureIds.current = new Set();
      persistTodaysSession(
        deckRef.current,
        indexRef.current,
        shownIdsRef.current
      );
    }

    function onPageHide() {
      flushOnHide();
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") flushOnHide();
    }

    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [persistTodaysSession]);

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
    if (ratingInFlight.current) return;
    ratingInFlight.current = true;

    const expressionId = currentCard.id;
    const ratedCard = currentCard;
    const ratedIndex = index;
    const ratedDeck = deck;
    let deferSchedule = false;

    if (rating === "unsure" && mode === "todays_review") {
      const count = unsureReinserts.current.get(expressionId) ?? 0;
      if (shouldReinsertUnsure(count)) {
        deferSchedule = true;
        deferredUnsureIds.current.add(expressionId);
        unsureReinserts.current.set(expressionId, count + 1);
      }
    }

    let nextDeck = ratedDeck;
    let nextIndex = ratedIndex + 1;
    let finished = false;

    if (rating === "unsure" && deferSchedule) {
      const gap = unsureReinsertGap();
      nextDeck = insertCardAtGap(ratedDeck, ratedIndex, ratedCard, gap);
      nextIndex = ratedIndex + 1;
    } else {
      deferredUnsureIds.current.delete(expressionId);
      if (nextIndex >= ratedDeck.length) {
        finished = true;
      }
    }

    // Mid-deck: advance UI immediately so the next card opens on Chinese
    // without waiting on the server or flipping this card back to Chinese.
    if (!finished) {
      setDeck(nextDeck);
      setIndex(nextIndex);
      if (mode === "todays_review") {
        persistTodaysSession(nextDeck, nextIndex, shownIds);
      }
    } else {
      clearPersistedTodaysSession();
    }

    startTransition(async () => {
      const result = await submitReviewRating(
        expressionId,
        rating,
        mode,
        scopeId,
        { deferSchedule }
      );

      if (!result.ok) {
        setDeck(ratedDeck);
        setIndex(ratedIndex);
        setPhase("reviewing");
        setError(result.error);
        if (mode === "todays_review") {
          persistTodaysSession(ratedDeck, ratedIndex, shownIds);
        }
        ratingInFlight.current = false;
        return;
      }

      if (finished) {
        await flushDeferredUnsureSchedules([...deferredUnsureIds.current]);
        deferredUnsureIds.current = new Set();
        clearPersistedTodaysSession();
        const nextSummary = await refreshSummary(shownIds);
        if (mode === "todays_review" && nextSummary.canContinueToday) {
          setPhase("caught-up");
        } else {
          setPhase("complete");
        }
      }

      ratingInFlight.current = false;
    });
  }

  function handleContinueToday() {
    clearPersistedTodaysSession();
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
            <ReviewCard
              key={currentCard.id + ":" + index}
              card={currentCard}
              mode={mode}
              onRate={handleRate}
            />
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
