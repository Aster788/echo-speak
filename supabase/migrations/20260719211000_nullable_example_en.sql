-- Feishu table lemmas have no example sentence; allow null instead of mirroring phrase.

alter table public.expressions
  alter column example_en drop not null;
