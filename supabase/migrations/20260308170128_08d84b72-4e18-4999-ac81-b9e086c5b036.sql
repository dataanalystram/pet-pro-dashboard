
-- Add new columns to campaigns
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS applicable_service_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS min_order_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_uses_per_customer integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_enabled boolean NOT NULL DEFAULT true;

-- Create campaign_redemptions audit trail
CREATE TABLE public.campaign_redemptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_email text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  discount_applied numeric NOT NULL DEFAULT 0,
  redeemed_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS on campaign_redemptions
ALTER TABLE public.campaign_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read campaign_redemptions" ON public.campaign_redemptions FOR SELECT USING (true);
CREATE POLICY "Allow public insert campaign_redemptions" ON public.campaign_redemptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update campaign_redemptions" ON public.campaign_redemptions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete campaign_redemptions" ON public.campaign_redemptions FOR DELETE USING (true);

-- Enable realtime for campaigns
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_redemptions;
