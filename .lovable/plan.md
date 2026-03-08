

## Fix Mobile Service Detail Overlay & Reviews Visibility

### Problem
When clicking "Book Now" or a service card on mobile in the Storefront Preview, the `StorefrontDetailOverlay` renders poorly because:
1. It uses `fixed inset-0` **inside** a Dialog's `DialogContent` that already has `overflow-y-auto` -- this creates a nested scroll/positioning conflict on mobile
2. The overlay container isn't truly full-screen on mobile -- it has margins and rounded corners that waste space
3. The booking card and reviews section get pushed below the fold with no clear scroll indication

### Changes

**StorefrontPreview.tsx -- `StorefrontDetailOverlay` mobile fixes:**
- Change the overlay to render as a full-screen slide-up panel on mobile (no margins, no rounded top corners, `inset-0` with `overflow-y-auto` on the inner container)
- Make the hero image shorter on mobile (`h-44` instead of `h-56`)
- Move the booking card **above** the content sections on mobile (price + Book Now CTA visible immediately)
- Make the sticky booking card a fixed bottom bar on mobile (compact: price + Book Now button pinned to bottom)
- Ensure reviews section renders fully with proper padding to clear the fixed bottom bar
- Add `pb-24` to content area on mobile to account for the fixed bottom booking bar

**ServicePreview.tsx -- Same mobile fixes:**
- The `DialogContent` already handles device switching, but when device is `mobile`, the booking card should appear as a fixed bottom CTA bar rather than inline below all content
- Add bottom padding to clear the fixed bar

### Files to Modify
- `src/pages/services/StorefrontPreview.tsx` -- Fix `StorefrontDetailOverlay` for mobile: full-screen panel, fixed bottom booking bar, shorter hero
- `src/pages/services/ServicePreview.tsx` -- Same fixed bottom booking bar pattern for mobile device preview

