-- Gleicher Post (user_id + source_url) soll per Upsert aktualisiert werden statt 409 bei INSERT.
-- Partieller Unique-Index ist für manche Clients (n8n „Create row“) ungünstig;
-- UNIQUE (user_id, source_url) erlaubt PostgREST/Supabase Upsert mit onConflict.

DROP INDEX IF EXISTS public.idx_user_account_content_user_source;

ALTER TABLE public.user_account_content
  DROP CONSTRAINT IF EXISTS user_account_content_user_id_source_url_key;

ALTER TABLE public.user_account_content
  ADD CONSTRAINT user_account_content_user_id_source_url_key
  UNIQUE (user_id, source_url);

COMMENT ON CONSTRAINT user_account_content_user_id_source_url_key ON public.user_account_content IS
  'Ein Post pro User+source_url; in n8n: Supabase „Upsert“ nutzen (nicht „Create“), onConflict: user_id,source_url.';
