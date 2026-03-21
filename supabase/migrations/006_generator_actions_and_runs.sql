-- Generator Actions (Templates) + Runs
-- Ermöglicht es, pro Aktion (hooks/script/cta/...) einen Step-Flow inkl. Payload-Mapping
-- als jsonb Template zu speichern und pro Run die konkreten User-Eingaben (config_json).

CREATE TABLE IF NOT EXISTS public.generator_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- z.B. "hooks_generate", "script_generate", "cta_generate"
  action_key text NOT NULL,
  title text NOT NULL,

  -- z.B. "instagram" | "tiktok" | "youtube"
  platform text NOT NULL,
  platform_label text,

  description text,

  -- Ziel-Webhook für dieses Template (n8n oder später anderes System)
  webhook_url text NOT NULL,

  -- Step-Definitionen + UI-Hinweise + Payload Mapping (anwendungsspezifisch)
  template_json jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT generator_actions_pkey PRIMARY KEY (id),
  CONSTRAINT generator_actions_user_action_platform_key
    UNIQUE (user_id, action_key, platform),
  CONSTRAINT generator_actions_platform_check
    CHECK (platform IN ('instagram', 'tiktok', 'youtube'))
);

CREATE INDEX IF NOT EXISTS idx_generator_actions_user_id
  ON public.generator_actions (user_id) TABLESPACE pg_default;

ALTER TABLE public.generator_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own generator_actions" ON public.generator_actions;
CREATE POLICY "Users can manage own generator_actions"
  ON public.generator_actions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.generator_action_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_id uuid NOT NULL REFERENCES public.generator_actions(id) ON DELETE CASCADE,

  -- konkrete User-Eingaben pro Run (Step values)
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- queued | running | succeeded | failed
  status text NOT NULL DEFAULT 'queued',
  result_json jsonb,
  error_text text,

  -- optional: um Fortschritt/Step-Outputs zu speichern
  progress_json jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz,

  CONSTRAINT generator_action_runs_pkey PRIMARY KEY (id),
  CONSTRAINT generator_action_runs_status_check
    CHECK (status IN ('queued', 'running', 'succeeded', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_generator_action_runs_user_id
  ON public.generator_action_runs (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_generator_action_runs_action_id
  ON public.generator_action_runs (action_id) TABLESPACE pg_default;

ALTER TABLE public.generator_action_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own generator_action_runs" ON public.generator_action_runs;
CREATE POLICY "Users can manage own generator_action_runs"
  ON public.generator_action_runs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

