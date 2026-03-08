

## Enhanced Services: Custom Categories, Rich Demo Data, Customer Storefront & Recommendations

### 1. Database Changes

**New column on `services` table:**
- `custom_category` (text, nullable) -- stores the specific category name when "Other" is selected
- `recommended_services` (text[], default '{}') -- IDs of related services to cross-sell

**Seed 6-8 additional demo services** via insert tool with rich data (highlights, add-ons, FAQ, pet types, cover images, varied categories including "other" with custom category names like "Aquatics" or "Exotic Care").

### 2. Custom Category Input (ServiceFormDialog)

When user selects "Other" from the category dropdown, show a text input below it: "Specify your category (e.g. Aquatics, Exotic Care, Hydrotherapy)". Stored in `custom_category` column. The category badge on cards and preview will show the custom name instead of "Other".

### 3. Customer Storefront Preview

Add a new "Storefront Preview" button at the top of the Services page (next to "New Service"). Opens a full-screen dialog showing all active services as customers would see them:

- Featured services highlighted at top in a hero carousel/banner
- Services grouped by category with display_order sorting
- Each service rendered as a polished customer-facing card (image, price, duration, highlights, "Book Now" CTA)
- Device switcher (mobile/tablet/desktop) like the single-service preview
- Drag handles or up/down buttons on each card to reorder `display_order` (persisted to DB)

### 4. Product/Service Recommendations

Add a "Recommendations" section in the Details tab of the form:
- Multi-select from existing services ("Customers who book this also liked...")
- Stored as `recommended_services` (array of service IDs)
- Shown in both single-service preview and storefront preview as a "You Might Also Like" row

### 5. Updated ServiceCard & ServicePreview

- Show custom category name on cards/preview when `custom_category` is set
- Show recommended services section in the preview dialog
- Storefront preview shows the full collection with prioritization controls

### 6. Rich Demo Data (inserted via data tool)

8+ new services covering walking, sitting, medical, training, other (exotic care), with:
- Highlights, add-ons, FAQ entries, pet types, size pricing
- Mix of featured/non-featured, different currencies, deposit settings
- Varied availability schedules

### Files to Modify
- **Migration**: Add `custom_category` and `recommended_services` columns
- **Data insert**: 8+ richly populated demo services
- `ServiceFormDialog.tsx` -- Custom category input + recommendations multi-select
- `ServiceCard.tsx` -- Show custom category name
- `ServicePreview.tsx` -- Show custom category + recommended services
- `ServicesPage.tsx` -- Add Storefront Preview button + dialog, update save payload with new fields
- New: `src/pages/services/StorefrontPreview.tsx` -- Full customer storefront simulation

