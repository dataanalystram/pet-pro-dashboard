

## Three Features: In-App Notifications, E2E Testing, Public Review Form

### 1. In-App Notifications for Negative Reviews

**Database**: Create a `notifications` table with columns: `id`, `type` (e.g. 'negative_review'), `title`, `message`, `reference_id` (links to review id), `is_read`, `created_at`. Add a database trigger on the `reviews` table that auto-inserts a notification when a review with rating <= 2 is inserted.

**Notification Bell (DashboardLayout.tsx)**: Wire up the existing bell icon in the header to show a dropdown/popover with unread notifications. Show unread count badge. Clicking a notification marks it as read and navigates to `/reviews`.

**New files**:
- `src/components/NotificationBell.tsx` -- Popover component fetching from `notifications` table, showing list of alerts with timestamps, mark-as-read functionality
- `src/hooks/use-notifications.ts` -- Hook using `useSupabaseQuery` pattern for notifications + realtime subscription for live updates

**Modified files**:
- `src/components/DashboardLayout.tsx` -- Replace static bell button with `NotificationBell` component
- `src/hooks/use-supabase-data.ts` -- Add `notifications` table type

**Migration SQL**:
- Create `notifications` table with RLS (public read/update/delete)
- Create trigger function `notify_on_negative_review()` that inserts a notification when `NEW.rating <= 2`
- Attach trigger to `reviews` table on INSERT
- Enable realtime on `notifications` table

### 2. Public Review Submission Form

**New route**: `/review/:serviceId` -- a public-facing page (no DashboardLayout) where customers submit reviews.

**New file**: `src/pages/reviews/PublicReviewPage.tsx`
- Clean, branded page with service name at top (fetched by serviceId)
- Star rating selector (clickable stars)
- Text fields: customer name, email, review text, pet name (optional), pet species (optional)
- Zod validation on all inputs
- Submits to `reviews` table with status `pending` (so owner must approve before publishing)
- Success confirmation screen after submission

**Modified files**:
- `src/App.tsx` -- Add `/review/:serviceId` route (outside DashboardLayout)

### 3. E2E Testing

This is a manual testing task -- no code changes needed. The user should verify:
- Tab switching between All Reviews and By Service
- Service card click filtering
- Quick filter buttons (Needs Reply, Negative, Priority)
- Sentiment color borders on review cards
- Reply flow

### Files Summary

| Action | File |
|--------|------|
| Create | `src/components/NotificationBell.tsx` |
| Create | `src/pages/reviews/PublicReviewPage.tsx` |
| Migration | `notifications` table + trigger on `reviews` |
| Modify | `src/components/DashboardLayout.tsx` |
| Modify | `src/hooks/use-supabase-data.ts` |
| Modify | `src/App.tsx` |

