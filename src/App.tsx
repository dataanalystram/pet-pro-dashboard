import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import AppointmentsPage from "@/pages/appointments/AppointmentsPage";
import CustomersPage from "@/pages/customers/CustomersPage";
import BookingRequestsPage from "@/pages/requests/BookingRequestsPage";
import ServicesPage from "@/pages/services/ServicesPage";
import MarketingPage from "@/pages/marketing/MarketingPage";
import InventoryPage from "@/pages/inventory/InventoryPage";
import OrdersPage from "@/pages/orders/OrdersPage";
import AnalyticsPage from "@/pages/analytics/AnalyticsPage";
import MessagesPage from "@/pages/messages/MessagesPage";
import StaffPage from "@/pages/staff/StaffPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import ReviewsPage from "@/pages/reviews/ReviewsPage";
import NotFound from "./pages/NotFound";
import PublicReviewPage from "./pages/reviews/PublicReviewPage";
import PublicBookingPage from "./pages/requests/PublicBookingPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout><DashboardPage /></DashboardLayout>} />
          <Route path="/appointments" element={<DashboardLayout><AppointmentsPage /></DashboardLayout>} />
          <Route path="/customers" element={<DashboardLayout><CustomersPage /></DashboardLayout>} />
          <Route path="/requests" element={<DashboardLayout><BookingRequestsPage /></DashboardLayout>} />
          <Route path="/services" element={<DashboardLayout><ServicesPage /></DashboardLayout>} />
          <Route path="/marketing" element={<DashboardLayout><MarketingPage /></DashboardLayout>} />
          <Route path="/inventory" element={<DashboardLayout><InventoryPage /></DashboardLayout>} />
          <Route path="/orders" element={<DashboardLayout><OrdersPage /></DashboardLayout>} />
          <Route path="/analytics" element={<DashboardLayout><AnalyticsPage /></DashboardLayout>} />
          <Route path="/messages" element={<DashboardLayout><MessagesPage /></DashboardLayout>} />
          <Route path="/staff" element={<DashboardLayout><StaffPage /></DashboardLayout>} />
          <Route path="/settings" element={<DashboardLayout><SettingsPage /></DashboardLayout>} />
          <Route path="/reviews" element={<DashboardLayout><ReviewsPage /></DashboardLayout>} />
          <Route path="/review/:serviceId" element={<PublicReviewPage />} />
          <Route path="/book/:serviceId" element={<PublicBookingPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
