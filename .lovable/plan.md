

## Executive Command Center Dashboard (Gainsight-Inspired)

Replace the current basic dashboard with a pro-level executive command center that pulls real-time data from every module — bookings, customers, orders, reviews, inventory, staff, campaigns, and messages.

### Layout Structure

```text
┌─────────────────────────────────────────────────────────┐
│  Good morning 👋  |  Date  |  Quick Actions (3 buttons) │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│ Revenue  │ Bookings │ Customers│ Orders   │ Avg Rating  │
│ (spark)  │ (spark)  │ (spark)  │ (spark)  │ (spark)     │
├──────────┴──────────┴──────────┴──────────┴─────────────┤
│  Revenue Trend (30d area chart)  │  Customer Health Ring │
│  w/ bookings overlay line        │  + Churn Risk Summary │
├──────────────────────────────────┼───────────────────────┤
│  Today's Schedule (timeline)     │  Action Items Panel   │
│  sorted by time, color-coded     │  - Pending Requests   │
│                                  │  - Low Stock Alerts   │
│                                  │  - Unread Messages    │
│                                  │  - Negative Reviews   │
├──────────────────────────────────┼───────────────────────┤
│  Service Performance (horiz bar) │  Staff Utilization    │
│  Revenue + booking count per svc │  (radial/bar per staff│
├──────────────────────────────────┼───────────────────────┤
│  Top Customers (mini table)      │  Campaign Performance │
│  LTV, bookings, last visit       │  Active promos, ROI   │
├──────────────────────────────────┴───────────────────────┤
│  Recent Activity Feed (notifications, last 10)           │
└─────────────────────────────────────────────────────────┘
```

### Data Sources (all from existing hooks)

| Widget | Data Hook(s) | Key Metrics |
|--------|-------------|-------------|
| **KPI Row** (5 cards with sparklines) | bookings, customers, orders, reviews | Total revenue (30d), booking count, new customers, order count, avg rating |
| **Revenue Trend** | bookings + orders | 30-day area chart combining booking revenue + order revenue |
| **Customer Health** | customers | Donut: Active / At Risk (60d inactive) / New (30d). Churn risk count. |
| **Today's Schedule** | bookings (today filter) | Timeline list, color-coded status bars |
| **Action Items** | booking_requests, inventory, messages, reviews, notifications | Pending requests count, low-stock items, unread messages, negative reviews needing response |
| **Service Performance** | bookings grouped by service_name | Horizontal bar chart: revenue per service, booking count overlay |
| **Staff Utilization** | bookings + staff | Bookings per staff member today vs max_daily_bookings capacity |
| **Top Customers** | customers (top 5 by total_spent) | Name, LTV, total bookings, last booking date, tier badge |
| **Campaign Performance** | campaigns + campaign_redemptions | Active campaigns, redemption rate, total discount given |
| **Activity Feed** | notifications (last 10) | Type icon, title, message, relative timestamp |

### Technical Approach

**Single file rewrite**: `src/pages/dashboard/DashboardPage.tsx` — completely replace with the new executive dashboard. All data comes from existing hooks in `use-supabase-data.ts`. No new hooks needed.

**Charts**: Use existing recharts (AreaChart, BarChart, PieChart, RadialBarChart) already installed.

**Computed metrics**: All derived in a single `useMemo` block from the combined data — 30-day trends, customer health segmentation, staff utilization percentages, service rankings.

**Sparklines**: Tiny 7-day inline area charts in each KPI card showing the trend direction.

**Action Items panel**: Aggregates counts from multiple sources with click-to-navigate links to the relevant pages.

**Responsive**: 2-column grid on desktop, stacks to single column on mobile. KPI cards go 2x3 grid on mobile.

### Files Changed

| File | Change |
|------|--------|
| `src/pages/dashboard/DashboardPage.tsx` | Complete rewrite — executive command center with all widgets described above |

No database changes needed — everything uses existing tables and hooks.

