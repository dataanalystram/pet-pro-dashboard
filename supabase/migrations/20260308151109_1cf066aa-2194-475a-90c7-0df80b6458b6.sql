
-- 1. service_staff junction table
CREATE TABLE public.service_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  price_override numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(service_id, staff_id)
);

ALTER TABLE public.service_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read service_staff" ON public.service_staff FOR SELECT USING (true);
CREATE POLICY "Allow public write service_staff" ON public.service_staff FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update service_staff" ON public.service_staff FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete service_staff" ON public.service_staff FOR DELETE USING (true);

-- 2. staff_time_off table
CREATE TABLE public.staff_time_off (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  type text NOT NULL DEFAULT 'holiday',
  reason text,
  status text NOT NULL DEFAULT 'approved',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_time_off ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read staff_time_off" ON public.staff_time_off FOR SELECT USING (true);
CREATE POLICY "Allow public write staff_time_off" ON public.staff_time_off FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update staff_time_off" ON public.staff_time_off FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete staff_time_off" ON public.staff_time_off FOR DELETE USING (true);

-- 3. Add assigned_staff_id to bookings
ALTER TABLE public.bookings ADD COLUMN assigned_staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL;
