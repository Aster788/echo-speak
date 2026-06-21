-- Phase 3.5: topic curation (locks, merge audit, dismissals)

alter table public.expressions
  add column topic_locked boolean not null default false;

alter table public.topics
  add column merged_into_id uuid references public.topics (id) on delete set null;

create table public.expression_dismissals (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos (id) on delete cascade,
  phrase_key text not null,
  dismissed_at timestamptz not null default now(),
  unique (video_id, phrase_key)
);

create index expression_dismissals_video_id_idx
  on public.expression_dismissals (video_id);

alter table public.expression_dismissals enable row level security;

create policy "Authenticated users can select expression_dismissals"
  on public.expression_dismissals for select to authenticated using (true);

create policy "Authenticated users can insert expression_dismissals"
  on public.expression_dismissals for insert to authenticated with check (true);

create policy "Authenticated users can delete expression_dismissals"
  on public.expression_dismissals for delete to authenticated using (true);

grant all on table public.expression_dismissals to service_role;
