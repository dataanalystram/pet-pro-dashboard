
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS custom_pet_types text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS service_addons jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS deposit_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_amount numeric NULL,
  ADD COLUMN IF NOT EXISTS deposit_type text NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS available_days text[] NOT NULL DEFAULT '{monday,tuesday,wednesday,thursday,friday,saturday}',
  ADD COLUMN IF NOT EXISTS available_time_start text NOT NULL DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS available_time_end text NOT NULL DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS min_advance_hours integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS service_location text NOT NULL DEFAULT 'in_store',
  ADD COLUMN IF NOT EXISTS service_area_km numeric NULL,
  ADD COLUMN IF NOT EXISTS pet_size_pricing jsonb NULL,
  ADD COLUMN IF NOT EXISTS terms_conditions text NULL,
  ADD COLUMN IF NOT EXISTS faq jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS group_discount_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS difficulty_level text NOT NULL DEFAULT 'standard';
