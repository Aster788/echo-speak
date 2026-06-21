-- Phase 3: hierarchical topics + expressions

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references public.topics (id) on delete restrict,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create index topics_parent_id_idx on public.topics (parent_id);

create table public.expressions (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos (id) on delete cascade,
  phrase text not null,
  meaning text not null,
  example text not null,
  topic_id uuid not null references public.topics (id) on delete restrict,
  source_type text not null default 'transcript'
    check (source_type in ('transcript', 'feishu')),
  weight numeric not null default 1.0,
  created_at timestamptz not null default now()
);

create index expressions_video_id_idx on public.expressions (video_id);
create index expressions_topic_id_idx on public.expressions (topic_id);

-- Seed system topics (see src/lib/topic-seeds.ts)
insert into public.topics (name, slug, parent_id, is_system) values
  ('Food', 'food', null, true),
  ('Workout', 'workout', null, true),
  ('Travel', 'travel', null, true),
  ('Shopping', 'shopping', null, true),
  ('Productivity', 'productivity', null, true),
  ('Daily', 'daily', null, true),
  ('Work', 'work', null, true),
  ('Social', 'social', null, true),
  ('Uncategorized', 'uncategorized', null, true);

insert into public.topics (name, slug, parent_id, is_system)
select 'Drinks', 'drinks', id, true from public.topics where slug = 'food';

insert into public.topics (name, slug, parent_id, is_system)
select 'Cooking', 'cooking', id, true from public.topics where slug = 'food';

insert into public.topics (name, slug, parent_id, is_system)
select 'Dining Out', 'dining-out', id, true from public.topics where slug = 'food';

insert into public.topics (name, slug, parent_id, is_system)
select 'Grocery', 'grocery', id, true from public.topics where slug = 'food';

insert into public.topics (name, slug, parent_id, is_system)
select 'Gym', 'gym', id, true from public.topics where slug = 'workout';

insert into public.topics (name, slug, parent_id, is_system)
select 'Recovery', 'recovery', id, true from public.topics where slug = 'workout';

insert into public.topics (name, slug, parent_id, is_system)
select 'Packing', 'packing', id, true from public.topics where slug = 'travel';

insert into public.topics (name, slug, parent_id, is_system)
select 'Airport', 'airport', id, true from public.topics where slug = 'travel';

insert into public.topics (name, slug, parent_id, is_system)
select 'Hotel', 'hotel', id, true from public.topics where slug = 'travel';

alter table public.topics enable row level security;
alter table public.expressions enable row level security;

create policy "Authenticated users can select topics"
  on public.topics for select to authenticated using (true);

create policy "Authenticated users can insert topics"
  on public.topics for insert to authenticated with check (true);

create policy "Authenticated users can update topics"
  on public.topics for update to authenticated using (true) with check (true);

create policy "Authenticated users can delete topics"
  on public.topics for delete to authenticated using (true);

create policy "Authenticated users can select expressions"
  on public.expressions for select to authenticated using (true);

create policy "Authenticated users can insert expressions"
  on public.expressions for insert to authenticated with check (true);

create policy "Authenticated users can update expressions"
  on public.expressions for update to authenticated using (true) with check (true);

create policy "Authenticated users can delete expressions"
  on public.expressions for delete to authenticated using (true);

grant all on table public.topics to service_role;
grant all on table public.expressions to service_role;
