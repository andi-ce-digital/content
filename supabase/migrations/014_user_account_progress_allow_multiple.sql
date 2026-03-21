-- Mehrere Zeilen pro user_account_id erlauben (z. B. Verlauf / Snapshots pro Sync).
-- Entfernt UNIQUE(user_account_id).

ALTER TABLE public.user_account_progress
  DROP CONSTRAINT IF EXISTS user_account_progress_user_account_id_key;

CREATE INDEX IF NOT EXISTS idx_user_account_progress_account_created
  ON public.user_account_progress (user_account_id, created_at DESC)
  TABLESPACE pg_default;

COMMENT ON TABLE public.user_account_progress IS
  'Profil-Metadaten / Sync-Snapshots zum eigenen user_account; mehrere Zeilen pro Account möglich (Verlauf).';
