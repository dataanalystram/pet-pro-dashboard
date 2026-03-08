

## Enhanced Services Page -- Complete Pet Coverage and Missing Fields

### Problem
1. When "Other" pet type is selected, there's no way to specify *which* animal it is
2. The pet types list is too short -- missing guinea pig, ferret, horse, turtle, chinchilla, hedgehog, etc.
3. Several critical fields that real pet service businesses need are missing entirely

### What Changes

**1. Database Migration -- New columns on `services` table**

| Field | Type | Purpose |
|-------|------|---------|
| `custom_pet_types` | text[] | Custom pet names when "Other" is selected |
| `service_addons` | jsonb | Upsell extras like "Nail trim +€5" (name + price array) |
| `deposit_required` | boolean | Whether advance payment is needed |
| `deposit_amount` | numeric | Deposit amount or percentage |
| `deposit_type` | text | 'fixed' or 'percentage' |
| `available_days` | text[] | Which days of week service is offered |
| `available_time_start` | text | Earliest booking time (e.g. "09:00") |
| `available_time_end` | text | Latest booking time (e.g. "18:00") |
| `min_advance_hours` | integer | Minimum hours in advance to book |
| `service_location` | text | 'in_store', 'mobile', 'both' |
| `service_area_km` | numeric | Service radius for mobile services |
| `pet_size_pricing` | jsonb | Size-based pricing tiers (small/medium/large/xl with prices) |
| `terms_conditions` | text | T&C text customers must accept |
| `faq` | jsonb | Array of {question, answer} pairs |
| `group_discount_percent` | numeric | Multi-pet discount percentage |
| `difficulty_level` | text | 'basic', 'standard', 'premium' |

**2. Pets Tab Overhaul (`ServiceFormDialog.tsx`)**
- Expand default pet types: add guinea pig, ferret, horse, turtle/tortoise, chinchilla, hedgehog, pig/mini-pig, parrot (16+ types organized in a grid)
- When "Other" is selected, show a text input to add custom pet type names (stored in `custom_pet_types`)
- Custom pet types appear as removable badges alongside standard ones
- Add **Pet Size Pricing** section: toggle on/off, then set different prices for Small, Medium, Large, XL pets
- Add **Group/Multi-Pet Discount**: percentage discount when customer brings multiple pets

**3. New "Availability" section in Schedule Tab**
- Available days of week (checkbox grid: Mon-Sun)
- Operating hours (start time / end time selectors)
- Minimum advance booking time (e.g. "At least 24 hours before")
- Service location type: In-store, Mobile (at customer's home), or Both
- Service area radius (km) when mobile is selected

**4. New "Add-ons" section in Pricing Tab**
- Add-on builder: name + price pairs (e.g. "Nail Trimming" + "€5.00")
- Add/remove add-ons dynamically
- Shows in customer preview as optional extras

**5. New fields in Details Tab**
- Deposit requirement toggle + amount/percentage
- Terms & Conditions textarea
- FAQ builder (add question/answer pairs)
- Service difficulty level (Basic/Standard/Premium)

**6. Update ServiceCard + ServicePreview**
- Show custom pet types alongside standard ones on cards
- Show add-ons, availability hours, deposit info in preview
- Show FAQ section in customer preview
- Show pet size pricing tiers in preview

**7. Update ServicesPage `handleSave`**
- Map all new form fields to the database payload

### Files to Modify
- **Migration SQL**: Add ~16 new columns to `services`
- `src/pages/services/ServiceFormDialog.tsx` -- Expanded pet types, custom pet input, add-ons, availability, deposit, FAQ, size pricing
- `src/pages/services/ServiceCard.tsx` -- Show custom pets, add-ons count, location badge
- `src/pages/services/ServicePreview.tsx` -- Full preview with add-ons, FAQ, availability, deposit, size pricing
- `src/pages/services/ServicesPage.tsx` -- Updated save payload with new fields

