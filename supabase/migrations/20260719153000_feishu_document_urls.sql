-- Phase 6: explicit Feishu document URLs for sync discovery
-- (drive/v1/files lists the app root only — collaborator docs do not appear there)

alter table public.user_settings
  add column if not exists feishu_document_urls text;
