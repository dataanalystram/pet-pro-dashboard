
CREATE OR REPLACE FUNCTION public.notify_campaign_threshold()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.max_redemptions IS NOT NULL
     AND NEW.redemptions >= ceil(NEW.max_redemptions * 0.8)
     AND (OLD.redemptions < ceil(OLD.max_redemptions * 0.8))
  THEN
    INSERT INTO public.notifications (type, title, message, reference_id)
    VALUES (
      'campaign_threshold',
      '🎯 Campaign Nearing Limit',
      NEW.name || ' has used ' || NEW.redemptions || '/' || NEW.max_redemptions || ' redemptions (80%+). Consider planning your next promotion.',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_campaign_threshold
  AFTER UPDATE ON public.campaigns
  FOR EACH ROW
  WHEN (OLD.redemptions IS DISTINCT FROM NEW.redemptions)
  EXECUTE FUNCTION public.notify_campaign_threshold();
