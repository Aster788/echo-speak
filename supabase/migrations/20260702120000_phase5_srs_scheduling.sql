-- Phase 5: SRS scheduling columns on review_queue + daily review budget setting.

alter table public.review_queue
  add column if not exists memory_state text not null default 'learning'
    check (memory_state in ('learning', 'reviewing')),
  add column if not exists interval_days integer not null default 1,
  add column if not exists last_reviewed_at timestamptz,
  add column if not exists first_reviewed_at timestamptz;

create unique index if not exists review_queue_expression_id_unique
  on public.review_queue (expression_id);

drop policy if exists "Users can update own review queue" on public.review_queue;
create policy "Users can update own review queue"
  on public.review_queue for update to authenticated
  using (true)
  with check (true);

grant update on table public.review_queue to authenticated;

alter table public.user_settings
  add column if not exists daily_review_budget integer not null default 40
    check (daily_review_budget in (10, 20, 30, 40, 50, 0));

comment on column public.user_settings.daily_review_budget is
  'Daily Today''s Review card cap. 0 = unlimited.';
