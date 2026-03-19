-- content_items: Einträge eindeutig einem User zuordnen
-- 1) Unique auf source_url entfernen, user_id hinzufügen, neuer Unique (user_id, source_url)
ALTER TABLE public.content_items
  DROP CONSTRAINT IF EXISTS content_items_source_url_key;

ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Bestehende Zeilen: user_id erstmal nullable lassen, dann per Backfill setzen oder NULL erlauben
-- Für neue Inserts: user_id NOT NULL per CHECK oder App-Logik. Hier setzen wir NOT NULL erst nach Backfill:
-- ALTER TABLE public.content_items ALTER COLUMN user_id SET NOT NULL;
COMMENT ON COLUMN public.content_items.user_id IS 'Owner of this content entry; required for new rows.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_items_user_source
  ON public.content_items (user_id, source_url)
  WHERE user_id IS NOT NULL AND source_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_content_items_user_id
  ON public.content_items (user_id) TABLESPACE pg_default;

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own content_items" ON public.content_items;
CREATE POLICY "Users can manage own content_items"
  ON public.content_items
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Optional: Lese-Zugriff für Zeilen ohne user_id (Migration) – nur wenn du Backfill machst
-- CREATE POLICY "Users can read unassigned content_items" ON public.content_items FOR SELECT USING (user_id IS NULL);


-- Tabelle: Quellen-Accounts pro User (welche Creator/Accounts werden gescraped)
CREATE TABLE IF NOT EXISTS public.source_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  handle text NOT NULL,
  source_url text,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT source_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT source_accounts_user_platform_handle_key UNIQUE (user_id, platform, handle)
);

CREATE INDEX IF NOT EXISTS idx_source_accounts_user_id
  ON public.source_accounts (user_id) TABLESPACE pg_default;

ALTER TABLE public.source_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own source_accounts" ON public.source_accounts;
CREATE POLICY "Users can manage own source_accounts"
  ON public.source_accounts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
