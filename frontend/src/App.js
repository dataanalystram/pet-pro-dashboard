import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import ProviderLayout from '@/components/layout/ProviderLayout';
import VetClinicLayout from '@/components/layout/VetClinicLayout';
import ShelterLayout from '@/components/layout/ShelterLayout';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import OnboardingPage from '@/pages/onboarding/OnboardingPage';
import ProductSelectPage from '@/pages/product-select/ProductSelectPage';
// Provider pages
import DashboardPage from '@/pages/dashboard/DashboardPage';
import AppointmentsPage from '@/pages/appointments/AppointmentsPage';
import BookingRequestsPage from '@/pages/booking-requests/BookingRequestsPage';
import CustomersPage from '@/pages/customers/CustomersPage';
import MessagesPage from '@/pages/messages/MessagesPage';
import AnalyticsPage from '@/pages/analytics/AnalyticsPage';
import StaffPage from '@/pages/staff/StaffPage';
import ServicesPage from '@/pages/services/ServicesPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import InventoryPage from '@/pages/inventory/InventoryPage';
import MarketingPage from '@/pages/marketing/MarketingPage';
// Vet Clinic pages
import VetDashboard from '@/pages/vet/VetDashboard';
import VetPatients from '@/pages/vet/VetPatients';
import VetPatientDetail from '@/pages/vet/VetPatientDetail';
import VetAppointments from '@/pages/vet/VetAppointments';
import VetRecords from '@/pages/vet/VetRecords';
import VetPrescriptions from '@/pages/vet/VetPrescriptions';
import VetVaccinations from '@/pages/vet/VetVaccinations';
import VetInventory from '@/pages/vet/VetInventory';
import VetBilling from '@/pages/vet/VetBilling';
import VetStaff from '@/pages/vet/VetStaff';
import VetClients from '@/pages/vet/VetClients';
import VetSettings from '@/pages/vet/VetSettings';
import VetFlowBoard from '@/pages/vet/VetFlowBoard';
// Shelter pages
import ShelterDashboard from '@/pages/shelter/ShelterDashboard';
import ShelterAnimals from '@/pages/shelter/ShelterAnimals';
import ShelterAnimalDetail from '@/pages/shelter/ShelterAnimalDetail';
import ShelterApplications from '@/pages/shelter/ShelterApplications';
import ShelterVolunteers from '@/pages/shelter/ShelterVolunteers';
import ShelterDailyOps from '@/pages/shelter/ShelterDailyOps';
import ShelterDonations from '@/pages/shelter/ShelterDonations';
import ShelterMedical from '@/pages/shelter/ShelterMedical';
import ShelterActivityLog from '@/pages/shelter/ShelterActivityLog';
import ShelterSettings from '@/pages/shelter/ShelterSettings';
import ShelterPeople from '@/pages/shelter/ShelterPeople';
import ShelterPartners from '@/pages/shelter/ShelterPartners';
import ShelterReports from '@/pages/shelter/ShelterReports';
import ShelterFosters from '@/pages/shelter/ShelterFosters';
import ShelterLocations from '@/pages/shelter/ShelterLocations';
import ShelterLostFound from '@/pages/shelter/ShelterLostFound';
import ShelterShifts from '@/pages/shelter/ShelterShifts';
import ShelterContracts from '@/pages/shelter/ShelterContracts';
import ShelterAnalyticsPage from '@/pages/shelter/ShelterAnalyticsPage';

import { Toaster } from '@/components/ui/sonner';
import '@/App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function ProviderGuard({ children }) {
  const { provider, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!provider) return <Navigate to="/onboarding" replace />;
  return children;
}

function VetClinicGuard({ children }) {
  const { vetClinic, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!vetClinic) return <Navigate to="/onboarding?type=vet_clinic" replace />;
  return children;
}

function ShelterGuard({ children }) {
  const { shelter, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!shelter) return <Navigate to="/onboarding?type=shelter" replace />;
  return children;
}

function LoadingScreen() {
  return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 animate-pulse" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  );
}

function SmartRedirect() {
  const { activeProduct, provider, vetClinic, shelter } = useAuth();
  if (activeProduct === 'vet_clinic' && vetClinic) return <Navigate to="/vet" replace />;
  if (activeProduct === 'shelter' && shelter) return <Navigate to="/shelter" replace />;
  if (activeProduct === 'service_provider' && provider) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/select-product" replace />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <SmartRedirect /> : <LoginPage />} />
      <Route path="/register" element={user ? <SmartRedirect /> : <RegisterPage />} />
      <Route path="/select-product" element={<ProductSelectPage />} />
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

      {/* SERVICE PROVIDER */}
      <Route path="/dashboard" element={
        <ProtectedRoute><ProviderGuard><ProviderLayout /></ProviderGuard></ProtectedRoute>
      }>
        <Route index element={<DashboardPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="requests" element={<BookingRequestsPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="marketing" element={<MarketingPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* VET CLINIC */}
      <Route path="/vet" element={
        <ProtectedRoute><VetClinicGuard><VetClinicLayout /></VetClinicGuard></ProtectedRoute>
      }>
        <Route index element={<VetDashboard />} />
        <Route path="appointments" element={<VetAppointments />} />
        <Route path="patients" element={<VetPatients />} />
        <Route path="patients/:patientId" element={<VetPatientDetail />} />
        <Route path="clients" element={<VetClients />} />
        <Route path="records" element={<VetRecords />} />
        <Route path="prescriptions" element={<VetPrescriptions />} />
        <Route path="vaccinations" element={<VetVaccinations />} />
        <Route path="inventory" element={<VetInventory />} />
        <Route path="billing" element={<VetBilling />} />
        <Route path="staff" element={<VetStaff />} />
        <Route path="flow-board" element={<VetFlowBoard />} />
        <Route path="settings" element={<VetSettings />} />
      </Route>

      {/* SHELTER */}
      <Route path="/shelter" element={
        <ProtectedRoute><ShelterGuard><ShelterLayout /></ShelterGuard></ProtectedRoute>
      }>
        <Route index element={<ShelterDashboard />} />
        <Route path="animals" element={<ShelterAnimals />} />
        <Route path="animals/:animalId" element={<ShelterAnimalDetail />} />
        <Route path="applications" element={<ShelterApplications />} />
        <Route path="people" element={<ShelterPeople />} />
        <Route path="partners" element={<ShelterPartners />} />
        <Route path="volunteers" element={<ShelterVolunteers />} />
        <Route path="medical" element={<ShelterMedical />} />
        <Route path="daily-ops" element={<ShelterDailyOps />} />
        <Route path="donations" element={<ShelterDonations />} />
        <Route path="reports" element={<ShelterReports />} />
        <Route path="fosters" element={<ShelterFosters />} />
        <Route path="locations" element={<ShelterLocations />} />
        <Route path="lost-found" element={<ShelterLostFound />} />
        <Route path="shifts" element={<ShelterShifts />} />
        <Route path="contracts" element={<ShelterContracts />} />
        <Route path="analytics" element={<ShelterAnalyticsPage />} />
        <Route path="activity" element={<ShelterActivityLog />} />
        <Route path="settings" element={<ShelterSettings />} />
      </Route>

      <Route path="/" element={<Navigate to="/select-product" replace />} />
      <Route path="*" element={<Navigate to="/select-product" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
