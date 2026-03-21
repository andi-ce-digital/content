-- Add title + description for Brand Voice knowledge documents

ALTER TABLE public.brand_voice_documents
  ADD COLUMN IF NOT EXISTS title text;

ALTER TABLE public.brand_voice_documents
  ADD COLUMN IF NOT EXISTS description text;

