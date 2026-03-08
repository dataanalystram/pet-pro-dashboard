

## Appointments Enhancement: Notifications, Recurring Bookings, Multi-Pet Support

### Overview

Three major additions: (1) notification triggers on status changes, (2) recurring appointment scheduling, (3) multi-pet support in the walk-in form and booking detail panel.

### 1. Database Changes

**New columns on `bookings`:**
```sql
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS recurring_group_id uuid,
  ADD COLUMN IF NOT EXISTS recurring_pattern text,  -- 'weekly', 'biweekly', 'monthly'
  ADD COLUMN IF NOT EXISTS pets jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS customer_phone text;
```

**New `booking_notifications` table** to log sent notifications and prevent duplicates:
```sql
CREATE TABLE public.booking_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  event_type text NOT NULL,  -- 'confirmed', 'rescheduled', 'no_show', 'reminder'
  channel text NOT NULL DEFAULT 'in_app',  -- 'in_app', 'email', 'sms'
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.booking_notifications ENABLE ROW LEVEL SECURITY;
-- public RLS (matching existing pattern)
```

**Database trigger: `notify_on_booking_status_change`** -- fires on UPDATE of `bookings`, inserts into `notifications` table when:
- Status changes to `confirmed` → "Your appointment is confirmed"
- `booking_date` or `start_time` changed → "Your appointment has been rescheduled"
- `no_show` flipped to true → "Customer marked as no-show" (admin notification)
- Status changes to `cancelled` → "Appointment cancelled"

This reuses the existing `notifications` table + `NotificationBell` system already in place.

### 2. Walk-In Dialog: Multi-Pet Support

**Current**: Single pet_name + pet_species fields.
**New**: Dynamic pet array (like PublicBookingPage pattern) with add/remove. Each pet entry: name, species, breed. Submits as `pets` jsonb array + comma-joined `pet_name` string for backward compatibility.

### 3. Booking Detail Panel: Multi-Pet Display + Notification Log

- Show pet cards from `pets` jsonb array (name, species, breed) instead of single pet_name
- Show notification history section (fetched from `booking_notifications`)
- Add "Send Reminder" quick action button

### 4. Recurring Appointments

**New component: `CreateAppointmentDialog.tsx`** -- full scheduled appointment creation (not walk-in) with:
- Customer selection (autocomplete from customers list)
- Service selection
- Multi-pet support (same pattern as walk-in)
- Date + time picker
- Staff assignment
- **Recurrence section**: toggle + pattern select (weekly/biweekly/monthly) + end date
- On submit: creates N bookings at once (e.g., 4 weekly = 4 rows sharing same `recurring_group_id`)

**"+ Appointment" button** added to page header alongside existing Walk-in button.

**Recurring badge** shown in calendar/list/detail views for bookings with `recurring_group_id`.

### 5. AppointmentsPage Integration

- Add `CreateAppointmentDialog` with "+ Appointment" button
- Show recurring badge (🔄) on calendar dots and list items
- In BookingDetailPanel, show recurrence info and "View Series" link

### Files

| File | Change |
|------|--------|
| **DB Migration** | Add columns to bookings, create booking_notifications table, create trigger for status change notifications |
| `WalkInDialog.tsx` | Multi-pet support with dynamic add/remove pet rows |
| `BookingDetailPanel.tsx` | Multi-pet display, notification log, send reminder button, recurring info |
| `CreateAppointmentDialog.tsx` | **New** -- Full appointment creation with recurrence + multi-pet |
| `AppointmentsPage.tsx` | Add "+ Appointment" button, recurring badges, integrate new dialog |
| `AppointmentStatsRow.tsx` | Add "Recurring" count to stats |

