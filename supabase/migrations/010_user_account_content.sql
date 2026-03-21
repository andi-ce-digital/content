-- Content für die eigenen User-Accounts (user_accounts), parallel zu content_items (Creator-/Referenz-Content).
-- Verknüpfung: user_account_id -> public.user_accounts

CREATE TABLE IF NOT EXISTS public.user_account_content (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_account_id uuid NOT NULL REFERENCES public.user_accounts (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,

  platform text NOT NULL,
  creator_name text,
  creator_handle text,
  source_url text,
  content_type text,
  title text,
  caption text,
  transcript text,
  hook text,
  first_sentence text,
  cta text,
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  duration_seconds real,
  topic text,
  content_angle text,
  hook_type text,
  framework_type text,
  engagement_rate numeric,
  performance_score numeric,
  published_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  platform_post_id text,
  shortcode text,
  media_url text,
  thumbnail_url text,
  creator_followers integer,
  creator_profile_url text,
  hashtags text[],
  mentions text[],
  tagged_users text[],
  location_name text,
  location_id text,
  video_view_count integer,
  video_duration numeric,
  thumbnail_width integer,
  thumbnail_height integer,
  hook_framework text,
  opening_line text,
  main_message text,
  primary_pain_point text,
  primary_desire text,
  viral_trigger text,
  storytelling_type text,
  content_stage text,
  content_format text,
  target_audience text,
  emotion text,
  pattern_interrupts text[],
  cta_source text,
  hook_strength_score integer,
  viral_potential_score integer,
  like_rate numeric,
  comment_rate numeric,
  save_rate numeric,
  share_rate numeric,
  reach_ratio numeric,
  transcript_detail jsonb,
  hook_start numeric,
  hook_end numeric,
  hook_duration numeric,
  cta_start numeric,
  cta_end numeric,
  body_duration numeric,
  time_to_hook numeric,

  CONSTRAINT user_account_content_pkey PRIMARY KEY (id)
);

-- user_id immer aus user_accounts ableiten (Konsistenz mit user_account_id)
CREATE OR REPLACE FUNCTION public.sync_user_account_content_user_id()
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

DROP TRIGGER IF EXISTS trg_sync_user_account_content_user_id ON public.user_account_content;
CREATE TRIGGER trg_sync_user_account_content_user_id
  BEFORE INSERT OR UPDATE OF user_account_id, user_id
  ON public.user_account_content
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_account_content_user_id ();

-- Optional: gleiche Metrik-Berechnung wie bei content_items (falls Funktion existiert)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'calculate_content_metrics'
  ) THEN
    DROP TRIGGER IF EXISTS calculate_content_metrics_trigger ON public.user_account_content;
    CREATE TRIGGER calculate_content_metrics_trigger
      BEFORE INSERT OR UPDATE OF views, likes, comments, shares, duration_seconds
      ON public.user_account_content
      FOR EACH ROW
      EXECUTE FUNCTION calculate_content_metrics ();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_account_content_platform
  ON public.user_account_content
  USING btree (platform)
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_account_content_creator_handle
  ON public.user_account_content
  USING btree (creator_handle)
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_account_content_hook_type
  ON public.user_account_content
  USING btree (hook_type)
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_account_content_pain_point
  ON public.user_account_content
  USING btree (primary_pain_point)
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_account_content_stage
  ON public.user_account_content
  USING btree (content_stage)
  TABLESPACE pg_default;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_account_content_user_source
  ON public.user_account_content
  USING btree (user_id, source_url)
  TABLESPACE pg_default
  WHERE user_id IS NOT NULL AND source_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_account_content_user_id
  ON public.user_account_content
  USING btree (user_id)
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_account_content_user_account_id
  ON public.user_account_content
  USING btree (user_account_id)
  TABLESPACE pg_default;

ALTER TABLE public.user_account_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own user_account_content" ON public.user_account_content;
CREATE POLICY "Users can manage own user_account_content"
  ON public.user_account_content
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.user_account_content IS
  'Posts/Content der eigenen verknüpften Accounts (user_accounts); Spiegel von content_items-Struktur.';
