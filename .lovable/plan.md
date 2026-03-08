

## Services Page Professional Overhaul

### What We're Building
A comprehensive, professional service creation and management page -- the kind pet grooming/boarding/walking businesses use in platforms like SimplyBook.me, MindBody, and Time To Pet. The current page is a basic form with 5 fields. We'll transform it into a rich service builder with media, pricing tiers, compliance fields, and a live customer-facing preview.

### Database Changes (Migration)

Add new columns to the `services` table:

| Field | Type | Purpose |
|-------|------|---------|
| `cover_image_url` | text | Hero image for the service |
| `gallery_urls` | text[] | Additional photos/videos/GIFs |
| `short_description` | text | Tagline (max 120 chars) shown in cards |
| `long_description` | text | Rich detailed description |
| `price_from` | numeric | "Starting from" price for variable pricing |
| `currency` | text (default 'EUR') | EU/multi-currency support |
| `tax_rate` | numeric (default 0) | VAT/tax percentage (EU requirement) |
| `tax_inclusive` | boolean (default true) | Whether price includes tax |
| `age_restrictions` | text | e.g. "Puppies 6 months+" |
| `breed_restrictions` | text[] | Breeds not accepted |
| `weight_limit_kg` | numeric | Max pet weight |
| `preparation_notes` | text | What owner should do before (e.g. "No food 2hrs before") |
| `aftercare_notes` | text | Post-service instructions |
| `cancellation_policy` | text | Cancellation terms |
| `highlights` | text[] | Key selling points (bullet features) |
| `tags` | text[] | Searchable tags |
| `display_order` | integer | Sort order for public listing |
| `featured` | boolean (default false) | Pin to top of listings |

Also create a **storage bucket** `service-media` for image/video/GIF uploads.

### Frontend Architecture

**1. Service Form -- Multi-step dialog (replaces current basic dialog)**

Organized into tabs within a wider dialog/sheet:
- **Basic Info**: Name, category, short description, tags, status toggle, featured toggle
- **Pricing**: Base price, price-from (range), currency selector (EUR/USD/GBP), price type (fixed/starting-from/hourly), tax rate, tax-inclusive toggle
- **Duration & Capacity**: Duration, buffer time, max bookings/day
- **Pet Requirements**: Pet types accepted (multi-select chips), vaccination required, age restrictions, breed restrictions, weight limit
- **Media**: Cover image upload + gallery (drag-drop zone supporting images, GIFs, short video links). Uses storage bucket.
- **Details**: Long description (rich textarea), preparation notes, aftercare notes, cancellation policy, highlights (add/remove list)

**2. Service Cards -- Enhanced grid view**
- Cover image at top of card (with fallback gradient by category)
- Featured badge, category badge
- Short description
- Price with currency + "from" indicator
- Duration, pet types as small icons
- Highlights as bullet chips
- Quick actions: Edit, Duplicate, Toggle Active, Delete

**3. Live Preview Panel**
- "Preview as Customer" button opens a side panel or modal showing exactly how the service will appear on a public booking page
- Shows: cover image, name, price, duration, description, highlights, pet requirements, preparation notes
- Mobile-responsive preview with device frame toggle (phone/tablet/desktop)

**4. Filters & Search bar**
- Search by name/tag
- Filter by category, status (active/inactive), featured

### Files to Create/Modify

- **Migration SQL**: Add columns to `services` + create `service-media` storage bucket
- `src/pages/services/ServicesPage.tsx` -- Complete rewrite with filters, enhanced cards
- `src/pages/services/ServiceFormDialog.tsx` -- New multi-tab form component
- `src/pages/services/ServicePreview.tsx` -- Customer-facing preview component
- `src/pages/services/ServiceCard.tsx` -- Enhanced card component with media
- `src/components/MediaUploader.tsx` -- Reusable drag-drop image/GIF/video upload component
- `src/hooks/use-supabase-data.ts` -- No changes needed (generic hooks work)

### Key Professional Features
- **EU Compliance**: Currency selection, tax rate with VAT-inclusive toggle, cancellation policy field
- **Media Branding**: Cover images, gallery with GIFs support, category-based fallback gradients
- **Customer Preview**: See exactly what customers see before publishing
- **Smart Defaults**: Auto-fill tax rate based on currency, sensible defaults for buffer time and capacity

