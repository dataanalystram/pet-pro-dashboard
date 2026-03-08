

## Add Reviews Management Tab

### Problem
Reviews are currently hardcoded placeholders in the service preview. There's no way to track, manage, or respond to customer reviews across services. The business needs a dedicated Reviews page to monitor feedback and take action.

### What Changes

**1. Create `reviews` Database Table**
New table with columns: `id`, `service_id` (FK to services), `customer_name`, `customer_email`, `rating` (1-5), `review_text`, `pet_name`, `pet_species`, `status` (published/pending/flagged/hidden), `admin_response`, `responded_at`, `created_at`, `updated_at`. RLS policies for public CRUD (matching existing pattern). Seed with 8-10 demo reviews spread across services.

**2. Create `src/pages/reviews/ReviewsPage.tsx`**
Full reviews management page with:
- **Stats row**: Average rating, total reviews, pending reviews, response rate (4 stat cards)
- **Filters**: Search by customer/service name, filter by rating (1-5 stars), filter by status (all/pending/published/flagged), filter by service
- **Reviews list**: Cards showing star rating, customer name, service name, date, review text, pet info, current status badge
- **Actions per review**: Reply (opens inline textarea to add admin response), change status (publish/hide/flag), delete
- **Rating distribution chart**: Horizontal bar chart showing 5-star to 1-star breakdown

**3. Add Route & Navigation**
- Add `/reviews` route in `App.tsx` with `DashboardLayout`
- Add "Reviews" with `Star` icon to sidebar under Main group in `AppSidebar.tsx`
- Add "Reviews" to mobile More menu in `MobileBottomNav.tsx`
- Add `useReviews` hook to `use-supabase-data.ts`

**4. Connect Reviews to Service Preview**
- Update `ServicePreview.tsx` and `StorefrontPreview.tsx` to fetch real reviews from the database instead of using hardcoded data
- Show actual average rating and review count per service

### Files to Create/Modify
- **Migration**: Create `reviews` table + seed demo data
- `src/pages/reviews/ReviewsPage.tsx` -- New reviews management page
- `src/App.tsx` -- Add `/reviews` route
- `src/components/AppSidebar.tsx` -- Add Reviews nav item
- `src/components/MobileBottomNav.tsx` -- Add Reviews to more menu
- `src/hooks/use-supabase-data.ts` -- Add `useReviews` hook
- `src/pages/services/ServicePreview.tsx` -- Replace hardcoded reviews with real data
- `src/pages/services/StorefrontPreview.tsx` -- Replace hardcoded reviews with real data

