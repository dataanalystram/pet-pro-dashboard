
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL DEFAULT 'negative_review',
  title text NOT NULL,
  message text NOT NULL,
  reference_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Allow public read notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow public insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update notifications" ON public.notifications FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete notifications" ON public.notifications FOR DELETE USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger function for negative reviews
CREATE OR REPLACE FUNCTION public.notify_on_negative_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.rating <= 2 THEN
    INSERT INTO public.notifications (type, title, message, reference_id)
    VALUES (
      'negative_review',
      '⚠️ Negative Review Alert',
      NEW.customer_name || ' left a ' || NEW.rating || '-star review. Respond quickly to address their concerns.',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger
CREATE TRIGGER on_negative_review_insert
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_negative_review();
