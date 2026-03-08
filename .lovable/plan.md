

## Customer Management: Missing Features for Production

After auditing the current implementation against what a service CEO needs, here's what's missing:

### Detail Panel Gaps

**Missing data sources:**
- **Messages history** -- `messages` table has `customer_email`, not fetched at all. CEO needs to see communication trail.
- **Booking requests** -- `booking_requests` table not queried. Shows pending/declined requests.
- **Phone number** -- available in `booking_requests.customer_phone` and `orders.customer_phone`, never displayed.
- **Pet species/breed** -- bookings have `pet_species` and `pet_breed` but the pet cards only show names from the flat `pets[]` string array.

**Missing analytics:**
- **No-show / cancellation rate** -- bookings have `status` (cancelled, no-show) but no calculation shown. Critical for customer reliability.
- **Average rating given** -- reviews have `rating` but no avg shown in stats.
- **Total promo savings** -- sum of `discount_applied` from `campaign_redemptions`, not displayed.
- **Churn risk indicator** -- days since last visit with color-coded warning (e.g., 60+ days = at risk).
- **Monthly spend trend** -- a small sparkline or bar chart showing spend over last 6-12 months.
- **Revenue from orders vs bookings** breakdown.

**Missing quick actions:**
- No "Send Message" button to jump to `/messages?customer=...`
- No "Create Booking" or "Create Order" shortcut
- No way to add internal admin notes about the customer

**Missing tab: Messages**
- Should show recent message thread with the customer inline.

### List Page Gaps

- **No summary stats row** at top (total customer revenue, avg lifetime value, at-risk count)
- **No CSV export** button
- **No "at risk" visual indicator** on list items for customers with 60+ days since last visit
- **No phone column** on desktop view

### Plan

| File | Changes |
|------|---------|
| `CustomerDetailPanel.tsx` | Add messages + booking_requests to data fetch. Add phone number to header. Enrich pet cards with species/breed from bookings. Add no-show rate, avg rating, total savings, churn risk to stats row. Add monthly spend mini-chart (recharts). Add Messages tab (6th tab). Add quick action buttons (Message, Book, Order). |
| `CustomersPage.tsx` | Add summary stats row (total revenue, avg LTV, at-risk count). Add CSV export button. Add churn risk badge (red dot) on list items where last_booking_date is 60+ days ago. Show phone from first matching order/booking_request if available. |

**No database changes needed** -- all data already exists across existing tables, just needs to be cross-referenced and displayed.

