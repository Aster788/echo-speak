-- Pre-Phase 5: multi-example support for expression merge.
-- Stores an array of {en, zh} so multiple examples can live on one row.

alter table public.expressions
  add column if not exists examples jsonb default null;

comment on column public.expressions.examples is
  'Array of {en: string, zh: string|null}. Null = legacy single example (use example_en/example_zh).';
