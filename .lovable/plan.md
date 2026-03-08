

## Low-Stock Alert Trigger + Backfill Delivered Orders

### What's Needed

1. **Low-stock notification trigger**: After the existing `update_inventory_total_sold` function decrements stock on delivery, if `quantity_in_stock <= reorder_point`, automatically insert a notification into the `notifications` table.

2. **Backfill existing delivered orders**: The trigger was just created but existing delivered orders haven't had their `total_sold` / `quantity_in_stock` updated. Run a one-time backfill.

### Changes

#### 1. Database Migration: Update the `update_inventory_total_sold` function

Modify the existing function to add a low-stock notification check after decrementing stock:

```sql
-- After the UPDATE that decrements quantity_in_stock:
SELECT quantity_in_stock, reorder_point, name INTO cur_stock, cur_reorder, prod_name
FROM public.inventory WHERE id = inv_id;

IF cur_stock <= cur_reorder THEN
  INSERT INTO public.notifications (type, title, message, reference_id)
  VALUES ('low_stock', '📦 Low Stock Alert', prod_name || ' is low on stock (' || cur_stock || ' remaining, reorder point: ' || cur_reorder || ')', inv_id);
END IF;
```

This fires automatically whenever a delivery causes stock to drop below the reorder point.

#### 2. Data Operation: Backfill existing delivered orders

Run an UPDATE via insert tool to fix existing data -- loop through all delivered orders' items and update inventory `total_sold` and `quantity_in_stock` accordingly. This is a one-time data fix.

#### 3. Update `NotificationBell.tsx` (if needed)

Ensure the notification bell handles the new `low_stock` type with an appropriate icon and navigation target (link to inventory page).

### Files

| Action | File/Target | What |
|--------|-------------|------|
| Migration | SQL function | Replace `update_inventory_total_sold` to add low-stock notification insert |
| Data fix | SQL (insert tool) | Backfill total_sold/stock for existing delivered orders |
| Modify | `NotificationBell.tsx` | Handle `low_stock` notification type with icon + link |

