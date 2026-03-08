

## Audit & Consolidate Product Form

### Calculation Review

All margin calculations are correct:
- **Form**: `(1 - cost/retail) * 100` for percentage, `retail - cost` for dollar margin
- **Detail panel**: Same formula
- **Edge case bug**: Division by zero when `retail_price` is 0 -- needs a guard

### Problem with Current Form

The form uses **5 tabs** (Basic Info, Media, Pricing, Inventory, Tags) which forces users to click through tabs to fill basic fields. Amazon-style forms put essential fields on one scrollable view with collapsible sections for advanced options.

### Changes

**`ProductFormDialog.tsx`** -- Consolidate from 5 tabs to a single scrollable form with sections:

**Essential fields (always visible, top section):**
- Name + SKU (row)
- Category + Brand (row, dropdowns)
- Short Description (single line)
- Retail Price + Cost + auto-calculated margin display (row)
- Quantity in Stock + Reorder Point (row)
- Status dropdown + Featured toggle (row)

**Collapsible "More Details" sections:**
- **Description**: Full description textarea (collapsed by default)
- **Media**: Image uploader + video URL
- **Supplier & Shipping**: Supplier name, weight
- **Variants**: Variant rows
- **Tags**: Tag input

This puts all critical fields in view without scrolling/tabbing. Advanced fields are one click away via collapsible sections.

**`ProductDetailPanel.tsx`** -- Add guard for division-by-zero on margin calculation.

### Files

| File | Change |
|------|--------|
| `ProductFormDialog.tsx` | Replace 5-tab layout with single scrollable form + collapsible sections |
| `ProductDetailPanel.tsx` | Fix margin division-by-zero edge case |

