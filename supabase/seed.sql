-- Seed data for local development.
-- Run after migrations: supabase db reset (includes seed.sql)

insert into public.videos (id, title, youtube_url, source)
values (
  '00000000-0000-0000-0000-000000000001',
  'Sample Video',
  null,
  'manual'
);

insert into public.transcripts (id, video_id, raw_text, cleaned_text)
values (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Hello, this is a sample transcript for local development.',
  null
);
