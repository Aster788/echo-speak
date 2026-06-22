-- Phase 4: bilingual examples + review history

alter table public.expressions
  rename column example to example_en;

alter table public.expressions
  add column example_zh text;

create table public.review_history (
  id uuid primary key default gen_random_uuid(),
  expression_id uuid not null references public.expressions (id) on delete cascade,
  rating text not null check (rating in ('mastered', 'again', 'unsure')),
  reviewed_at timestamptz not null default now(),
  mode text not null check (mode in ('video', 'topic')),
  scope_id uuid not null
);

create index review_history_expression_id_idx on public.review_history (expression_id);
create index review_history_reviewed_at_idx on public.review_history (reviewed_at desc);

alter table public.review_history enable row level security;

create policy "Authenticated users can select review_history"
  on public.review_history for select to authenticated using (true);

create policy "Authenticated users can insert review_history"
  on public.review_history for insert to authenticated with check (true);

grant all on table public.review_history to service_role;
