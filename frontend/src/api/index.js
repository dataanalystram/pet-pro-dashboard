import axios from 'axios';

const API_BASE = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('paw_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('paw_token');
      localStorage.removeItem('paw_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ──────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// ─── Provider ──────────────────────────
export const providerAPI = {
  getProfile: () => api.get('/provider/profile'),
  updateProfile: (data) => api.put('/provider/profile', data),
  onboard: (data) => api.post('/provider/onboarding', data),
};

// ─── Services ──────────────────────────
export const servicesAPI = {
  list: () => api.get('/provider/services'),
  create: (data) => api.post('/provider/services', data),
  update: (id, data) => api.put(`/provider/services/${id}`, data),
  remove: (id) => api.delete(`/provider/services/${id}`),
};

// ─── Bookings ──────────────────────────
export const bookingsAPI = {
  list: (params) => api.get('/provider/bookings', { params }),
  get: (id) => api.get(`/provider/bookings/${id}`),
  create: (data) => api.post('/provider/bookings', data),
  updateStatus: (id, data) => api.put(`/provider/bookings/${id}/status`, data),
};

// ─── Booking Requests ──────────────────
export const requestsAPI = {
  list: (params) => api.get('/provider/booking-requests', { params }),
  create: (data) => api.post('/provider/booking-requests', data),
  action: (id, data) => api.put(`/provider/booking-requests/${id}/action`, data),
};

// ─── Dashboard ─────────────────────────
export const dashboardAPI = {
  stats: () => api.get('/provider/dashboard/stats'),
  todaySchedule: () => api.get('/provider/dashboard/today'),
};

// ─── Customers ─────────────────────────
export const customersAPI = {
  list: () => api.get('/provider/customers'),
};

// ─── Staff ─────────────────────────────
export const staffAPI = {
  list: () => api.get('/provider/staff'),
  create: (data) => api.post('/provider/staff', data),
  update: (id, data) => api.put(`/provider/staff/${id}`, data),
  remove: (id) => api.delete(`/provider/staff/${id}`),
};

// ─── Inventory ─────────────────────────
export const inventoryAPI = {
  list: () => api.get('/provider/inventory'),
  create: (data) => api.post('/provider/inventory', data),
  update: (id, data) => api.put(`/provider/inventory/${id}`, data),
  adjust: (id, data) => api.put(`/provider/inventory/${id}/adjust`, data),
  remove: (id) => api.delete(`/provider/inventory/${id}`),
};

// ─── Marketing ─────────────────────────
export const marketingAPI = {
  list: () => api.get('/provider/marketing'),
  create: (data) => api.post('/provider/marketing', data),
  update: (id, data) => api.put(`/provider/marketing/${id}`, data),
  remove: (id) => api.delete(`/provider/marketing/${id}`),
};

// ─── Messages ──────────────────────────
export const messagesAPI = {
  conversations: () => api.get('/provider/messages'),
  thread: (email) => api.get(`/provider/messages/${encodeURIComponent(email)}`),
  send: (data) => api.post('/provider/messages', data),
};

// ─── Analytics ─────────────────────────
export const analyticsAPI = {
  get: (period) => api.get('/provider/analytics', { params: { period } }),
};

// ─── Settings ──────────────────────────
export const settingsAPI = {
  get: () => api.get('/provider/settings'),
  update: (data) => api.put('/provider/settings', data),
};

// ─── Search ────────────────────────────
export const searchAPI = {
  query: (q) => api.get('/provider/search', { params: { q } }),
};

// ─── Notifications ─────────────────────
export const notificationsAPI = {
  list: () => api.get('/provider/notifications'),
  readAll: () => api.put('/provider/notifications/read-all'),
};

// ─── Seed ──────────────────────────────
export const seedAPI = {
  seed: () => api.post('/seed'),
  seedVet: () => api.post('/vet/seed'),
  seedShelter: () => api.post('/shelter/seed'),
};

// ─── CSV Import ────────────────────────
export const importAPI = {
  csv: (collection, rows, productType) => api.post('/import/csv', { collection, rows, product_type: productType }),
};

// ═══════════════════════════════════════════════
// VET CLINIC APIs
// ═══════════════════════════════════════════════

export const vetAPI = {
  // Clinic
  onboard: (data) => api.post('/vet/onboarding', data),
  getClinic: () => api.get('/vet/clinic'),
  updateClinic: (data) => api.put('/vet/clinic', data),
  // Staff
  getStaff: () => api.get('/vet/staff'),
  createStaff: (data) => api.post('/vet/staff', data),
  // Clients
  getClients: () => api.get('/vet/clients'),
  getClient: (id) => api.get(`/vet/clients/${id}`),
  createClient: (data) => api.post('/vet/clients', data),
  // Patients
  getPatients: () => api.get('/vet/patients'),
  getPatient: (id) => api.get(`/vet/patients/${id}`),
  createPatient: (data) => api.post('/vet/patients', data),
  updatePatient: (id, data) => api.put(`/vet/patients/${id}`, data),
  // Appointments
  getAppointments: (params) => api.get('/vet/appointments', { params }),
  createAppointment: (data) => api.post('/vet/appointments', data),
  updateAppointment: (id, data) => api.put(`/vet/appointments/${id}`, data),
  // Medical Records (SOAP)
  getMedicalRecords: (params) => api.get('/vet/medical-records', { params }),
  getMedicalRecord: (id) => api.get(`/vet/medical-records/${id}`),
  createMedicalRecord: (data) => api.post('/vet/medical-records', data),
  updateMedicalRecord: (id, data) => api.put(`/vet/medical-records/${id}`, data),
  // Prescriptions
  getPrescriptions: (params) => api.get('/vet/prescriptions', { params }),
  createPrescription: (data) => api.post('/vet/prescriptions', data),
  // Vaccinations
  getVaccinations: (params) => api.get('/vet/vaccinations', { params }),
  createVaccination: (data) => api.post('/vet/vaccinations', data),
  // Inventory
  getInventory: () => api.get('/vet/inventory'),
  createInventory: (data) => api.post('/vet/inventory', data),
  // Invoices
  getInvoices: () => api.get('/vet/invoices'),
  createInvoice: (data) => api.post('/vet/invoices', data),
  // Dashboard
  getDashboardStats: () => api.get('/vet/dashboard/stats'),
};

// ═══════════════════════════════════════════════
// SHELTER APIs
// ═══════════════════════════════════════════════

export const shelterAPI = {
  // Profile
  onboard: (data) => api.post('/shelter/onboarding', data),
  getProfile: () => api.get('/shelter/profile'),
  updateProfile: (data) => api.put('/shelter/profile', data),
  // Animals
  getAnimals: (params) => api.get('/shelter/animals', { params }),
  getAnimal: (id) => api.get(`/shelter/animals/${id}`),
  createAnimal: (data) => api.post('/shelter/animals', data),
  updateAnimal: (id, data) => api.put(`/shelter/animals/${id}`, data),
  // Applications
  getApplications: (params) => api.get('/shelter/applications', { params }),
  createApplication: (data) => api.post('/shelter/applications', data),
  updateApplication: (id, data) => api.put(`/shelter/applications/${id}`, data),
  // Volunteers
  getVolunteers: () => api.get('/shelter/volunteers'),
  createVolunteer: (data) => api.post('/shelter/volunteers', data),
  updateVolunteer: (id, data) => api.put(`/shelter/volunteers/${id}`, data),
  // Tasks
  getTasks: (params) => api.get('/shelter/tasks', { params }),
  createTask: (data) => api.post('/shelter/tasks', data),
  updateTask: (id, data) => api.put(`/shelter/tasks/${id}`, data),
  // Medical
  getMedical: (params) => api.get('/shelter/medical', { params }),
  createMedical: (data) => api.post('/shelter/medical', data),
  // Donations
  getDonations: () => api.get('/shelter/donations'),
  createDonation: (data) => api.post('/shelter/donations', data),
  // Activity
  getActivity: (params) => api.get('/shelter/activity', { params }),
  // Campaigns
  getCampaigns: () => api.get('/shelter/campaigns'),
  createCampaign: (data) => api.post('/shelter/campaigns', data),
  // Dashboard
  getDashboardStats: () => api.get('/shelter/dashboard/stats'),
  // People / CRM
  getPeople: (params) => api.get('/shelter/people', { params }),
  createPerson: (data) => api.post('/shelter/people', data),
  updatePerson: (id, data) => api.put(`/shelter/people/${id}`, data),
  deletePerson: (id) => api.delete(`/shelter/people/${id}`),
  getPersonHistory: (id) => api.get(`/shelter/people/${id}/history`),
  // Partners
  getPartners: (params) => api.get('/shelter/partners', { params }),
  createPartner: (data) => api.post('/shelter/partners', data),
  updatePartner: (id, data) => api.put(`/shelter/partners/${id}`, data),
  deletePartner: (id) => api.delete(`/shelter/partners/${id}`),
  // Animal Notes
  getAnimalNotes: (animalId) => api.get(`/shelter/animals/${animalId}/notes`),
  createAnimalNote: (animalId, data) => api.post(`/shelter/animals/${animalId}/notes`, data),
  deleteAnimalNote: (animalId, noteId) => api.delete(`/shelter/animals/${animalId}/notes/${noteId}`),
  // Outcome
  createOutcome: (animalId, data) => api.post(`/shelter/animals/${animalId}/outcome`, data),
  // Reports
  getIntakeByMonth: (params) => api.get('/shelter/reports/intake-by-month', { params }),
  getOutcomeByMonth: (params) => api.get('/shelter/reports/outcome-by-month', { params }),
  // Medical Reminders
  getMedicalReminders: () => api.get('/shelter/medical-reminders'),
  createMedicalReminder: (data) => api.post('/shelter/medical-reminders', data),

  // ═══════════════════════════════════════════════
  // NEW EXTENDED FEATURES
  // ═══════════════════════════════════════════════

  // File Upload
  uploadFile: (formData) => api.post('/shelter/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getFile: (fileId) => api.get(`/shelter/files/${fileId}`),
  getFileDownload: (fileId) => api.get(`/shelter/files/${fileId}/download`, { responseType: 'blob' }),
  deleteFile: (fileId) => api.delete(`/shelter/files/${fileId}`),
  getEntityFiles: (entityType, entityId) => api.get(`/shelter/entities/${entityType}/${entityId}/files`),

  // Foster Management
  getFosters: (params) => api.get('/shelter/fosters', { params }),
  createFoster: (data) => api.post('/shelter/fosters', data),
  updateFoster: (id, data) => api.put(`/shelter/fosters/${id}`, data),
  addFosterNote: (id, data) => api.post(`/shelter/fosters/${id}/notes`, data),

  // Kennel/Location Management
  getLocations: () => api.get('/shelter/locations'),
  createLocation: (data) => api.post('/shelter/locations', data),
  updateLocation: (id, data) => api.put(`/shelter/locations/${id}`, data),
  deleteLocation: (id) => api.delete(`/shelter/locations/${id}`),
  moveAnimal: (animalId, data) => api.post(`/shelter/animals/${animalId}/move`, data),
  getAnimalMovements: (animalId) => api.get(`/shelter/animals/${animalId}/movements`),

  // Lost & Found
  getLostFound: (params) => api.get('/shelter/lost-found', { params }),
  createLostFound: (data) => api.post('/shelter/lost-found', data),
  updateLostFound: (id, data) => api.put(`/shelter/lost-found/${id}`, data),
  matchLostFound: (id, data) => api.post(`/shelter/lost-found/${id}/match`, data),

  // Volunteer Shifts
  getShifts: (params) => api.get('/shelter/shifts', { params }),
  createShift: (data) => api.post('/shelter/shifts', data),
  updateShift: (id, data) => api.put(`/shelter/shifts/${id}`, data),
  checkInShift: (id) => api.post(`/shelter/shifts/${id}/check-in`),
  checkOutShift: (id, data) => api.post(`/shelter/shifts/${id}/check-out`, data),
  deleteShift: (id) => api.delete(`/shelter/shifts/${id}`),

  // Notifications
  getNotifications: (params) => api.get('/shelter/notifications', { params }),
  createNotification: (data) => api.post('/shelter/notifications', data),
  markNotificationRead: (id) => api.put(`/shelter/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/shelter/notifications/read-all'),
  getNotificationCount: () => api.get('/shelter/notifications/count'),

  // E-Contracts
  getContracts: () => api.get('/shelter/contracts'),
  createContract: (data) => api.post('/shelter/contracts', data),
  updateContract: (id, data) => api.put(`/shelter/contracts/${id}`, data),
  getSignedContracts: (params) => api.get('/shelter/signed-contracts', { params }),
  signContract: (data) => api.post('/shelter/signed-contracts', data),

  // Enhanced Analytics
  getAnalyticsSummary: (period) => api.get('/shelter/analytics/summary', { params: { period } }),
  getAnalyticsTrends: () => api.get('/shelter/analytics/trends'),
};

// ═══════════════════════════════════════════════
// PUBLIC SHELTER PORTAL (No Auth)
// ═══════════════════════════════════════════════

export const publicShelterAPI = {
  getAnimals: (shelterId, params) => api.get(`/public/shelter/${shelterId}/animals`, { params }),
  getAnimal: (shelterId, animalId) => api.get(`/public/shelter/${shelterId}/animals/${animalId}`),
  getShelterInfo: (shelterId) => api.get(`/public/shelter/${shelterId}/info`),
  submitApplication: (shelterId, data) => api.post(`/public/shelter/${shelterId}/apply`, data),
};

export default api;
