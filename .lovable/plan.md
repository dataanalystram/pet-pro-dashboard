

## Fixes: Duplicate X Icons in Time-Off & Availability Grid Popover

### Issue 1: Two X Icons in Time-Off Cards
The screenshot shows two confusing red X icons side by side. Looking at lines 230-241 of `StaffTimeOffPanel.tsx`:
- First XCircle (line 236): toggles status between approved/rejected
- Second XCircle (line 241): deletes the entry

Both use `XCircle` which looks identical. Fix: Replace the toggle-status button with a proper approve/reject icon pair (CheckCircle for approve, Ban for reject) and replace the delete button with a `Trash2` icon to clearly differentiate actions.

**File:** `src/pages/staff/components/StaffTimeOffPanel.tsx` (lines 226-243)
- Use `CheckCircle` (green) when status can be approved, `Ban` (red) when it can be rejected
- Use `Trash2` icon for the delete action instead of `XCircle`
- Add tooltips for clarity

### Issue 2: Availability Grid Popover Not Opening
The `Popover` component wraps each cell correctly, and the click handler calls `openEditor`. The issue is likely that the `PopoverContent` renders conditionally on `editCell` matching, but there may be a timing issue where the popover's `onOpenChange` fires before state is set. The code looks correct structurally -- let me check if Card's click propagation from StaffPage might be interfering. No, availability grid is its own tab.

Actually, looking more carefully at the code, the popover logic seems correct. The user says "it is not showing the calendar for the staff" -- they may mean week navigation (previous/next week) so the owner can set availability for future weeks, not just the current week. The grid currently only shows the current week with no navigation.

**Fix:** Add week navigation (previous/next week buttons) to `StaffAvailabilityGrid.tsx` so owners can navigate to any week and set staff availability ahead of time. Add a date display showing the current week range and chevron buttons.

### Files Summary

| Action | File |
|--------|------|
| Modify | `StaffTimeOffPanel.tsx` -- Fix duplicate X icons: use Trash2 for delete, CheckCircle/Ban for status toggle |
| Modify | `StaffAvailabilityGrid.tsx` -- Add week navigation (prev/next) with date range display |

