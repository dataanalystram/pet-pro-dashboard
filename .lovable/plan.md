

## Production-Level Customer Management Overhaul

### Problem
The current customer detail is a basic dialog showing name, email, tier, spend, and pets. No booking history, no service history, no staff interactions, no order history, no review history, no promo usage -- none of the cross-referenced data that makes customer management useful.

### Approach
Replace the simple Dialog with a full-width Sheet panel (like StaffDetailPanel), and query all related tables by `customer_email`/`customer_name` to build a complete 360-degree customer profile.

### Data Cross-References (all client-side queries, no schema changes needed)

All existing tables already store `customer_name`/`customer_email`, so we can join on those:
- **bookings** -- full service history (service, date, staff, price, status)
- **booking_requests** -- pending/past requests
- **orders** -- product purchase history (items, totals, promo used)
- **reviews** -- reviews they've left (rating, service, text)
- **campaign_redemptions** -- promo codes they've used (discount, campaign)
- **staff** (via bookings.assigned_staff_id) -- which staff they've worked with

### UI: Customer Detail Panel (Sheet)

**Header**: Avatar, name, email, tier badge, member since date, quick-edit tier dropdown

**Stats Row** (6 metrics):
- Total Spent | Total Bookings | Avg Booking Value | Products Ordered | Reviews Left | Promos Used

**Tabbed sections**:

1. **Overview Tab**
   - Pet cards (name from pets array, with icon)
   - Lifetime value timeline (first visit -> last visit, days as customer)
   - Favorite services (most booked, derived from bookings)
   - Preferred staff (most assigned, derived from bookings)

2. **Booking History Tab**
   - Table: date, service, pet, staff name, price, status
   - Sorted newest first
   - Color-coded status badges

3. **Orders Tab**
   - Table: order number, date, items count, total, payment status
   - Show promo code used if any discount

4. **Reviews Tab**
   - Cards showing rating stars, service name, review text, date
   - Admin response if any

5. **Promos Used Tab**
   - Table: promo code, campaign name, discount applied, date

### Customer List Enhancements

- Add tier filter pills (click a tier stat card to filter)
- Add "Last Visit" column on desktop
- Show pet count badge on list items
- Add export/CSV option (stretch)

### Files

| File | Change |
|------|--------|
| `src/pages/customers/CustomersPage.tsx` | Replace Dialog with Sheet, add tier filtering |
| `src/pages/customers/components/CustomerDetailPanel.tsx` | **New** -- full 360-degree customer profile with tabs |

No database changes needed -- all data exists, just needs cross-referencing.

