-- Phase 5: allow Today's Review mode in review_history analytics.

alter table public.review_history
  drop constraint if exists review_history_mode_check;

alter table public.review_history
  add constraint review_history_mode_check
  check (mode in ('video', 'topic', 'todays_review'));
