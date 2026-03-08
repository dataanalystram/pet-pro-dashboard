
-- Extend inventory table with product-grade columns
ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS sku text UNIQUE,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS weight_grams numeric,
  ADD COLUMN IF NOT EXISTS variants jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_sold integer NOT NULL DEFAULT 0;

-- Create orders table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL DEFAULT 'ORD-' || substr(gen_random_uuid()::text, 1, 8),
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  items jsonb NOT NULL DEFAULT '[]',
  subtotal numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  shipping_address jsonb,
  tracking_number text,
  notes text,
  payment_method text DEFAULT 'cash',
  payment_status text DEFAULT 'unpaid',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS policies for orders (matching existing permissive pattern)
CREATE POLICY "Allow public read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public write orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete orders" ON public.orders FOR DELETE USING (true);

-- Updated_at trigger for orders
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Create product-media storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('product-media', 'product-media', true);

-- Storage RLS for product-media bucket
CREATE POLICY "Allow public read product-media" ON storage.objects FOR SELECT USING (bucket_id = 'product-media');
CREATE POLICY "Allow public upload product-media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-media');
CREATE POLICY "Allow public delete product-media" ON storage.objects FOR DELETE USING (bucket_id = 'product-media');
