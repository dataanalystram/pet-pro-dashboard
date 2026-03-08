
CREATE OR REPLACE FUNCTION public.update_inventory_total_sold()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item jsonb;
  inv_id uuid;
  qty integer;
  cur_stock integer;
  cur_reorder integer;
  prod_name text;
BEGIN
  -- When order status changes TO 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered') THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      inv_id := (item->>'inventory_id')::uuid;
      qty := COALESCE((item->>'quantity')::integer, 1);
      IF inv_id IS NOT NULL THEN
        UPDATE public.inventory
        SET total_sold = total_sold + qty,
            quantity_in_stock = GREATEST(quantity_in_stock - qty, 0)
        WHERE id = inv_id;

        -- Check for low stock and create notification
        SELECT quantity_in_stock, reorder_point, name
        INTO cur_stock, cur_reorder, prod_name
        FROM public.inventory WHERE id = inv_id;

        IF cur_stock IS NOT NULL AND cur_reorder IS NOT NULL AND cur_stock <= cur_reorder THEN
          INSERT INTO public.notifications (type, title, message, reference_id)
          VALUES (
            'low_stock',
            '📦 Low Stock Alert',
            prod_name || ' is low on stock (' || cur_stock || ' remaining, reorder point: ' || cur_reorder || ')',
            inv_id
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- When order status changes FROM 'delivered' to something else (reversal)
  IF OLD.status = 'delivered' AND NEW.status IS DISTINCT FROM 'delivered' THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      inv_id := (item->>'inventory_id')::uuid;
      qty := COALESCE((item->>'quantity')::integer, 1);
      IF inv_id IS NOT NULL THEN
        UPDATE public.inventory
        SET total_sold = GREATEST(total_sold - qty, 0),
            quantity_in_stock = quantity_in_stock + qty
        WHERE id = inv_id;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;
