-- Phase 1: videos + transcripts (Echo Speak Foundation)

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  youtube_url text,
  source text not null default 'manual' check (source in ('youtube', 'manual')),
  created_at timestamptz not null default now()
);

create table public.transcripts (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos (id) on delete cascade,
  raw_text text not null,
  cleaned_text text,
  created_at timestamptz not null default now()
);

create index transcripts_video_id_idx on public.transcripts (video_id);

alter table public.videos enable row level security;
alter table public.transcripts enable row level security;

create policy "Authenticated users can select videos"
  on public.videos
  for select
  to authenticated
  using (true);

create policy "Authenticated users can insert videos"
  on public.videos
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update videos"
  on public.videos
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete videos"
  on public.videos
  for delete
  to authenticated
  using (true);

create policy "Authenticated users can select transcripts"
  on public.transcripts
  for select
  to authenticated
  using (true);

create policy "Authenticated users can insert transcripts"
  on public.transcripts
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update transcripts"
  on public.transcripts
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete transcripts"
  on public.transcripts
  for delete
  to authenticated
  using (true);
