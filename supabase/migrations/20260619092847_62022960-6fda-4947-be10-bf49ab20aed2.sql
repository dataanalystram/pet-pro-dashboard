
CREATE TABLE public.membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'Standard',
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  billing_interval TEXT NOT NULL DEFAULT 'month',
  includes JSONB NOT NULL DEFAULT '[]'::jsonb,
  perks JSONB NOT NULL DEFAULT '[]'::jsonb,
  trial_days INTEGER NOT NULL DEFAULT 0,
  max_pause_days INTEGER NOT NULL DEFAULT 30,
  family_discount_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  setup_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT 'hsl(75 95% 50%)',
  featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  seasonal_tag TEXT,
  active_members INTEGER NOT NULL DEFAULT 0,
  mrr NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.membership_plans TO authenticated, anon;
GRANT ALL ON public.membership_plans TO service_role;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read membership_plans" ON public.membership_plans FOR SELECT USING (true);
CREATE POLICY "Allow public write membership_plans" ON public.membership_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update membership_plans" ON public.membership_plans FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete membership_plans" ON public.membership_plans FOR DELETE USING (true);
CREATE TRIGGER trg_membership_plans_updated BEFORE UPDATE ON public.membership_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.membership_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.membership_plans(id) ON DELETE SET NULL,
  plan_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_email TEXT,
  owner_phone TEXT,
  pet_name TEXT,
  pet_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  mrr NUMERIC(10,2) NOT NULL DEFAULT 0,
  started_at DATE NOT NULL DEFAULT CURRENT_DATE,
  current_period_end DATE,
  paused_until DATE,
  canceled_at DATE,
  trial_ends_at DATE,
  total_charged NUMERIC(12,2) NOT NULL DEFAULT 0,
  lifetime_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  churn_risk TEXT NOT NULL DEFAULT 'low',
  payment_method_last4 TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.membership_subscriptions TO authenticated, anon;
GRANT ALL ON public.membership_subscriptions TO service_role;
ALTER TABLE public.membership_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read membership_subscriptions" ON public.membership_subscriptions FOR SELECT USING (true);
CREATE POLICY "Allow public write membership_subscriptions" ON public.membership_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update membership_subscriptions" ON public.membership_subscriptions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete membership_subscriptions" ON public.membership_subscriptions FOR DELETE USING (true);
CREATE TRIGGER trg_membership_subscriptions_updated BEFORE UPDATE ON public.membership_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.membership_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.membership_subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.membership_events TO authenticated, anon;
GRANT ALL ON public.membership_events TO service_role;
ALTER TABLE public.membership_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read membership_events" ON public.membership_events FOR SELECT USING (true);
CREATE POLICY "Allow public write membership_events" ON public.membership_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update membership_events" ON public.membership_events FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete membership_events" ON public.membership_events FOR DELETE USING (true);

CREATE TABLE public.prepaid_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  service_name TEXT NOT NULL,
  sessions INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  per_session_price NUMERIC(10,2),
  savings_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  expires_in_days INTEGER NOT NULL DEFAULT 365,
  transferable BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  units_sold INTEGER NOT NULL DEFAULT 0,
  revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prepaid_packages TO authenticated, anon;
GRANT ALL ON public.prepaid_packages TO service_role;
ALTER TABLE public.prepaid_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read prepaid_packages" ON public.prepaid_packages FOR SELECT USING (true);
CREATE POLICY "Allow public write prepaid_packages" ON public.prepaid_packages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update prepaid_packages" ON public.prepaid_packages FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete prepaid_packages" ON public.prepaid_packages FOR DELETE USING (true);
CREATE TRIGGER trg_prepaid_packages_updated BEFORE UPDATE ON public.prepaid_packages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.seasonal_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  season TEXT NOT NULL DEFAULT 'holiday',
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  plan_id UUID REFERENCES public.membership_plans(id) ON DELETE SET NULL,
  plan_name TEXT,
  discount_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  bonus_perks JSONB NOT NULL DEFAULT '[]'::jsonb,
  target_audience TEXT NOT NULL DEFAULT 'all',
  max_redemptions INTEGER,
  redemptions INTEGER NOT NULL DEFAULT 0,
  revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  capacity_cap INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled',
  banner_color TEXT NOT NULL DEFAULT 'hsl(15 90% 55%)',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seasonal_offers TO authenticated, anon;
GRANT ALL ON public.seasonal_offers TO service_role;
ALTER TABLE public.seasonal_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read seasonal_offers" ON public.seasonal_offers FOR SELECT USING (true);
CREATE POLICY "Allow public write seasonal_offers" ON public.seasonal_offers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update seasonal_offers" ON public.seasonal_offers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete seasonal_offers" ON public.seasonal_offers FOR DELETE USING (true);
CREATE TRIGGER trg_seasonal_offers_updated BEFORE UPDATE ON public.seasonal_offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.billing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'none',
  connected BOOLEAN NOT NULL DEFAULT false,
  account_label TEXT,
  account_email TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  dunning_retry_count INTEGER NOT NULL DEFAULT 3,
  dunning_retry_days INTEGER NOT NULL DEFAULT 3,
  grace_period_days INTEGER NOT NULL DEFAULT 7,
  auto_pause_after_failed BOOLEAN NOT NULL DEFAULT true,
  send_payment_receipts BOOLEAN NOT NULL DEFAULT true,
  send_renewal_reminders BOOLEAN NOT NULL DEFAULT true,
  renewal_reminder_days INTEGER NOT NULL DEFAULT 3,
  proration_enabled BOOLEAN NOT NULL DEFAULT true,
  refund_window_days INTEGER NOT NULL DEFAULT 14,
  webhook_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_settings TO authenticated, anon;
