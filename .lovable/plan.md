

## Enterprise-Grade Reviews Management Overhaul

### Problem
The current Reviews page is a flat list with basic filters. A service business CEO needs to instantly see which services are performing well vs. poorly, prioritize responses, and take quick action -- similar to how Google My Business, Meta Business Suite, and Trustpilot handle review management.

### Approach (inspired by Google Business Profile, Meta, Trustpilot)

**1. Service-Grouped View with Tabs**
Add a tabbed layout at the top: "All Reviews" | "By Service". The "By Service" tab shows service cards with each service's average rating, review count, and sentiment indicator. Clicking a service card filters to show only that service's reviews. This is the core missing feature -- knowing which service has problems at a glance.

**2. Quick Action Toolbar (Google-style)**
Add bulk action capabilities and priority indicators:
- **Needs Reply** quick filter button (highlighted with count badge) -- one-click to see all unanswered reviews
- **Negative Reviews** quick filter (1-2 stars) with red badge
- **This Week** time filter for recent activity
- Batch select + bulk status change (publish/hide multiple at once)

**3. Service Performance Cards (By Service tab)**
Each service gets a summary card showing:
- Service name + category
- Average rating (large) + star visual
- Total review count
- % positive (4-5 stars) vs negative (1-2 stars) ratio bar
- Unanswered count with alert indicator
- Click to drill down into that service's reviews

**4. Review Sentiment Indicators**
Color-code review cards by sentiment:
- Green left border for 4-5 star reviews
- Yellow for 3 stars
- Red for 1-2 stars
This gives instant visual scanning like Trustpilot's dashboard.

**5. Priority Queue**
Auto-sort option: "Priority" sorts by: flagged first, then negative unanswered, then pending, then rest. This is how Meta's support tools surface urgent items.

**6. Enhanced Stats Row**
Add two more stats:
- **Avg Response Time** (calculated from created_at vs responded_at)
- **Positive Rate** (% of 4-5 star reviews)

### Files to Modify
- `src/pages/reviews/ReviewsPage.tsx` -- Complete overhaul with tabs, service cards, quick actions, sentiment borders, priority sorting

### No database changes needed -- all data already exists in the reviews + services tables.

