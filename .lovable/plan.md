

## Production Marketing System -- Database & UI Overhaul

### Current Gaps

The `campaigns` table has basic fields but the UI and DB are missing critical production features:
- No enable/disable toggle (status field exists but not exposed in UI)
- No service targeting (coupons apply globally, can't restrict to specific services)
- No redemption history tracking (just a counter, no audit trail)
- No usage limits per customer
- No minimum order/booking value requirement
- No marketing analytics section
- Form missing key admin fields

### Database Changes

**1. Alter `campaigns` table** -- Add missing columns:

| Column | Type | Purpose |
|--------|------|---------|
| `applicable_service_ids` | `uuid[]` default `'{}'` | Which services this coupon works for (empty = all) |
| `min_order_value` | `numeric` default `0` | Minimum spend to use coupon |
| `max_uses_per_customer` | `integer` default `null` | Limit per customer (null = unlimited) |
| `is_enabled` | `boolean` default `true` | Quick on/off toggle separate from status |

**2. Create `campaign_redemptions` table** -- Audit trail:

| Column | Type |
|--------|------|
| `id` | uuid PK |
| `campaign_id` | uuid FK -> campaigns |
| `customer_name` | text |
| `customer_email` | text |
| `order_id` | uuid nullable |
| `booking_id` | uuid nullable |
| `discount_applied` | numeric |
| `redeemed_at` | timestamptz default now() |

This gives full analytics: who used what coupon, when, on which order/booking, how much discount.

**3. Enable realtime** on campaigns for live updates.

### UI Changes

**`MarketingPage.tsx`** -- Full overhaul with 3 sections:

**Header row**: Inline stats (total campaigns, active, total redemptions, total discount given) as badges + toggle between list/analytics view.

**Campaign List** (enhanced):
- Add **enable/disable Switch** toggle per campaign card (instant toggle, no dialog needed)
- Show active/expired/disabled status badge with color coding
- Show applicable services as small service name chips
- Show usage: "12/50 used" (redemptions/max_redemptions) with progress bar
- Show conversion rate: redemptions/views as percentage

**Campaign Form Dialog** (enhanced fields):
- All existing fields +
- **Applicable Services**: Multi-select checkboxes from services table (empty = all services)
- **Min Order Value**: Number input
- **Max Uses Per Customer**: Number input
- **Max Total Redemptions**: Number input (existing field, now exposed)
- **Enable/Disable toggle**
- **Discount Type selector**: percentage vs fixed amount (already exists but ensure visible)

**Marketing Analytics Tab/Section**:
- **Redemption over time** chart (bar chart from `campaign_redemptions` grouped by date)
- **Top performing campaigns** by redemptions and discount value
- **Revenue impact**: Total discount given vs views (ROI-like metric)
- **Per-campaign detail**: Click a campaign to see its redemption history table

**`CreateOrderDialog.tsx`** -- Add promo code field:
- Text input for promo code at checkout
- Validate against campaigns table (is_enabled, date range, applicable services, usage limits)
- Apply discount to order total
- Insert into `campaign_redemptions` on order creation
- Increment `redemptions` counter on campaigns table

### Files

| File | Change |
|------|--------|
| Migration SQL | Add columns to campaigns, create campaign_redemptions table, enable realtime |
| `MarketingPage.tsx` | Rewrite: enable/disable toggle, service targeting, analytics section, enhanced form |
| `CreateOrderDialog.tsx` | Add promo code validation and redemption tracking |
| `use-supabase-data.ts` | Add `useCampaignRedemptions()` hook |

