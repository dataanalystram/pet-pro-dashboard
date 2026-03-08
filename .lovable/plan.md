

## Professional Staff Management Overhaul: Editable Availability, Searchable Time-Off, and Conflict Notifications

### What We're Building

Transform the staff management system into an enterprise-grade workforce platform (like Scoro/Deputy) with inline-editable availability grids, searchable/filterable time-off management, and automated conflict notifications.

### 1. Editable Availability Grid

**Problem:** The current `StaffAvailabilityGrid` is read-only. Managers cannot toggle days on/off or edit working hours inline.

**Solution:** Make each cell in the grid clickable. Clicking a cell opens a small popover (or toggles off/on directly):
- Click an "Off" cell to set that day as working (with default hours from staff record)
- Click a working cell to toggle it off or edit start/end times
- Changes save directly to the `staff.working_hours` JSONB via `useUpdate('staff')`
- Add a "quick edit" popover per cell with start time, end time, and off toggle
- Show a save indicator (optimistic update with toast)

**File:** Rewrite `StaffAvailabilityGrid.tsx` -- add `Popover` on cell click with time inputs and off toggle, call `useUpdate('staff')` on save.

### 2. Searchable/Filterable Time-Off Panel (1000+ Staff Ready)

**Problem:** Current time-off panel uses a flat `Select` dropdown -- unusable at scale. No filtering, no editing existing entries, no search.

**Solution:** Overhaul `StaffTimeOffPanel.tsx`:
- Replace staff `Select` with a **searchable `Command` (combobox)** component -- type to filter staff by name, shows role badge
- Add **filter bar** at top: filter by status (all/pending/approved/rejected), type (holiday/sick/personal/training), and date range
- Make each time-off card **editable**: click to expand inline edit (change dates, type, reason, status) or open edit dialog
- Add bulk actions: select multiple entries, approve/reject all at once
- Pagination or virtual scroll for large lists

**File:** Rewrite `StaffTimeOffPanel.tsx`

### 3. Editable Staff Detail Panel (Inline Roster Editing)

**Problem:** Working hours in `StaffDetailPanel` are read-only text.

**Solution:** Add inline editing for working hours directly in the detail panel:
- Each day row becomes editable: toggle off/on, change start/end times
- Save button at bottom to persist changes to `staff.working_hours`
- Add "Edit Time Off" quick action button that opens the time-off dialog pre-filled for this staff member

**File:** Modify `StaffDetailPanel.tsx`

### 4. Automated Email Notifications for Time-Off Conflicts

**Problem:** When time-off is approved and conflicts with bookings, no one is notified.

**Solution:** 
- Create a **database trigger** on `staff_time_off` INSERT/UPDATE that:
  - When status = 'approved', checks `bookings` table for conflicting dates with `assigned_staff_id`
  - Creates a notification in `notifications` table for each conflict: "Staff X has approved leave on {date} but has {N} booking(s) that need reassignment"
- Create an **edge function** `notify-timeoff-conflicts` that:
  - Takes staff_id, start_date, end_date
  - Queries conflicting bookings with customer emails
  - Sends notification entries (no actual email since we don't have email sending set up, but creates actionable in-app notifications with reference to the booking)

**Migration:** Add trigger `notify_on_timeoff_conflict` on `staff_time_off` table.

### 5. Service Staff Tab Improvements

**Current state:** Already working. Verify persistence by ensuring `ServiceFormDialog` save logic correctly deletes old `service_staff` rows and inserts new ones when editing.

**File:** Review `ServiceFormDialog.tsx` save handler for staff assignments -- ensure it handles updates (delete old + insert new).

### Files Summary

| Action | File |
|--------|------|
| Rewrite | `src/pages/staff/components/StaffAvailabilityGrid.tsx` -- clickable cells with popover editor |
| Rewrite | `src/pages/staff/components/StaffTimeOffPanel.tsx` -- searchable combobox, filters, inline edit, bulk actions |
| Modify | `src/pages/staff/components/StaffDetailPanel.tsx` -- inline working hours editor |
| Migration | Trigger on `staff_time_off` for conflict notifications |
| Modify | `src/pages/staff/StaffPage.tsx` -- pass `useUpdate` to availability grid |

### No Database Schema Changes Needed
All existing tables support this. Only adding a trigger for conflict notifications.

