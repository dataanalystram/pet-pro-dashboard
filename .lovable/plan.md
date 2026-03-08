

## Three Tasks: Share Booking Link, E2E Testing, Professional Staff Page

### 1. Share Booking Link on Services Page

Add a "Share" button to each `ServiceCard` that copies `/book/:serviceId` URL to clipboard with a toast confirmation.

**Files to modify:**
- `src/pages/services/ServiceCard.tsx` -- Add a `Share2` icon button next to existing action buttons. On click, copy `${window.location.origin}/book/${s.id}` to clipboard and show toast.

### 2. E2E Testing

Manual testing -- no code changes. Verify:
- Navigate to `/book/{realServiceId}`, submit multi-pet booking
- Check `/requests` shows the new request with all pets
- Click request card, open detail panel, accept it
- Verify booking auto-created in Appointments

### 3. Professional Staff Page Overhaul

Transform the basic staff CRUD into a comprehensive team management dashboard with busyness tracking, performance analytics, and scheduling insights.

**Database migration:** Add columns to `staff` table:
- `status` (text, default 'active') -- active/on_leave/inactive
- `hire_date` (date, nullable)
- `bio` (text, nullable)
- `avatar_url` (text, nullable)
- `working_hours` (jsonb, default schedule object) -- per-day availability

**New components:**
- `src/pages/staff/components/StaffStatsRow.tsx` -- Summary cards: Total Staff, Active Today, Avg Rating, Total Capacity vs Bookings Today
- `src/pages/staff/components/StaffDetailPanel.tsx` -- Sheet/drawer with full staff profile: performance metrics (rating trend, services completed, revenue generated), today's schedule (bookings assigned), specializations, working hours grid, status toggle
- `src/pages/staff/components/StaffAvailabilityGrid.tsx` -- Visual weekly availability heatmap showing each staff member's load per day (green/yellow/red)

**Rewrite `StaffPage.tsx`** with:
- **Stats row** at top (total staff, active count, avg team rating, today's capacity utilization)
- **Tabbed view**: "Team" (card grid with enhanced cards showing status indicator, today's booking count, availability badge) | "Availability" (weekly grid showing all staff busyness)
- **Enhanced staff cards**: Avatar/initials, status dot (green=active, gray=on leave), today's bookings count out of max, performance sparkline or mini-bar
- **Staff detail panel**: Click a card to see full profile with assigned bookings, rating history, specializations, working hours, and quick actions (edit, toggle status, assign to request)
- **Enhanced add/edit dialog**: Include new fields (status, hire date, bio, working hours per day, specializations as tag input)

**Files summary:**
| Action | File |
|--------|------|
| Modify | `src/pages/services/ServiceCard.tsx` |
| Migration | Add columns to `staff` table |
| Create | `src/pages/staff/components/StaffStatsRow.tsx` |
| Create | `src/pages/staff/components/StaffDetailPanel.tsx` |
| Create | `src/pages/staff/components/StaffAvailabilityGrid.tsx` |
| Rewrite | `src/pages/staff/StaffPage.tsx` |
| Modify | `src/hooks/use-supabase-data.ts` -- add `notifications` to TableName if not already |

