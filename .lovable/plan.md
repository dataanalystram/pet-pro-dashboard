

## Fix Booking Count Bug & Add Service Breakdown + Drag Shift Scheduling

### Bug Found: Detail Panel Shows Wrong Booking Count

**Line 47 in `StaffDetailPanel.tsx`**:
```js
const todayBookings = bookings.filter(b => b.booking_date === today && b.status !== 'cancelled');
```
This counts ALL bookings for today across ALL staff -- not filtered to the selected staff member. That's why it shows "6/8" even if this staff member only has 2. The card grid in `StaffPage.tsx` is correct (uses `todayBookingsByStaff[s.id]`), but the detail panel is wrong.

**Fix**: Change to `bookings.filter(b => b.assigned_staff_id === s.id && b.booking_date === today && b.status !== 'cancelled')`.

### Enhancement: Show Service Breakdown in Today's Schedule

Instead of just "6/8 bookings", show which services make up those bookings. E.g.:
- "3x Full Grooming, 2x Bath & Brush, 1x Nail Trim"

Group today's bookings by `service_name` and display as small badges below the progress bar.

### Enhancement: Drag-to-Assign Shift Scheduling on Availability Grid

Add drag interaction to the weekly availability grid:
- Click and drag across multiple cells in a staff row to toggle them on/off in one gesture
- Track `isDragging`, `dragStaffId`, `dragStartIdx`, `dragEndIdx` state
- On mousedown: start drag, record staff + day index
- On mouseenter (while dragging): extend selection, highlight cells
- On mouseup: apply the toggle (all selected cells flip to working or off) and save via `useUpdate`
- Visual: highlighted cells during drag with a blue overlay

### Files

| File | Change |
|------|--------|
| `StaffDetailPanel.tsx` | Fix booking filter (add `assigned_staff_id === s.id`), add service breakdown badges |
| `StaffAvailabilityGrid.tsx` | Add drag-to-select shift toggling with mousedown/enter/up handlers |

