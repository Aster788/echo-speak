export const DAILY_REVIEW_BUDGET_OPTIONS = [10, 20, 30, 40, 50, 0] as const;

export type DailyReviewBudget = (typeof DAILY_REVIEW_BUDGET_OPTIONS)[number];

export const DEFAULT_DAILY_REVIEW_BUDGET: DailyReviewBudget = 40;

/** 0 means unlimited */
export function effectiveBudgetCap(budget: number): number | null {
  if (budget === 0) return null;
  return budget;
}

export function formatBudgetLabel(budget: number): string {
  return budget === 0 ? "Unlimited" : String(budget);
}

export function isValidDailyReviewBudget(value: number): value is DailyReviewBudget {
  return (DAILY_REVIEW_BUDGET_OPTIONS as readonly number[]).includes(value);
}
