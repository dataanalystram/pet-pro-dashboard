

## Plan: Public Coupon Validator + 80% Threshold Alert + Calculation Accuracy

### 1. Public Coupon Validation Page (`/promo`)

New file: `src/pages/marketing/PublicPromoPage.tsx`

A simple, branded public page where customers enter a promo code and see:
- Whether it's valid/expired/disabled/maxed out
- Discount amount (% or $)
- Which services it applies to (with names)
- Date validity range
- Minimum order requirement

The page queries `campaigns` table (already has public RLS) and `services` for names. No auth required.

Route added to `App.tsx`: `<Route path="/promo" element={<PublicPromoPage />} />`

### 2. Campaign 80% Threshold Notification (DB Trigger)

New migration: Add a trigger on `campaigns` table `AFTER UPDATE` that fires when `redemptions` changes. If `max_redemptions` is set and `redemptions >= max_redemptions * 0.8`, insert a notification:

```sql
CREATE FUNCTION notify_campaign_threshold() ...
  IF NEW.max_redemptions IS NOT NULL 
     AND NEW.redemptions >= ceil(NEW.max_redemptions * 0.8)
     AND (OLD.redemptions < ceil(OLD.max_redemptions * 0.8) OR OLD.redemptions IS DISTINCT FROM NEW.redemptions)
  THEN
    INSERT INTO notifications (type, title, message, reference_id)
    VALUES ('campaign_threshold', '🎯 Campaign Nearing Limit', 
            NEW.name || ' has used ' || NEW.redemptions || '/' || NEW.max_redemptions || ' redemptions (80%+)', 
            NEW.id);
```

Also update `NotificationBell.tsx` to handle `campaign_threshold` type with appropriate icon and link to `/marketing`.

### 3. Calculation Accuracy Fixes in `CreateOrderDialog.tsx`

Current issues:
- **Tax is applied to (subtotal - discount)** -- this is correct conceptually but needs precision: all monetary math should use `Math.round(x * 100) / 100` to avoid floating point drift
- **Discount can exceed subtotal** for fixed-amount coupons -- already guarded with `Math.min` but the tax line could go negative if discount > subtotal (guard needed)
- **Percentage discount** should cap at subtotal

Changes:
- Wrap all monetary calculations with 2-decimal rounding
- Ensure `taxableAmount = Math.max(0, subtotal - promoDiscount)` before computing tax
- Round `subtotal`, `tax`, `discount`, and `total` before saving to DB
- Add the same rounding in `validatePromo` for the discount amount

### Files

| File | Change |
|------|--------|
| `src/pages/marketing/PublicPromoPage.tsx` | New public coupon validation page |
| `src/App.tsx` | Add `/promo` route |
| Migration SQL | `notify_campaign_threshold()` trigger on campaigns |
| `src/components/NotificationBell.tsx` | Handle `campaign_threshold` notification type |
| `src/pages/orders/components/CreateOrderDialog.tsx` | Fix all monetary rounding for accuracy |

