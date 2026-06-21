-- Import deduplication: content hash + unique YouTube URL

alter table public.transcripts
  add column content_hash text;

create unique index transcripts_content_hash_key
  on public.transcripts (content_hash)
  where content_hash is not null;

create unique index videos_youtube_url_key
  on public.videos (youtube_url)
  where youtube_url is not null;
