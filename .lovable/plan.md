

## Professional Theme Redesign + Mobile-First Responsiveness

### Problem
The current theme uses warm amber/orange colors (Nunito + DM Sans fonts) that feel casual rather than professional. The app needs a clean, modern SaaS dashboard look and full mobile responsiveness.

### Design Direction
A **neutral, professional palette** inspired by modern B2B SaaS dashboards (think Stripe, Linear, Notion):
- **Primary**: Deep indigo/blue (`220 70% 50%`) -- trustworthy, professional
- **Background**: Near-white cool gray (`220 14% 96%`)
- **Cards**: Pure white with subtle shadows
- **Fonts**: Inter (clean, professional, widely used in SaaS)
- **Accents**: Teal for success, soft red for destructive, amber for warnings
- **Sidebar**: Dark navy/slate sidebar for contrast and authority

### What Changes

**1. Theme overhaul (`src/index.css` + `tailwind.config.ts`)**
- Replace amber/orange palette with cool indigo-based professional palette
- Switch fonts from Nunito/DM Sans to Inter
- Dark sidebar with light content area (common professional pattern)
- Refined border radius, shadows, and spacing

**2. Sidebar redesign (`AppSidebar.tsx`)**
- Dark background sidebar with white/muted text
- Active state with indigo highlight
- Cleaner logo area, professional typography

**3. Dashboard header (`DashboardLayout.tsx`)**
- Add search bar, notification bell, and user avatar to header
- Breadcrumb-style page context
- Mobile hamburger menu improvements

**4. Dashboard page (`DashboardPage.tsx`)**
- Cleaner metric cards with subtle left-border accents
- Better chart styling with grid lines
- Professional empty states

**5. Mobile responsiveness (all pages)**
- Responsive sidebar: sheet/drawer on mobile, persistent on desktop
- Stack grids to single column on mobile
- Tables become card-based lists on small screens
- Touch-friendly tap targets (min 44px)
- Responsive padding (p-4 on mobile, p-6 on desktop)
- Calendar cells smaller on mobile
- Dialog becomes full-screen drawer on mobile
- Hide secondary columns in tables on mobile

**6. All sub-pages mobile fixes**
- `AppointmentsPage`: Calendar responsive, list view cards on mobile
- `CustomersPage`: Hide stats columns on mobile, stack filters
- `ServicesPage`: Single column cards on mobile
- `MessagesPage`: Slide-over conversation panel on mobile
- `AnalyticsPage`: Stack charts vertically, smaller chart heights
- `StaffPage`, `InventoryPage`, `MarketingPage`, `SettingsPage`: Responsive grids

### Files to modify
- `src/index.css` -- New color palette + fonts
- `tailwind.config.ts` -- Updated font families
- `src/components/AppSidebar.tsx` -- Dark sidebar theme
- `src/components/DashboardLayout.tsx` -- Enhanced header with mobile support
- `src/pages/dashboard/DashboardPage.tsx` -- Refined cards, mobile grid
- `src/pages/appointments/AppointmentsPage.tsx` -- Mobile calendar + responsive table
- `src/pages/customers/CustomersPage.tsx` -- Responsive list
- `src/pages/services/ServicesPage.tsx` -- Responsive grid
- `src/pages/messages/MessagesPage.tsx` -- Mobile conversation view
- `src/pages/analytics/AnalyticsPage.tsx` -- Responsive charts
- `src/pages/staff/StaffPage.tsx` -- Responsive layout
- `src/pages/inventory/InventoryPage.tsx` -- Responsive layout
- `src/pages/marketing/MarketingPage.tsx` -- Responsive layout
- `src/pages/settings/SettingsPage.tsx` -- Responsive layout
- `src/pages/requests/BookingRequestsPage.tsx` -- Responsive layout

