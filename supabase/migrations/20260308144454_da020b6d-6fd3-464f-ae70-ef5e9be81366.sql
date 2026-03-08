
ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS hire_date date,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS working_hours jsonb NOT NULL DEFAULT '{"monday":{"start":"09:00","end":"17:00","off":false},"tuesday":{"start":"09:00","end":"17:00","off":false},"wednesday":{"start":"09:00","end":"17:00","off":false},"thursday":{"start":"09:00","end":"17:00","off":false},"friday":{"start":"09:00","end":"17:00","off":false},"saturday":{"start":"10:00","end":"14:00","off":false},"sunday":{"start":"","end":"","off":true}}'::jsonb;
