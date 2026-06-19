-- Allow service_role (server-side import) to read/write Phase 1 tables.
-- RLS is bypassed for service_role; table-level GRANT is still required.

grant all on table public.videos to service_role;
grant all on table public.transcripts to service_role;
