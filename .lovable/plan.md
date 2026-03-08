

## Production-Grade Staff Management: Monthly View, Role Filters, and Enhanced Cards

### Problems Identified
1. **No monthly calendar view** -- only weekly grid exists, no bird's-eye view of the month
2. **No role/category filtering** -- with 1000 staff, there's no way to filter by role (owner/manager/staff/part_time/contractor) or status
3. **Staff cards show generic booking counts** -- not filtered to the specific staff member (line 141: `todayBookingCount` counts ALL bookings, not per-staff)
4. **Detail panel shows 0 Services** -- assigned service names aren't shown on the card itself
5. **Availability grid has no role filter** either -- unusable at scale

### Changes

#### 1. Monthly Calendar View for Availability (`StaffAvailabilityGrid.tsx` -- full rewrite)
- Add a **Weekly / Monthly** toggle at the top
- **Monthly view**: Compact calendar grid (rows = staff, columns = days of month). Each cell shows a colored dot (available/off/leave). Click to edit same as weekly.
- **Weekly view**: Existing grid (unchanged)
- Add **role filter** dropdown and **search** input above the grid so managers can filter to e.g. "only managers" or "only part_time"
- Add **status filter** (active/on_leave/inactive)

#### 2. Role & Category Filters on Team Tab (`StaffPage.tsx`)
- Add role filter pills/dropdown next to the search bar: All | Owner | Manager | Staff | Part Time | Contractor
- Add status filter: All | Active | On Leave | Inactive
- Apply filters to the `filtered` array

#### 3. Fix Staff Card Booking Count (`StaffPage.tsx` line 141)
- **Bug fix**: Change `bookings.filter(b => b.booking_date === today && b.status !== 'cancelled')` to also filter by `b.assigned_staff_id === s.id` so each card shows THAT staff member's bookings, not total
- Show assigned service names (first 2) as small badges on each card

#### 4. Enhanced Detail Panel (`StaffDetailPanel.tsx`)
- Show assigned service names inline (already works, but verify it's pulling from `service_staff` correctly)
- The screenshot shows it working -- "Assigned Services (0)" is correct if none are assigned in the junction table

### Files Summary

| Action | File | What |
|--------|------|------|
| Rewrite | `StaffAvailabilityGrid.tsx` | Add monthly/weekly toggle, role/status/search filters, monthly calendar grid |
| Modify | `StaffPage.tsx` | Add role & status filter dropdowns, fix per-staff booking count bug, show service names on cards |
| Minor | `StaffDetailPanel.tsx` | No changes needed -- already shows assigned services correctly |

### Technical Details

**Monthly grid layout**: 
- Header: 1-31 day numbers
- Each row = one staff member (filtered by role/search)  
- Each cell = small colored circle (green=working, gray=off, violet=leave, red=busy)
- Click opens same popover editor as weekly view
- Uses `getDaysInMonth` and `startOfMonth` from date-fns for month navigation

**Role filter**: Simple `Select` with `all | owner | manager | staff | part_time | contractor` values, applied before rendering both the Team grid and Availability grid.

**Booking count fix**: Line 141 currently counts ALL today's bookings. Will filter to `b.assigned_staff_id === s.id` to show per-staff load accurately.

