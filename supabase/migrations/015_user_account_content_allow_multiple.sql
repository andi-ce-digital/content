-- Mehrere Zeilen pro user_id (auch gleiche source_url) erlauben.
-- Entfernt UNIQUE (user_id, source_url) und die Merge-Logik im Trigger.

ALTER TABLE public.user_account_content
  DROP CONSTRAINT IF EXISTS user_account_content_user_id_source_url_key;

-- Optionaler CHECK(true) aus manuellen DB-Änderungen
ALTER TABLE public.user_account_content
  DROP CONSTRAINT IF EXISTS user_account_content_user_account_user_fkey;

-- Nur noch user_id aus user_account_id setzen; kein Dedup/Merge mehr
CREATE OR REPLACE FUNCTION public.user_account_content_sync_and_merge()
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

COMMENT ON FUNCTION public.user_account_content_sync_and_merge () IS
  'Setzt user_id aus user_account_id; mehrere Einträge pro User+URL sind erlaubt.';
