

## Appointments Page: Production-Grade Upgrade

### Current State
Basic calendar + list view with a simple detail dialog. Only supports pre-booked appointments. No walk-in support, no check-in/out workflow, no today's agenda, no stats, no notes, no no-show tracking, no reschedule, no payment tracking on individual bookings.

### What's Missing (Real Pet Service Scenarios)

**Appointment Types:**
- Walk-in (customer shows up unannounced, needs immediate slot)
- Phone booking (staff creates on behalf of customer)
- Online (from booking request flow -- already exists)
- Recurring (e.g., weekly grooming)

**Operational Workflow Gaps:**
- No check-in / check-out timestamps (how long did the service actually take?)
- No no-show marking with tracking
- No reschedule flow (change date/time without cancelling)
- No notes field on bookings (e.g., "dog is nervous", "bring own shampoo")
- No payment status per booking (paid, unpaid, partial)
- No source tracking (walk-in vs online vs phone)

**Dashboard Gaps:**
- No "Today's Queue" view (the most used view in any service business)
- No stats row (today's bookings, revenue, completed, no-shows)
- No quick "Add Walk-in" button
- No week view (only month + list)

---

### Plan

#### 1. Database Migration -- Add missing columns to `bookings`

```sql
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS check_in_time timestamptz,
  ADD COLUMN IF NOT EXISTS check_out_time timestamptz,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS no_show boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS estimated_duration_minutes integer;
```

No new tables needed. These columns cover walk-ins (source='walk_in'), check-in/out tracking, notes, payment, and no-shows.

#### 2. AppointmentsPage.tsx -- Full Rewrite

**New Tab Structure:**
- **Today** -- Queue/agenda view for the current day with check-in/out buttons, sorted by time. This is the default landing tab.
- **Calendar** -- Existing month calendar (keep as-is, minor polish)
- **Week** -- 7-day column view showing time slots
- **List** -- Existing list view (keep as-is)

**Stats Row (top of page):**
- Today's Bookings | Completed | In Progress | Revenue Today | No-Shows | Walk-ins

**Quick Actions:**
- "+ Walk-in" button -- opens a dialog to create an immediate booking with source='walk_in', date=today, status='in_progress'
- "+ Appointment" button -- opens a dialog for scheduled bookings (phone/manual)

**Today's Queue (new default tab):**
- Cards sorted by start_time
- Each card shows: time, service, customer, pet, staff, status pill
- Action buttons per card: Check In, Start, Complete, No-Show, Cancel
- Check-in records timestamp, check-out records on complete
- Color-coded left border by status
- Payment status indicator (paid/unpaid badge)

#### 3. Booking Detail -- Replace Dialog with Sheet

Replace the small dialog with a full Sheet panel (like CustomerDetailPanel):

- **Header**: Service name, status badge, source badge (walk-in/online/phone)
- **Info Section**: Customer, pet (with species/breed), date, time, duration, staff, price
- **Notes**: Editable textarea for staff notes
- **Payment**: Status selector (unpaid/paid/partial) 
- **Timeline**: Check-in time, service start, service end, check-out time
- **Actions**: Status transitions + Reschedule button (date/time picker) + No-show button
- **Staff reassignment**: Keep existing select

#### 4. Walk-in Dialog

Quick-entry form:
- Customer name (autocomplete from existing customers)
- Customer email/phone (optional for walk-ins)
- Service (select from services list)
- Pet name + species
- Staff assignment
- Price (auto-fill from service base_price)
- Notes
- Creates booking with: source='walk_in', status='in_progress', booking_date=today, check_in_time=now()

---

### Files Changed

| File | Change |
|------|--------|
| **DB Migration** | Add source, check_in_time, check_out_time, notes, payment_status, no_show, estimated_duration_minutes to bookings |
| `src/pages/appointments/AppointmentsPage.tsx` | Full rewrite: add Today tab, stats row, walk-in button, week view |
| `src/pages/appointments/components/BookingDetailPanel.tsx` | **New** -- Sheet-based detail with timeline, notes, payment, reschedule |
| `src/pages/appointments/components/WalkInDialog.tsx` | **New** -- Quick walk-in entry form |
| `src/pages/appointments/components/TodayQueue.tsx` | **New** -- Today's queue view with inline actions |
| `src/pages/appointments/components/AppointmentStatsRow.tsx` | **New** -- Stats cards for today's metrics |

