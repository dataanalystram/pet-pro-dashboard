

## Overhaul Booking Requests Tab

### Problem
The current requests page is bare-bones: single pet per request, no service/staff context, no capacity awareness, no communication channel, and no way to reschedule. A pet owner may book for multiple pets, need specific time slots, and want to communicate. A service owner needs to see staff availability, service details, estimated revenue, and be able to counter-propose times or chat before deciding.

### What Changes

**1. Database Migration -- Expand `booking_requests` table**

Add columns to support real-world booking scenarios:
- `service_id` (uuid, FK to services) -- link to actual service for pricing/duration lookup
- `pets` (jsonb, default `[]`) -- array of `{name, species, breed, weight_kg, age, notes}` to support multi-pet bookings
- `preferred_time` (text) -- preferred time slot
- `customer_phone` (text) -- contact number
- `estimated_price` (numeric) -- auto-calculated or manual
- `decline_reason` (text) -- reason when declining
- `response_message` (text) -- owner's response to customer
- `assigned_staff_id` (uuid, nullable) -- which staff member handles it
- `source` (text, default 'manual') -- where request came from (manual/public_form/website)

Add a trigger to create a notification when a new booking request arrives.

**2. Rebuild `BookingRequestsPage.tsx` with 4 sections**

**Stats Row** (top): Pending count, Today's requests, Acceptance rate, Estimated revenue from pending requests.

**Smart Request Cards** showing:
- Customer info (name, email, phone)
- All pets listed with species/breed/weight (multi-pet support)
- Service name + duration + base price (fetched from services table)
- Preferred date & time
- Staff availability indicator (green/yellow/red based on that day's existing bookings vs staff capacity)
- Request age ("2 hours ago", "1 day ago") with urgency escalation coloring
- Source badge (manual/public form)

**Action Panel** (when clicking a request, opens a detail drawer/dialog):
- Full request details with all pet info
- **Staff assignment** dropdown (from staff table, showing each staff member's booking count for that day)
- **Accept** -- assigns staff, sets price, creates a booking in `bookings` table, sends notification
- **Decline with reason** -- text field for decline reason, saves to `decline_reason`
- **Suggest alternative time** -- date+time picker to counter-propose, saves `response_message` with suggested slot, sets status to `rescheduling`
- **Chat with customer** -- opens Messages page filtered to that customer (uses existing messages system via customer_email)
- **Estimated price** override field

**Quick Filters**: Pending / Accepted / Declined / Rescheduling / All + "Today" and "This Week" time filters

**3. Public Booking Request Form** (`/book/:serviceId`)
A public page (like the review form) where pet owners can:
- Select from available services (pre-filled if serviceId provided)
- Add multiple pets (dynamic form: name, species, breed, weight, age, special notes per pet)
- Pick preferred date (calendar) + time slot
- Add booking notes / special requirements
- Enter contact info (name, email, phone)
- Mark as urgent toggle
- Zod validation on all fields

**4. Auto-notification trigger**
Database trigger on `booking_requests` INSERT that creates a notification: "New booking request from {customer_name} for {service_name}".

**5. Accept → Auto-create Booking**
When owner accepts a request, automatically insert a row into the `bookings` table with all the relevant data (customer, pet, service, date, price, status=confirmed).

### New Statuses
`pending` → `accepted` → (booking created)
`pending` → `declined` (with reason)
`pending` → `rescheduling` (owner suggests new time)
`rescheduling` → `accepted` / `declined`

### Files to Create/Modify
| Action | File |
|--------|------|
| Migration | Add columns to `booking_requests` + notification trigger |
| Rewrite | `src/pages/requests/BookingRequestsPage.tsx` |
| Create | `src/pages/requests/components/RequestStatsRow.tsx` |
| Create | `src/pages/requests/components/RequestDetailPanel.tsx` |
| Create | `src/pages/requests/components/PublicBookingForm.tsx` |
| Create | `src/pages/requests/PublicBookingPage.tsx` |
| Modify | `src/App.tsx` -- add `/book/:serviceId` route |
| Modify | `src/hooks/use-supabase-data.ts` -- update booking_requests query to join services/staff |

