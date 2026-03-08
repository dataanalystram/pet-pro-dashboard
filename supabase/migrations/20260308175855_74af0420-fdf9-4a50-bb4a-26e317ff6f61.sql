
-- Add recurring and multi-pet columns to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS recurring_group_id uuid,
  ADD COLUMN IF NOT EXISTS recurring_pattern text,
  ADD COLUMN IF NOT EXISTS pets jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS customer_phone text;

-- Create booking_notifications table
CREATE TABLE IF NOT EXISTS public.booking_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  channel text NOT NULL DEFAULT 'in_app',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read booking_notifications" ON public.booking_notifications FOR SELECT USING (true);
CREATE POLICY "Allow public insert booking_notifications" ON public.booking_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update booking_notifications" ON public.booking_notifications FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete booking_notifications" ON public.booking_notifications FOR DELETE USING (true);

-- Trigger function for booking status change notifications
CREATE OR REPLACE FUNCTION public.notify_on_booking_status_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  -- Status changed to confirmed
  IF NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' THEN
    INSERT INTO public.notifications (type, title, message, reference_id)
    VALUES ('booking_confirmed', '✅ Appointment Confirmed', NEW.customer_name || '''s appointment for ' || NEW.service_name || ' on ' || NEW.booking_date || ' has been confirmed.', NEW.id);
    INSERT INTO public.booking_notifications (booking_id, event_type, channel) VALUES (NEW.id, 'confirmed', 'in_app');
  END IF;

  -- Rescheduled (date or time changed)
  IF (OLD.booking_date IS DISTINCT FROM NEW.booking_date OR OLD.start_time IS DISTINCT FROM NEW.start_time)
     AND NEW.status NOT IN ('cancelled') THEN
    INSERT INTO public.notifications (type, title, message, reference_id)
    VALUES ('booking_rescheduled', '📅 Appointment Rescheduled', NEW.customer_name || '''s ' || NEW.service_name || ' has been rescheduled to ' || NEW.booking_date || '.', NEW.id);
    INSERT INTO public.booking_notifications (booking_id, event_type, channel) VALUES (NEW.id, 'rescheduled', 'in_app');
  END IF;

  -- No-show
  IF NEW.no_show = true AND OLD.no_show IS DISTINCT FROM true THEN
    INSERT INTO public.notifications (type, title, message, reference_id)
    VALUES ('booking_no_show', '❌ No-Show', NEW.customer_name || ' did not show up for ' || NEW.service_name || ' on ' || NEW.booking_date || '.', NEW.id);
    INSERT INTO public.booking_notifications (booking_id, event_type, channel) VALUES (NEW.id, 'no_show', 'in_app');
  END IF;

  -- Cancelled
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    INSERT INTO public.notifications (type, title, message, reference_id)
    VALUES ('booking_cancelled', '🚫 Appointment Cancelled', NEW.customer_name || '''s ' || NEW.service_name || ' on ' || NEW.booking_date || ' has been cancelled.', NEW.id);
    INSERT INTO public.booking_notifications (booking_id, event_type, channel) VALUES (NEW.id, 'cancelled', 'in_app');
  END IF;

  -- Completed
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    INSERT INTO public.notifications (type, title, message, reference_id)
    VALUES ('booking_completed', '🎉 Service Completed', NEW.service_name || ' for ' || NEW.customer_name || ' (pet: ' || NEW.pet_name || ') has been completed.', NEW.id);
    INSERT INTO public.booking_notifications (booking_id, event_type, channel) VALUES (NEW.id, 'completed', 'in_app');
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER trg_booking_status_change
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_booking_status_change();
