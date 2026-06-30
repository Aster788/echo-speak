-- Pre-Phase 5: review_queue table schema (SRS scheduling deferred to Phase 5).

create table if not exists public.review_queue (
  id uuid primary key default gen_random_uuid(),
  expression_id uuid not null references public.expressions (id) on delete cascade,
  due_at timestamptz not null,
  source text not null default 'transcript',
  created_at timestamptz not null default now()
);

create index if not exists review_queue_due_at_idx on public.review_queue (due_at);
create index if not exists review_queue_expression_id_idx on public.review_queue (expression_id);

alter table public.review_queue enable row level security;

drop policy if exists "Users can select own review queue" on public.review_queue;
create policy "Users can select own review queue"
  on public.review_queue for select to authenticated
  using (true);

drop policy if exists "Users can insert own review queue" on public.review_queue;
create policy "Users can insert own review queue"
  on public.review_queue for insert to authenticated
  with check (true);

grant all on table public.review_queue to service_role;
grant select, insert on table public.review_queue to authenticated;
