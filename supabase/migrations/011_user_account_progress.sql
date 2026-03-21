-- Profil-Kerndaten pro eigenem User-Account (ohne Post-/Content-Felder).
-- Mehrere Zeilen pro user_account möglich (Snapshots / Verlauf).

CREATE TABLE IF NOT EXISTS public.user_account_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  user_account_id uuid NOT NULL REFERENCES public.user_accounts (id) ON DELETE CASCADE,

  platform text NOT NULL,
  handle text NOT NULL,

  -- Anzeige / Name
  display_name text,
  full_name text,

  -- Profiltext & Links
  biography text,
  external_link text,
  website text,

  -- Zahlen
  followers integer,
  following integer,
  posts_count integer,

  -- Visuelles / Status
  profile_picture_url text,
  verified boolean DEFAULT false,
  is_private boolean,
  is_business boolean,
  niche text,
  category text,
  language text,

  -- Verwandte Accounts (JSON flexibler als text[] für strukturierte n8n-Daten)
  related_profiles jsonb,

  -- Vollständiger Roh-Stand vom Scraper (optional)
  raw_snapshot jsonb,

  -- Sync / Herkunft
  sync_status text DEFAULT 'pending',
  sync_error text,
  last_synced_at timestamptz,
  source text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT user_account_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_account_progress_sync_status_check
    CHECK (sync_status IS NULL OR sync_status IN ('pending', 'syncing', 'complete', 'failed'))
);

CREATE OR REPLACE FUNCTION public.sync_user_account_progress_user_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT ua.user_id INTO v_owner
  FROM public.user_accounts ua
  WHERE ua.id = NEW.user_account_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'user_account_id % not found', NEW.user_account_id;
  END IF;

  IF NEW.user_id IS NOT NULL AND NEW.user_id <> v_owner THEN
    RAISE EXCEPTION 'user_id does not match user_accounts.user_id for this user_account_id';
  END IF;

  NEW.user_id := v_owner;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_user_account_progress_user_id ON public.user_account_progress;
CREATE TRIGGER trg_sync_user_account_progress_user_id
  BEFORE INSERT OR UPDATE OF user_account_id, user_id
  ON public.user_account_progress
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_account_progress_user_id ();

CREATE OR REPLACE FUNCTION public.set_user_account_progress_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_account_progress_updated_at ON public.user_account_progress;
CREATE TRIGGER trg_user_account_progress_updated_at
  BEFORE UPDATE ON public.user_account_progress
  FOR EACH ROW
  EXECUTE FUNCTION set_user_account_progress_updated_at ();

CREATE INDEX IF NOT EXISTS idx_user_account_progress_user_id
  ON public.user_account_progress (user_id)
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_account_progress_platform_handle
  ON public.user_account_progress (platform, handle)
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_account_progress_account_created
  ON public.user_account_progress (user_account_id, created_at DESC)
  TABLESPACE pg_default;

ALTER TABLE public.user_account_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own user_account_progress" ON public.user_account_progress;
CREATE POLICY "Users manage own user_account_progress"
  ON public.user_account_progress
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.user_account_progress IS
  'Profil-Metadaten / Snapshots zum eigenen user_account; mehrere Zeilen pro Account möglich.';
