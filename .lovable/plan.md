

## Fix: Add Visible Reviews Section & UI Polish

### Problem
The service preview shows "4.9 (128 reviews)" as tiny text on the hero but has no actual reviews section. Customers need to see real social proof -- individual reviews with names, ratings, dates, and comments. The recommendation cards at the bottom also lack star ratings.

### Changes

**1. ServicePreview.tsx -- Add Reviews Section**
Between the FAQ and Cancellation Policy sections, add a "Customer Reviews" block:
- Overall rating summary bar (large "4.9" with star breakdown chart)
- 3-4 hardcoded demo reviews with: avatar placeholder, name, date, star rating, review text, pet type tag
- "See all 128 reviews" link at bottom
- Reviews styled as clean cards with subtle borders

Also fix the hero star rating area -- make it more prominent with a clickable "128 reviews" link that scrolls to the reviews section.

**2. StorefrontPreview.tsx -- Add Reviews to Detail Overlay**
Same reviews section added to `StorefrontDetailOverlay` so clicking a card in storefront also shows reviews.

**3. Both files -- Add star ratings to recommendation cards**
The "You Might Also Like" cards currently lack ratings. Add a small star row + rating number.

### Demo Review Data (hardcoded, no DB change needed)
```
- Sarah M. -- 5 stars -- "Amazing grooming service! My poodle looks fantastic."
- James K. -- 5 stars -- "Very professional and caring staff. Highly recommend."
- Emily R. -- 4 stars -- "Great service, my cat was calm the whole time."
- Michael T. -- 5 stars -- "Best pet care in town. Been coming for 2 years."
```

### Files to Modify
- `src/pages/services/ServicePreview.tsx` -- Add reviews section + polish star display
- `src/pages/services/StorefrontPreview.tsx` -- Add reviews to detail overlay + recommendation card ratings

