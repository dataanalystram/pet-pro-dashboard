
-- Add new columns to services table
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS gallery_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS long_description text,
  ADD COLUMN IF NOT EXISTS price_from numeric,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS tax_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_inclusive boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS age_restrictions text,
  ADD COLUMN IF NOT EXISTS breed_restrictions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS weight_limit_kg numeric,
  ADD COLUMN IF NOT EXISTS preparation_notes text,
  ADD COLUMN IF NOT EXISTS aftercare_notes text,
  ADD COLUMN IF NOT EXISTS cancellation_policy text,
  ADD COLUMN IF NOT EXISTS highlights text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

-- Create storage bucket for service media
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-media', 'service-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to service-media bucket
CREATE POLICY "Public read service-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-media');

-- Allow public upload to service-media bucket
CREATE POLICY "Public upload service-media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'service-media');

-- Allow public delete from service-media bucket
CREATE POLICY "Public delete service-media"
ON storage.objects FOR DELETE
USING (bucket_id = 'service-media');
