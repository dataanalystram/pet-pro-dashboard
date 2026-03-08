

## Professional Inventory & Orders System -- Amazon-Grade Product Management

### What We're Building

Transform the basic inventory table into a full **Product Catalog + Order Management** system with rich media support (images, GIFs, videos), product detail pages, and a synced Orders tab -- all production-grade.

### Database Changes

**Migration 1: Extend `inventory` table** with product-grade columns:
- `sku` (text, unique) -- product identifier
- `description` (text) -- rich product description
- `short_description` (text) -- tagline
- `images` (text[], default '{}') -- product image URLs from storage
- `video_url` (text) -- product video/demo link
- `tags` (text[], default '{}') -- searchable tags
- `status` (text, default 'active') -- active / draft / archived
- `brand` (text) -- brand name
- `weight_grams` (numeric) -- shipping weight
- `variants` (jsonb, default '[]') -- size/color variants with prices
- `featured` (boolean, default false) -- highlight product
- `total_sold` (integer, default 0) -- sales counter

**Migration 2: New `orders` table**:
- `id` (uuid PK), `order_number` (text, unique, auto-generated)
- `customer_name`, `customer_email`, `customer_phone` (text)
- `items` (jsonb) -- array of `{inventory_id, name, quantity, unit_price, image_url}`
- `subtotal`, `tax`, `discount`, `total` (numeric)
- `status` (text: pending → confirmed → processing → shipped → delivered → cancelled → refunded)
- `shipping_address` (jsonb) -- structured address
- `tracking_number`, `notes` (text)
- `payment_method`, `payment_status` (text)
- `created_at`, `updated_at` (timestamptz)
- RLS: permissive public policies (matching existing pattern)
- Enable realtime on orders table

**Migration 3: Create `product-media` storage bucket** (public) for product images/videos.

### Frontend Architecture

#### 1. Inventory Page Rewrite (`InventoryPage.tsx`)

Replace the flat table with a **tabbed layout**:

**Header**: Title + "Add Product" button + view toggle (Grid / List)

**Tabs**: All Products | Active | Draft | Archived | Low Stock

**Toolbar**: Search + Category filter + Brand filter + Sort (Name, Price, Stock, Newest) + Bulk actions

**Grid View** (Amazon-style product cards):
- Product image thumbnail (first from `images[]`, placeholder if none)
- Name, SKU, price, stock badge (green/yellow/red)
- Category & brand badges
- Featured star indicator
- Quick actions (edit, duplicate, archive)

**List View**: Dense table with image thumbnail, name, SKU, category, stock, price, status, actions

**Product Form Dialog** (multi-tab dialog for add/edit):
- **Basic Info tab**: Name, SKU, category, brand, short description, description
- **Media tab**: MediaUploader for images (reuse existing component, bucket: `product-media`), video URL input with preview
- **Pricing tab**: Cost, retail price, variants editor (add rows: variant name, price, stock)
- **Inventory tab**: Quantity, reorder point, supplier, weight
- **Tags tab**: Tag input with autocomplete from existing tags

**Product Detail Panel** (slide-out sheet): Full product view with image carousel, all details, order history for that product, stock chart

#### 2. New Orders Page (`OrdersPage.tsx`)

**Header**: Title + stats row (Total Orders, Pending, Revenue Today, Avg Order Value)

**Tabs**: All | Pending | Processing | Shipped | Delivered | Cancelled

**Toolbar**: Search (by order#, customer) + Date range filter + Status filter

**Orders Table** (desktop) / Card list (mobile):
- Order number (clickable)
- Customer name & email
- Items summary (first item + "+N more")
- Total amount
- Status badge (color-coded by status)
- Date
- Actions (view, update status, cancel)

**Order Detail Dialog**:
- Customer info section
- Items list with product images, quantities, prices
- Order timeline (status history)
- Shipping info & tracking
- Notes
- Status update dropdown with confirm

**Create Order Dialog**:
- Customer info fields
- Product search + add to order (pulls from inventory)
- Auto-calculates subtotal/tax/total
- Deducts stock from inventory on confirmation (synced)

#### 3. Sync Between Inventory & Orders
- When an order is confirmed, reduce `quantity_in_stock` for each item
- When an order is cancelled/refunded, restore stock
- Product detail panel shows recent orders containing that product
- Orders page shows product images from inventory

#### 4. Navigation Updates
- **Sidebar**: Add "Orders" with `ShoppingCart` icon under Management group (between Inventory and Analytics)
- **Mobile nav**: Add Orders to `moreItems`
- **Router**: Add `/orders` route

#### 5. Hook Updates (`use-supabase-data.ts`)
- Add `'orders'` to `TableName` union
- Add `useOrders()` hook

### Files Summary

| Action | File |
|--------|------|
| Migration | Extend `inventory` with product columns + create `orders` table + `product-media` bucket |
| Rewrite | `src/pages/inventory/InventoryPage.tsx` -- Full product catalog with grid/list views, tabs, rich forms |
| Create | `src/pages/inventory/components/ProductCard.tsx` -- Amazon-style product card |
| Create | `src/pages/inventory/components/ProductFormDialog.tsx` -- Multi-tab product editor |
| Create | `src/pages/inventory/components/ProductDetailPanel.tsx` -- Slide-out product detail |
| Create | `src/pages/orders/OrdersPage.tsx` -- Full order management |
| Create | `src/pages/orders/components/OrderDetailDialog.tsx` -- Order detail view |
| Create | `src/pages/orders/components/CreateOrderDialog.tsx` -- New order with inventory search |
| Create | `src/pages/orders/components/OrderStatsRow.tsx` -- Order metrics |
| Modify | `src/hooks/use-supabase-data.ts` -- Add `orders` to TableName + `useOrders()` |
| Modify | `src/App.tsx` -- Add `/orders` route |
| Modify | `src/components/AppSidebar.tsx` -- Add Orders nav item |
| Modify | `src/components/MobileBottomNav.tsx` -- Add Orders to more menu |

