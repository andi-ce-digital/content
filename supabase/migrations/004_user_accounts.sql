-- User-provided creator accounts (Instagram/TikTok/YouTube handles)
-- Dashboard should only show once the user added at least one of these accounts.

CREATE TABLE IF NOT EXISTS public.user_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  handle text NOT NULL,
  source_url text,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT user_accounts_user_platform_handle_key
    UNIQUE (user_id, platform, handle)
);

CREATE INDEX IF NOT EXISTS idx_user_accounts_user_id
  ON public.user_accounts (user_id) TABLESPACE pg_default;

ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own user_accounts" ON public.user_accounts;
CREATE POLICY "Users can manage own user_accounts"
  ON public.user_accounts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Optional backfill: if you already had `source_accounts` from an older version,
-- copy them into `user_accounts` so existing users keep their access.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'source_accounts'
  ) THEN
    INSERT INTO public.user_accounts (
      id,
      user_id,
      platform,
      handle,
      source_url,
      display_name,
      created_at
    )
    SELECT
      id,
      user_id,
      platform,
      handle,
      source_url,
      display_name,
      created_at
    FROM public.source_accounts
    ON CONFLICT (user_id, platform, handle) DO NOTHING;
  END IF;
END $$;

