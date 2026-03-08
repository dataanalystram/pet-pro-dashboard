

## Compact Orders Page -- Space-Efficient UI

### Problem
The Orders page wastes vertical space with a full stats row of 4 cards + wide tab bar + search bar all stacked before the table. The screenshot shows rows are also vertically oversized.

### Changes

**`OrdersPage.tsx`** -- Consolidate toolbar into a single compact row:
- **Remove the stats row** from the main layout (move key metrics into the header as inline badges: "8 orders · $487 revenue · 1 pending")
- **Merge tabs + search into one row**: Replace the full TabsList with a compact **Select dropdown** for status filtering (like Amazon's "Filter by status" dropdown) -- saves horizontal and vertical space
- **Add a second dropdown** for payment status filter
- **Tighten table rows**: Reduce `py-3.5` to `py-2.5`, smaller thumbnails (`w-7 h-7`), tighter column padding
- **Combine Order # and Date** into one column (order # on top, date below in muted text) -- saves one column
- **Combine Status + Payment** into one column (status badge on top, payment below) -- saves another column
- Result: 5 columns instead of 7, denser rows, single compact toolbar row

**`OrderStatsRow.tsx`** -- Delete or repurpose as inline header metrics (small badges in the page header instead of 4 full cards)

### Layout After

```text
┌─────────────────────────────────────────────────────┐
│ Orders  8 orders · $487 revenue        [+ New Order]│
│ Track, manage and fulfill orders                    │
├─────────────────────────────────────────────────────┤
│ [Status ▾ All]  [Payment ▾ All]  [🔍 Search...    ]│
├─────────────────────────────────────────────────────┤
│ ORDER/DATE │ CUSTOMER │ ITEMS      │ TOTAL │ STATUS │
│ ORD-abc    │ Robert G │ 🖼 Shampoo │$124   │● conf  │
│ Mar 8 7pm  │ rob@..   │ +1 more    │       │  unpaid│
├────────────┼──────────┼────────────┼───────┼────────┤
│ ORD-def    │ Lisa P   │ 🖼 Treats  │$71    │● pend  │
│ Mar 8 5pm  │ lisa@..  │            │       │  unpaid│
└─────────────────────────────────────────────────────┘
```

### Files

| File | Change |
|------|--------|
| `OrdersPage.tsx` | Replace tabs with Select dropdowns, inline stats in header, merge columns, tighten spacing |
| `OrderStatsRow.tsx` | Remove (inline metrics into header instead) |

