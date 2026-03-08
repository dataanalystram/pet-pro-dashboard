

## Premium Storefront & Service Detail Redesign

### Problem
The current Storefront Preview and Service Preview look basic -- plain cards with gradient placeholders, no visual storytelling, no click-to-detail flow in the storefront, and no real images on demo data. It needs to feel like a premium booking platform (think Rover, Mindbody, or Classpass level polish).

### What Changes

**1. Update Demo Services with Real Images**
- Update the 8 seeded services via a migration to add Unsplash cover images using direct URLs (e.g. `https://images.unsplash.com/photo-...?w=800&q=80`)
- Services: grooming (dog being groomed), walking (dog on trail), boarding (cozy pet room), training (dog training session), dental (vet dental), exotic care, aquatics, pet sitting

**2. Redesign StorefrontPreview.tsx -- Premium Customer-Facing Experience**

Complete visual overhaul:
- **Hero section**: Full-width gradient banner with animated text, trust badges ("4.9★ rated", "500+ happy pets", "Certified professionals")
- **Featured carousel**: Larger hero cards with image overlay text, glassmorphism price badge, subtle hover scale animation
- **Category navigation**: Horizontal scrollable pill/chip bar to jump between categories (like Airbnb categories)
- **Service cards redesign**:
  - Rounded corners with subtle shadow elevation on hover
  - Image with gradient overlay at bottom for text readability
  - Rating stars (placeholder), duration pill, price badge overlaid on image
  - "Popular" / "New" / "Featured" badges with glass effect
  - Smooth hover: slight scale + shadow increase
  - Pet type icons row (emoji-based, compact)
- **Click-to-expand**: Clicking a card in storefront opens a detailed inline view (or the ServicePreview) showing full service details + recommendations

**3. Redesign ServicePreview.tsx -- Premium Service Detail Page**

Transform into a polished product page:
- **Sticky header** with service name + "Book Now" CTA that appears on scroll
- **Hero image section**: Full-width cover with gallery thumbnails below (clickable to expand)
- **Two-column layout on desktop**: Left = content (description, highlights, FAQ), Right = sticky booking card (price, duration, add-ons selector, "Book Now")
- **Highlights** shown as icon+text rows with checkmarks in a clean card
- **Add-ons** as interactive toggles (checkbox + price) that update a running total
- **"You Might Also Like"** section at bottom with horizontally scrollable recommendation cards with images
- **Social proof**: placeholder review quotes, trust badges
- **Smooth transitions**: fade-in sections on scroll

**4. ServiceCard.tsx Polish**
- Add subtle hover animation (translateY -2px + shadow)
- Image overlay with gradient for better text contrast
- Star rating placeholder
- Cleaner spacing and typography hierarchy

### Files to Modify
- `supabase migration` -- UPDATE demo services with Unsplash cover_image_url values
- `src/pages/services/StorefrontPreview.tsx` -- Full premium redesign with category nav, hero, click-to-detail
- `src/pages/services/ServicePreview.tsx` -- Two-column product page layout with sticky booking card, interactive add-ons, recommendations with images
- `src/pages/services/ServiceCard.tsx` -- Polish hover effects and image overlay

### Technical Notes
- Unsplash images via direct URL (`images.unsplash.com/photo-...?w=800&q=80`) -- free, no API key needed
- All changes are cosmetic/UI only, no new database columns needed
- Recommendations section will pull from `recommended_services` IDs and display with cover images
- Mobile-first responsive: single column on mobile, two-column on tablet+

