"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  DAILY_REVIEW_BUDGET_OPTIONS,
  formatBudgetLabel,
  type DailyReviewBudget,
} from "@/lib/daily-review-budget";

type ReviewBudgetSettingsProps = {
  isAuthenticated: boolean;
  initialBudget: number;
};

const SELECT_ID = "review-budget-select";

export function ReviewBudgetSettings({
  isAuthenticated,
  initialBudget,
}: ReviewBudgetSettingsProps) {
  const selectRef = useRef<HTMLSelectElement>(null);
  const [budget, setBudget] = useState<DailyReviewBudget>(
    initialBudget as DailyReviewBudget
  );
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setBudget(initialBudget as DailyReviewBudget);
  }, [initialBudget]);

  function openPicker() {
    const select = selectRef.current;
    if (!select || select.disabled) return;
    select.focus();
    select.showPicker?.();
  }

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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[0.75rem] leading-snug text-[#222222]/80">
        Set daily card limit for today&apos;s review
      </p>
      <label htmlFor={SELECT_ID} className="relative block">
        <select
          ref={selectRef}
          id={SELECT_ID}
          value={budget}
          disabled={pending}
          onChange={(event) =>
            setBudget(Number(event.target.value) as DailyReviewBudget)
          }
          className="w-full cursor-pointer appearance-none rounded-[0.75rem] border border-[#D4D4D4] bg-white py-2 pl-3 pr-9 text-[0.8125rem] text-[#222222] disabled:opacity-50"
        >
          {DAILY_REVIEW_BUDGET_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {formatBudgetLabel(option)}
            </option>
          ))}
        </select>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Open daily card limit options"
          disabled={pending}
          onClick={(event) => {
            event.preventDefault();
            openPicker();
          }}
          className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[#D4D4D4] disabled:opacity-50"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2.5 4.5 6 8 9.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </label>
      <button
        type="button"
        disabled={pending}
        onClick={handleSave}
        className="rounded-[1rem] border-[2.5px] border-[#D4D4D4] px-4 py-2.5 text-center text-[0.8125rem] font-medium text-[#222222] transition-opacity duration-150 hover:opacity-80 disabled:opacity-50"
      >
        Save review budget
      </button>
      {message ? (
        <p className="text-center text-[0.75rem] text-[#222222]/80">{message}</p>
      ) : null}
    </div>
  );
}
