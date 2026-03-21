-- Add the creator metadata fields to `user_accounts`.
-- This table represents the user's own Instagram/TikTok/YouTube accounts.

ALTER TABLE public.user_accounts
  ADD COLUMN IF NOT EXISTS followers integer NULL;

ALTER TABLE public.user_accounts
  ADD COLUMN IF NOT EXISTS niche text NULL;

ALTER TABLE public.user_accounts
  ADD COLUMN IF NOT EXISTS profile_picture_url text NULL;

ALTER TABLE public.user_accounts
  ADD COLUMN IF NOT EXISTS following integer NULL;

ALTER TABLE public.user_accounts
  ADD COLUMN IF NOT EXISTS verified boolean NULL DEFAULT false;

ALTER TABLE public.user_accounts
  ADD COLUMN IF NOT EXISTS posts_count integer NULL;

ALTER TABLE public.user_accounts
  ADD COLUMN IF NOT EXISTS biography text NULL;

ALTER TABLE public.user_accounts
  ADD COLUMN IF NOT EXISTS external_link text NULL;

ALTER TABLE public.user_accounts
  ADD COLUMN IF NOT EXISTS related_profiles text[] NULL;

ALTER TABLE public.user_accounts
  ADD COLUMN IF NOT EXISTS last_updated timestamptz NULL DEFAULT now();

