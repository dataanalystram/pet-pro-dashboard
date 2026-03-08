

## Staff-Service Integration & Advanced Staff Management

### What We're Building

A comprehensive staff-service linkage system where services know which staff can perform them, staff schedules are fully manageable with holidays/time-off, and the owner has complete visibility into capacity and roster management.

### Database Changes

**1. New `service_staff` junction table** -- links staff to services with optional override pricing
- `id` (uuid PK), `service_id` (uuid FK→services), `staff_id` (uuid FK→staff), `is_primary` (boolean), `price_override` (numeric, nullable), `created_at`
- RLS: permissive public policies (matching existing pattern)

**2. New `staff_time_off` table** -- holidays, sick days, personal time
- `id` (uuid PK), `staff_id` (uuid FK→staff), `start_date` (date), `end_date` (date), `type` (text: holiday/sick/personal/training), `reason` (text, nullable), `status` (text: approved/pending/rejected), `created_at`
- RLS: permissive public policies

**3. Add `assigned_staff_id` to `bookings` table** -- track which staff handles each booking

### Service Form Changes (`ServiceFormDialog.tsx`)

Add a new **"Staff"** tab in the service form:
- Multi-select checklist of all staff members with their specializations and today's load shown
- Mark one as "Primary" for this service
- Optional price override per staff member (e.g., senior groomer charges more)
- Visual indicator showing each staff member's weekly availability overlap with the service's available days/times
- Save selections to `service_staff` junction table

### Staff Page Enhancements (`StaffPage.tsx`)

**New "Time Off" tab** alongside Team and Availability:
- Calendar view of all approved/pending time-off
- Add time-off form: staff member, date range, type (Holiday/Sick/Personal/Training), reason
- Approve/reject pending requests
- Visual conflict detection (shows if time-off overlaps with existing bookings)

**Enhanced Staff Detail Panel:**
- New "Assigned Services" section showing which services this staff member is linked to
- New "Time Off" section with upcoming and past leave
- "Upcoming Bookings" list with ability to reassign to another qualified staff member
- Roster editing: inline working hours editor (per-day start/end/off toggles)

**Enhanced Staff Cards:**
- Show assigned service count badge
- Show upcoming time-off indicator (e.g., "On leave in 3 days")
- Show conflict warnings if bookings exist during scheduled time-off

### Booking/Appointment Integration

- When accepting a booking request, the staff dropdown filters to only staff assigned to that service
- Appointments page shows assigned staff name on each booking card
- Ability to reassign staff on existing bookings (dropdown of qualified staff for that service)

### Files Summary

| Action | File |
|--------|------|
| Migration | Create `service_staff`, `staff_time_off` tables; add `assigned_staff_id` to `bookings` |
| Modify | `src/pages/services/ServiceFormDialog.tsx` -- add Staff tab |
| Modify | `src/pages/services/ServicesPage.tsx` -- pass staff data, save staff assignments |
| Modify | `src/pages/staff/StaffPage.tsx` -- add Time Off tab |
| Create | `src/pages/staff/components/StaffTimeOffPanel.tsx` -- time-off management UI |
| Modify | `src/pages/staff/components/StaffDetailPanel.tsx` -- assigned services, time-off, roster editing |
| Modify | `src/pages/staff/components/StaffAvailabilityGrid.tsx` -- show time-off overlay |
| Modify | `src/pages/requests/components/RequestDetailPanel.tsx` -- filter staff by service assignment |
| Modify | `src/pages/appointments/AppointmentsPage.tsx` -- show/reassign staff |
| Modify | `src/hooks/use-supabase-data.ts` -- add queries for `service_staff` and `staff_time_off` |
| Modify | `src/pages/services/ServiceCard.tsx` -- show assigned staff count |

