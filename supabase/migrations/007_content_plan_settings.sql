-- Content plan settings per user account
-- Ein User kann pro eigenem user_account eine eigene Content-Plan-Konfiguration pflegen.

CREATE TABLE IF NOT EXISTS public.content_plan_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_account_id uuid NOT NULL REFERENCES public.user_accounts(id) ON DELETE CASCADE,

  timezone text NOT NULL DEFAULT 'Europe/Berlin',
  filming_days smallint[] NOT NULL DEFAULT '{}'::smallint[],
  editing_days smallint[] NOT NULL DEFAULT '{}'::smallint[],
  posting_days smallint[] NOT NULL DEFAULT '{}'::smallint[],
  filming_time text,
  editing_time text,
  posting_time text,
  reels_per_week integer,
  notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT content_plan_settings_pkey PRIMARY KEY (id),
  CONSTRAINT content_plan_settings_user_account_unique UNIQUE (user_id, user_account_id),
  CONSTRAINT content_plan_settings_reels_per_week_check
    CHECK (reels_per_week IS NULL OR reels_per_week >= 0),
  CONSTRAINT content_plan_settings_filming_days_check
    CHECK (filming_days <@ ARRAY[0,1,2,3,4,5,6]::smallint[]),
  CONSTRAINT content_plan_settings_editing_days_check
    CHECK (editing_days <@ ARRAY[0,1,2,3,4,5,6]::smallint[]),
  CONSTRAINT content_plan_settings_posting_days_check
    CHECK (posting_days <@ ARRAY[0,1,2,3,4,5,6]::smallint[])
);

CREATE INDEX IF NOT EXISTS idx_content_plan_settings_user_id
  ON public.content_plan_settings (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_content_plan_settings_user_account_id
  ON public.content_plan_settings (user_account_id) TABLESPACE pg_default;

ALTER TABLE public.content_plan_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own content_plan_settings" ON public.content_plan_settings;
CREATE POLICY "Users can manage own content_plan_settings"
  ON public.content_plan_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

