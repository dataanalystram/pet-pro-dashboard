

## Add Drill-Down Navigation from Dashboard Widgets

Make every KPI card and chart segment clickable, navigating to the relevant detail page.

### Changes (single file: `DashboardPage.tsx`)

**1. KpiCard — add `onClick` prop + cursor styling**
- Add `onClick?: () => void` to `KpiCard` props
- Add `cursor-pointer` class and `onClick` handler to the Card
- Wire each KPI card to its target page:
  - Revenue → `/analytics`
  - Bookings → `/appointments`
  - New Customers → `/customers`
  - Orders → `/orders`
  - Avg Rating → `/reviews`

**2. Revenue Trend chart — make clickable**
- Add `onClick` handler to the AreaChart that navigates to `/analytics`
- Add `cursor-pointer` class to the chart container

**3. Customer Health pie — make segments clickable**
- Add `onClick` handler on `Pie` that navigates to `/customers`
- Use recharts' built-in `onClick` on `<Pie>` component

**4. Service Performance bars — make clickable**
- Add `onClick` on `<Bar>` component to navigate to `/services`

**5. Today's Schedule items — make each row clickable**
- Wrap each booking row in a clickable element that navigates to `/appointments`

**6. Top Customers rows — make clickable**
- Add `onClick` on each table row to navigate to `/customers`

**7. Campaign items — make clickable**
- Each campaign item navigates to `/marketing`

**8. Visual feedback**
- Add `cursor-pointer` and subtle hover effects to all clickable elements
- Add a small arrow/chevron indicator on KPI cards to signal interactivity

### No database changes needed. Single file edit.

