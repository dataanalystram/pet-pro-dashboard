
CREATE OR REPLACE FUNCTION public.notify_on_timeoff_conflict()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  conflict_count integer;
  staff_name text;
BEGIN
  IF NEW.status = 'approved' THEN
    SELECT count(*) INTO conflict_count
    FROM public.bookings
    WHERE assigned_staff_id = NEW.staff_id
      AND status != 'cancelled'
      AND booking_date >= NEW.start_date
      AND booking_date <= NEW.end_date;

    IF conflict_count > 0 THEN
      SELECT full_name INTO staff_name FROM public.staff WHERE id = NEW.staff_id;

      INSERT INTO public.notifications (type, title, message, reference_id)
      VALUES (
        'timeoff_conflict',
        '⚠️ Time-Off Booking Conflict',
        COALESCE(staff_name, 'A staff member') || ' has approved leave from ' || NEW.start_date || ' to ' || NEW.end_date || ' but has ' || conflict_count || ' booking(s) that need reassignment.',
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_timeoff_conflict
  AFTER INSERT OR UPDATE ON public.staff_time_off
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_timeoff_conflict();
