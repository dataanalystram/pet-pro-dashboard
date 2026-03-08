
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS custom_category text NULL,
  ADD COLUMN IF NOT EXISTS recommended_services text[] NOT NULL DEFAULT '{}';
