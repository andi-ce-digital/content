-- Brand Voice Knowledge Documents (for RAG)
-- Dateien pro Brand Voice speichern (Multi-Tenant über user_id).

CREATE TABLE IF NOT EXISTS public.brand_voice_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_voice_id uuid NOT NULL REFERENCES public.brand_voices(id) ON DELETE CASCADE,

  original_filename text NOT NULL,
  mime_type text,
  file_size_bytes bigint,

  storage_bucket_id text NOT NULL DEFAULT 'brand_voice_docs',
  storage_path text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT brand_voice_documents_pkey PRIMARY KEY (id),
  CONSTRAINT brand_voice_documents_user_voice_unique
    UNIQUE (user_id, brand_voice_id, storage_path)
);

CREATE INDEX IF NOT EXISTS idx_brand_voice_documents_user_id
  ON public.brand_voice_documents (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_brand_voice_documents_brand_voice_id
  ON public.brand_voice_documents (brand_voice_id) TABLESPACE pg_default;

ALTER TABLE public.brand_voice_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brand_voice_documents_manage_own" ON public.brand_voice_documents;
CREATE POLICY "brand_voice_documents_manage_own"
  ON public.brand_voice_documents
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket für Knowledge-Dokumente
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand_voice_docs',
  'brand_voice_docs',
  false,
  5242880,
  ARRAY[
    'text/plain',
    'application/pdf',
    'text/markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Nur der Owner darf in seinen eigenen Ordner hochladen/löschen (foldername(name)[1] = user_id)
DROP POLICY IF EXISTS "brand_voice_docs_upload_own_folder" ON storage.objects;
CREATE POLICY "brand_voice_docs_upload_own_folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'brand_voice_docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "brand_voice_docs_select_own_folder" ON storage.objects;
CREATE POLICY "brand_voice_docs_select_own_folder"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'brand_voice_docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "brand_voice_docs_update_own_folder" ON storage.objects;
CREATE POLICY "brand_voice_docs_update_own_folder"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'brand_voice_docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'brand_voice_docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "brand_voice_docs_delete_own_folder" ON storage.objects;
CREATE POLICY "brand_voice_docs_delete_own_folder"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'brand_voice_docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

