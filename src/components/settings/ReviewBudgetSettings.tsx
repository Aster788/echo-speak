"use client";

import { useEffect, useState, useTransition } from "react";
import {
  DAILY_REVIEW_BUDGET_OPTIONS,
  formatBudgetLabel,
  type DailyReviewBudget,
} from "@/lib/daily-review-budget";

type ReviewBudgetSettingsProps = {
  isAuthenticated: boolean;
  initialBudget: number;
};

export function ReviewBudgetSettings({
  isAuthenticated,
  initialBudget,
}: ReviewBudgetSettingsProps) {
  const [budget, setBudget] = useState<DailyReviewBudget>(
    initialBudget as DailyReviewBudget
  );
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setBudget(initialBudget as DailyReviewBudget);
  }, [initialBudget]);

  function handleSave() {
    if (!isAuthenticated) return;
    startTransition(async () => {
      setMessage("");
      const response = await fetch("/api/settings/review-budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      setMessage(result.ok ? "Review budget saved." : result.error ?? "Could not save.");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[0.75rem] leading-snug text-[#222222]/80">
        Daily card limit for Today&apos;s Review. Default is 40 cards (~5–15 min).
      </p>
      <label className="flex flex-col gap-1 text-[0.8125rem] text-[#222222]">
        Today&apos;s Review budget
        <select
          value={budget}
          disabled={!isAuthenticated || pending}
          onChange={(event) =>
            setBudget(Number(event.target.value) as DailyReviewBudget)
          }
          className="rounded-[0.75rem] border border-[#D4D4D4] bg-white px-3 py-2"
        >
          {DAILY_REVIEW_BUDGET_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {formatBudgetLabel(option)}
            </option>
          ))}
        </select>
      </label>
      {isAuthenticated ? (
        <button
          type="button"
          disabled={pending}
          onClick={handleSave}
          className="rounded-[1rem] border-[2.5px] border-[#D4D4D4] px-4 py-2.5 text-center text-[0.8125rem] font-medium text-[#222222] transition-opacity duration-150 hover:opacity-80 disabled:opacity-50"
        >
          Save review budget
        </button>
      ) : null}
      {message ? (
        <p className="text-center text-[0.75rem] text-[#222222]/80">{message}</p>
      ) : null}
    </div>
  );
}