GRANT ALL ON public.billing_settings TO service_role;
ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read billing_settings" ON public.billing_settings FOR SELECT USING (true);
CREATE POLICY "Allow public write billing_settings" ON public.billing_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update billing_settings" ON public.billing_settings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete billing_settings" ON public.billing_settings FOR DELETE USING (true);
CREATE TRIGGER trg_billing_settings_updated BEFORE UPDATE ON public.billing_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.billing_settings (provider, connected) VALUES ('none', false);

INSERT INTO public.membership_plans (name, tier, description, price, billing_interval, includes, perks, trial_days, family_discount_pct, color, featured, active_members, mrr) VALUES
('Spa Essentials', 'Starter', 'Monthly grooming basics for one pet', 49, 'month',
 '["1 bath / month","Nail trim","Ear cleaning"]'::jsonb,
 '["10% off retail","Priority booking window"]'::jsonb,
 7, 10, 'hsl(200 90% 60%)', false, 38, 1862),
('Groom Club', 'Standard', 'Full grooming with VIP touches', 89, 'month',
 '["1 full groom / month","Bath + brush","Teeth cleaning"]'::jsonb,
 '["15% off retail","Free pickup once / mo","Birthday treat"]'::jsonb,
 14, 15, 'hsl(75 95% 50%)', true, 74, 6586),
('Daycare Unlimited', 'Premium', 'Unlimited daycare + monthly grooming', 299, 'month',
 '["Unlimited daycare","2 baths / month","Monthly nail trim"]'::jsonb,
 '["20% off retail","Free training assessment","Member-only events"]'::jsonb,
 14, 20, 'hsl(280 70% 60%)', false, 41, 12259),
('VIP Concierge', 'Elite', 'White-glove care for the most loved pets', 499, 'month',
 '["Unlimited daycare + grooming","Boarding 4 nights / mo","Vet wellness check"]'::jsonb,
 '["25% off retail","Dedicated handler","24/7 chat","Suite upgrades"]'::jsonb,
 0, 25, 'hsl(45 95% 55%)', false, 12, 5988);

INSERT INTO public.membership_subscriptions (plan_name, owner_name, owner_email, pet_name, status, mrr, started_at, current_period_end, lifetime_value, total_charged, churn_risk, payment_method_last4) VALUES
('Groom Club','Sarah Mitchell','sarah@example.com','Bailey (Golden)','active',89,'2025-02-14','2026-07-14',1602,1602,'low','4242'),
('Daycare Unlimited','James Chen','james@example.com','Luna (Husky)','active',299,'2024-11-02','2026-07-02',5681,5681,'low','1881'),
('Spa Essentials','Priya Sharma','priya@example.com','Coco (Pom)','past_due',49,'2025-06-08','2026-06-08',588,588,'high','0019'),
('VIP Concierge','Marco Rossi','marco@example.com','Zeus (Mastiff)','active',499,'2024-03-21','2026-07-21',13473,13473,'low','5544'),
('Groom Club','Aisha Khan','aisha@example.com','Mocha (Lab)','paused',89,'2025-01-11',NULL,1335,1335,'medium','3310'),
('Daycare Unlimited','David Park','david@example.com','Bento (Shiba)','active',299,'2025-04-30','2026-07-30',4185,4185,'low','9001'),
('Spa Essentials','Olivia Brooks','olivia@example.com','Pixel (Frenchie)','canceled',0,'2024-09-15',NULL,686,686,'high','2266'),
('Groom Club','Hiro Tanaka','hiro@example.com','Niko (Akita)','active',89,'2025-05-22','2026-07-22',1157,1157,'medium','7788');

INSERT INTO public.prepaid_packages (name, service_name, sessions, price, per_session_price, savings_pct, expires_in_days, transferable, units_sold, revenue) VALUES
('10-Pack Daycare','Daycare day pass',10,450,45,18,365,false,124,55800),
('5-Pack Grooming','Full groom',5,375,75,17,180,true,87,32625),
('Puppy Starter','Bath + nail trim',3,99,33,20,90,false,56,5544);

INSERT INTO public.seasonal_offers (name, season, description, start_date, end_date, plan_name, discount_pct, bonus_perks, target_audience, max_redemptions, redemptions, revenue, status, banner_color) VALUES
('Holiday Glow-Up','christmas','Festive grooming + bow tie / ribbon, jingle bell tag',(CURRENT_DATE - INTERVAL '5 days')::date,(CURRENT_DATE + INTERVAL '25 days')::date,'Groom Club',20,'["Free holiday photo","Bow tie / ribbon","Holiday treat box"]'::jsonb,'all',200,87,7743,'live','hsl(0 80% 55%)'),
('Diwali Sparkle Pack','diwali','Special floral scrub + paw henna art for festive season',(CURRENT_DATE + INTERVAL '90 days')::date,(CURRENT_DATE + INTERVAL '105 days')::date,'Spa Essentials',15,'["Henna paw art","Festive bandana","Sweet treat"]'::jsonb,'new',150,0,0,'scheduled','hsl(35 95% 55%)'),
('Summer Splash','summer','Pool sessions + cooling treats + extra hydration',(CURRENT_DATE + INTERVAL '15 days')::date,(CURRENT_DATE + INTERVAL '75 days')::date,'Daycare Unlimited',10,'["Pool sessions","Cooling treats","Frozen kong"]'::jsonb,'existing',300,0,0,'scheduled','hsl(195 85% 55%)'),
('Black Friday Lock-In','black-friday','Lock in annual pricing — biggest discount of the year',(CURRENT_DATE - INTERVAL '180 days')::date,(CURRENT_DATE - INTERVAL '170 days')::date,'VIP Concierge',30,'["Lock-in 12 months","Free month","Welcome kit"]'::jsonb,'all',50,42,251580,'ended','hsl(0 0% 12%)');
