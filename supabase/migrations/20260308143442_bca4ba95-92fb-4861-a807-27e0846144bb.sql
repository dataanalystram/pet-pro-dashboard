
-- Add new columns to booking_requests
ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services(id),
  ADD COLUMN IF NOT EXISTS pets jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS preferred_time text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS estimated_price numeric,
  ADD COLUMN IF NOT EXISTS decline_reason text,
  ADD COLUMN IF NOT EXISTS response_message text,
  ADD COLUMN IF NOT EXISTS assigned_staff_id uuid REFERENCES public.staff(id),
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

-- Create trigger function for new booking request notifications
CREATE OR REPLACE FUNCTION public.notify_on_new_booking_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (type, title, message, reference_id)
  VALUES (
    'new_booking_request',
    '📋 New Booking Request',
    NEW.customer_name || ' requested ' || NEW.service_name || CASE WHEN NEW.is_urgent THEN ' (URGENT)' ELSE '' END,
    NEW.id
  );
  RETURN NEW;
END;
$$;

-- Attach trigger
CREATE TRIGGER on_new_booking_request
AFTER INSERT ON public.booking_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_booking_request();
