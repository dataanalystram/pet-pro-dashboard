

## Make Entire Application Mobile-Friendly

After reviewing all pages and components, here are the specific mobile issues found and fixes needed:

### Issues Found

1. **Staff page**: Edit/Delete buttons use `opacity-0 group-hover:opacity-100` — invisible on touch devices. Dialog forms use `grid-cols-2` and `grid-cols-3` without mobile stacking.

2. **Marketing page**: Campaign detail grid uses `grid-cols-2 sm:grid-cols-3 md:grid-cols-6` — cramped on small screens. Dialog forms use `grid-cols-2` and `grid-cols-3` without stacking.

3. **Appointments week view**: 7-column grid is unusable on mobile — text becomes unreadable.

4. **Customers page**: Summary stats use `grid-cols-3` which is tight on small screens (text truncates).

5. **Reviews page**: Title not using responsive text sizing. Filter row `min-w-[200px]` can cause overflow.

6. **Dashboard**: The `grid-cols-5` KPI row wraps well but the quick action buttons in the header could wrap better.

7. **Appointments tabs**: Tab triggers with icons + text can overflow on mobile.

8. **Various dialogs** (Staff, Marketing, Appointments): Form grid layouts don't stack to single column on mobile.

### Plan

| File | Fix |
|------|-----|
| `StaffPage.tsx` | Make edit/delete buttons always visible on mobile (remove hover-only). Stack dialog form grids to `grid-cols-1` on mobile, `grid-cols-2/3` on `sm:`. |
| `MarketingPage.tsx` | Stack campaign metric grid better on mobile. Stack dialog form grids to single column on mobile. |
| `AppointmentsPage.tsx` | Hide week view tab on mobile or convert to a scrollable horizontal list. Fix tab overflow with `overflow-x-auto`. |
| `CustomersPage.tsx` | Change summary stats from `grid-cols-3` to `grid-cols-1 sm:grid-cols-3` so cards stack on small screens. |
| `ReviewsPage.tsx` | Add responsive title sizing. Fix filter min-width. |
| `DashboardPage.tsx` | Ensure quick action buttons wrap properly. Minor spacing fixes for mobile. |
| `SettingsPage.tsx` | Minor: ensure booking preferences `grid-cols-3` stacks on mobile. |
| `WalkInDialog.tsx` | Stack form grids on mobile. |
| `CreateAppointmentDialog.tsx` | Stack form grids on mobile. |
| `BookingDetailPanel.tsx` | Ensure panel works well at full width on mobile. |

### Approach

- Use Tailwind responsive prefixes (`grid-cols-1 sm:grid-cols-2`, etc.) to make all grid layouts stack on mobile
- Replace hover-only interactions with always-visible controls on mobile
- Add `overflow-x-auto` to tab lists that could overflow
- Convert the week view to a scrollable horizontal layout on mobile
- Ensure all dialogs/sheets are full-width on mobile with proper max-height and scrolling

No database changes needed. Approximately 10 files to update, all with targeted responsive class changes.

