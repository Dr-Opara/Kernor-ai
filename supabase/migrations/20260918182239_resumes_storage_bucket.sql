-- Provisions the `resumes` storage bucket so a fresh environment built from
-- migrations alone is functional without manually creating it in the
-- dashboard. Configuration values (public/private, size limit, allowed MIME
-- types) were read directly from the existing remote bucket via the
-- Supabase Management API, not guessed.
--
-- Idempotent: safe to run against an environment where the bucket already
-- exists (converges its config to match rather than erroring or skipping).
--
-- RLS policies on storage.objects for this bucket (resume_files_select_own,
-- resume_files_insert_own, resume_files_update_own, resume_files_delete_own)
-- already exist from the baseline migration and are untouched here.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  10485760,
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
