"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import {
  loadReviewDeck,
  submitReviewRating,
} from "@/app/review/actions";
import { ReviewCard } from "@/components/review/ReviewCard";
import { ReviewEmptyDecoration } from "@/components/review/ReviewEmptyDecoration";
import { ReviewModeSelector } from "@/components/review/ReviewModeSelector";
import { ReviewScopePicker } from "@/components/review/ReviewScopePicker";
import { useReviewReset } from "@/components/review/ReviewResetContext";
import type {
  ReviewDeckCard,
  ReviewMode,
  ReviewRating,
  ReviewScopeOption,
} from "@/types/review";

type SessionPhase = "select-mode" | "pick-scope" | "reviewing" | "complete";

type ReviewSessionProps = {
  videoScopes: ReviewScopeOption[];
  topicScopes: ReviewScopeOption[];
};

export function ReviewSession({
  videoScopes,
  topicScopes,
}: ReviewSessionProps) {
  const [phase, setPhase] = useState<SessionPhase>("select-mode");
  const [mode, setMode] = useState<ReviewMode | null>(null);
  const [scopeId, setScopeId] = useState<string | null>(null);
  const [scopeLabel, setScopeLabel] = useState("");
  const [deck, setDeck] = useState<ReviewDeckCard[]>([]);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const reviewReset = useReviewReset();

  const currentCard = deck[index] ?? null;
  const showDecoration = phase === "select-mode";

  const resetSession = useCallback(() => {
    setPhase("select-mode");
    setMode(null);
    setScopeId(null);
    setScopeLabel("");
    setDeck([]);
    setIndex(0);
    setError(null);
  }, []);

  useEffect(() => {
    if (!reviewReset) return;
    return reviewReset.registerReset(resetSession);
  }, [reviewReset, resetSession]);

  function handleSelectMode(nextMode: ReviewMode) {
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
      const result = await submitReviewRating(
        currentCard.id,
        rating,
        mode,
        scopeId
      );

      if (!result.ok) {
        setError(result.error);
        return;
      }

      const nextIndex = index + 1;
      if (nextIndex >= deck.length) {
        setPhase("complete");
      } else {
        setIndex(nextIndex);
      }
    });
  }

  const scopeOptions = mode === "video" ? videoScopes : topicScopes;
  const fillDecorationArea = phase === "select-mode";

  return (
    <div
      className={`flex min-w-0 flex-col ${
        fillDecorationArea ? "min-h-0 flex-1 justify-center gap-6" : "gap-4"
      }`}
    >
      <div className="relative z-10 shrink-0 space-y-6">
        {(phase === "select-mode" ||
          phase === "reviewing" ||
          phase === "complete") && (
          <ReviewModeSelector
            phase={
              phase === "reviewing" || phase === "complete" ? "active" : "select-mode"
            }
            mode={mode}
            onSelectMode={handleSelectMode}
            onBack={resetSession}
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

        {phase === "complete" && (
          <div className="text-center">
            <p className="text-[0.875rem] text-[#222222]">
              {deck.length === 0
                ? "No cards in this scope yet."
                : "You have finished this deck."}
            </p>
            <button
              type="button"
              onClick={resetSession}
              className="mt-4 text-sm text-[#222222] underline opacity-80"
            >
              Choose another mode
            </button>
          </div>
        )}

        {isPending && (
          <p className="text-center text-xs text-[#222222] opacity-50">Loading…</p>
        )}

        {error && (
          <p className="text-center text-xs text-[#6B4242]">{error}</p>
        )}
      </div>

      <ReviewEmptyDecoration
        visible={showDecoration}
        fillRemaining={false}
      />
    </div>
  );
}
