// Mock data for all pages (replaces Python backend API calls)

export const mockStats = {
  today_revenue: 485.50,
  today_bookings: 8,
  today_completed: 5,
  average_rating: 4.7,
  total_reviews: 142,
  pending_requests: 3,
  week_revenue: [
    { date: '2026-03-02', revenue: 320, bookings: 5, label: 'Mon' },
    { date: '2026-03-03', revenue: 450, bookings: 7, label: 'Tue' },
    { date: '2026-03-04', revenue: 380, bookings: 6, label: 'Wed' },
    { date: '2026-03-05', revenue: 520, bookings: 8, label: 'Thu' },
    { date: '2026-03-06', revenue: 410, bookings: 6, label: 'Fri' },
    { date: '2026-03-07', revenue: 290, bookings: 4, label: 'Sat' },
    { date: '2026-03-08', revenue: 485, bookings: 8, label: 'Sun' },
  ],
};

export const mockTodayBookings = [
  { id: '1', service_name: 'Full Grooming', customer_name: 'Sarah Miller', pet_name: 'Bella', start_time: '2026-03-08T09:00:00', status: 'completed', booking_date: '2026-03-08', total_price: 65, customer_email: 'sarah@email.com', pet_species: 'Dog', pet_breed: 'Golden Retriever' },
  { id: '2', service_name: 'Vet Checkup', customer_name: 'John Davis', pet_name: 'Max', start_time: '2026-03-08T10:30:00', status: 'completed', booking_date: '2026-03-08', total_price: 85, customer_email: 'john@email.com', pet_species: 'Dog', pet_breed: 'German Shepherd' },
  { id: '3', service_name: 'Nail Trimming', customer_name: 'Emily Rose', pet_name: 'Luna', start_time: '2026-03-08T11:00:00', status: 'in_progress', booking_date: '2026-03-08', total_price: 25, customer_email: 'emily@email.com', pet_species: 'Cat', pet_breed: 'Persian' },
  { id: '4', service_name: 'Training Session', customer_name: 'Mike Park', pet_name: 'Charlie', start_time: '2026-03-08T13:00:00', status: 'confirmed', booking_date: '2026-03-08', total_price: 120, customer_email: 'mike@email.com', pet_species: 'Dog', pet_breed: 'Labrador' },
  { id: '5', service_name: 'Bath & Blow Dry', customer_name: 'Anna Kim', pet_name: 'Daisy', start_time: '2026-03-08T14:30:00', status: 'pending', booking_date: '2026-03-08', total_price: 45, customer_email: 'anna@email.com', pet_species: 'Dog', pet_breed: 'Poodle' },
  { id: '6', service_name: 'Dental Cleaning', customer_name: 'Tom Brown', pet_name: 'Rocky', start_time: '2026-03-08T15:00:00', status: 'confirmed', booking_date: '2026-03-08', total_price: 95, customer_email: 'tom@email.com', pet_species: 'Dog', pet_breed: 'Bulldog' },
];

export const mockBookings = [
  ...mockTodayBookings,
  { id: '7', service_name: 'Grooming', customer_name: 'Lisa Wong', pet_name: 'Milo', start_time: '2026-03-09T09:00:00', status: 'confirmed', booking_date: '2026-03-09', total_price: 55, customer_email: 'lisa@email.com', pet_species: 'Cat', pet_breed: 'Siamese' },
  { id: '8', service_name: 'Boarding', customer_name: 'Sarah Miller', pet_name: 'Bella', start_time: '2026-03-10T08:00:00', status: 'pending', booking_date: '2026-03-10', total_price: 150, customer_email: 'sarah@email.com', pet_species: 'Dog', pet_breed: 'Golden Retriever' },
  { id: '9', service_name: 'Training', customer_name: 'David Lee', pet_name: 'Cooper', start_time: '2026-03-07T10:00:00', status: 'completed', booking_date: '2026-03-07', total_price: 80, customer_email: 'david@email.com', pet_species: 'Dog', pet_breed: 'Beagle' },
  { id: '10', service_name: 'Vet Visit', customer_name: 'Jane Smith', pet_name: 'Whiskers', start_time: '2026-03-06T14:00:00', status: 'completed', booking_date: '2026-03-06', total_price: 110, customer_email: 'jane@email.com', pet_species: 'Cat', pet_breed: 'Maine Coon' },
];

export const mockPendingRequests = [
  { id: 'r1', customer_name: 'New Customer', service_name: 'Full Grooming', preferred_date: 'Mar 12, 2026', is_urgent: false, status: 'pending', customer_email: 'new@email.com', pet_name: 'Buddy', pet_species: 'Dog', notes: 'First time visit' },
  { id: 'r2', customer_name: 'Maria Garcia', service_name: 'Emergency Dental', preferred_date: 'Mar 9, 2026', is_urgent: true, status: 'pending', customer_email: 'maria@email.com', pet_name: 'Shadow', pet_species: 'Cat', notes: 'Urgent dental issue' },
  { id: 'r3', customer_name: 'Robert Chen', service_name: 'Boarding (5 days)', preferred_date: 'Mar 15-20, 2026', is_urgent: false, status: 'pending', customer_email: 'robert@email.com', pet_name: 'Zeus', pet_species: 'Dog', notes: 'Going on vacation' },
];

export const mockCustomers = [
  { customer_name: 'Sarah Miller', customer_email: 'sarah@email.com', tier: 'vip', total_spent: 2450, total_bookings: 32, pets: ['Bella', 'Coco'], first_booking_date: '2024-06-15', last_booking_date: '2026-03-08' },
  { customer_name: 'John Davis', customer_email: 'john@email.com', tier: 'loyal', total_spent: 1820, total_bookings: 24, pets: ['Max'], first_booking_date: '2024-09-01', last_booking_date: '2026-03-08' },
  { customer_name: 'Emily Rose', customer_email: 'emily@email.com', tier: 'regular', total_spent: 890, total_bookings: 12, pets: ['Luna', 'Star'], first_booking_date: '2025-01-10', last_booking_date: '2026-03-05' },
  { customer_name: 'Mike Park', customer_email: 'mike@email.com', tier: 'loyal', total_spent: 1560, total_bookings: 18, pets: ['Charlie'], first_booking_date: '2024-11-20', last_booking_date: '2026-03-08' },
  { customer_name: 'Anna Kim', customer_email: 'anna@email.com', tier: 'regular', total_spent: 720, total_bookings: 9, pets: ['Daisy'], first_booking_date: '2025-03-05', last_booking_date: '2026-03-07' },
  { customer_name: 'Tom Brown', customer_email: 'tom@email.com', tier: 'new', total_spent: 190, total_bookings: 2, pets: ['Rocky'], first_booking_date: '2026-02-15', last_booking_date: '2026-03-08' },
  { customer_name: 'Lisa Wong', customer_email: 'lisa@email.com', tier: 'regular', total_spent: 640, total_bookings: 8, pets: ['Milo'], first_booking_date: '2025-06-01', last_booking_date: '2026-03-06' },
  { customer_name: 'David Lee', customer_email: 'david@email.com', tier: 'new', total_spent: 160, total_bookings: 2, pets: ['Cooper'], first_booking_date: '2026-01-20', last_booking_date: '2026-03-07' },
];

export const mockServices = [
  { id: 's1', name: 'Full Grooming', category: 'grooming', base_price: 65, price_type: 'fixed', duration_minutes: 90, buffer_minutes: 15, pet_types_accepted: ['dog', 'cat'], vaccination_required: true, is_active: true, max_bookings_per_day: 6, total_bookings: 145, description: 'Complete grooming including bath, haircut, and nail trim' },
  { id: 's2', name: 'Bath & Blow Dry', category: 'grooming', base_price: 45, price_type: 'fixed', duration_minutes: 60, buffer_minutes: 10, pet_types_accepted: ['dog', 'cat'], vaccination_required: false, is_active: true, max_bookings_per_day: 8, total_bookings: 98, description: 'Relaxing bath with premium shampoo and blow dry' },
  { id: 's3', name: 'Nail Trimming', category: 'grooming', base_price: 25, price_type: 'fixed', duration_minutes: 20, buffer_minutes: 5, pet_types_accepted: ['dog', 'cat'], vaccination_required: false, is_active: true, max_bookings_per_day: 15, total_bookings: 210, description: 'Quick and safe nail trimming' },
  { id: 's4', name: 'Training Session', category: 'training', base_price: 120, price_type: 'fixed', duration_minutes: 60, buffer_minutes: 15, pet_types_accepted: ['dog'], vaccination_required: true, is_active: true, max_bookings_per_day: 4, total_bookings: 67, description: 'One-on-one obedience training' },
  { id: 's5', name: 'Dental Cleaning', category: 'dental', base_price: 95, price_type: 'fixed', duration_minutes: 45, buffer_minutes: 15, pet_types_accepted: ['dog', 'cat'], vaccination_required: true, is_active: true, max_bookings_per_day: 4, total_bookings: 52, description: 'Professional dental cleaning and checkup' },
  { id: 's6', name: 'Boarding (Per Night)', category: 'boarding', base_price: 50, price_type: 'per_night', duration_minutes: 1440, buffer_minutes: 0, pet_types_accepted: ['dog', 'cat'], vaccination_required: true, is_active: true, max_bookings_per_day: 10, total_bookings: 89, description: 'Comfortable overnight boarding' },
];

export const mockStaff = [
  { id: 'st1', full_name: 'Jessica Adams', email: 'jessica@petdash.com', phone: '+1234567890', role: 'owner', title: 'Owner & Lead Groomer', hourly_rate: null, max_daily_bookings: 8, average_rating: 4.9, total_services_completed: 580, specializations: ['grooming', 'dental'] },
  { id: 'st2', full_name: 'Carlos Rivera', email: 'carlos@petdash.com', phone: '+1234567891', role: 'manager', title: 'Operations Manager', hourly_rate: 28, max_daily_bookings: 6, average_rating: 4.7, total_services_completed: 320, specializations: ['training', 'boarding'] },
  { id: 'st3', full_name: 'Aisha Patel', email: 'aisha@petdash.com', phone: '+1234567892', role: 'staff', title: 'Senior Groomer', hourly_rate: 22, max_daily_bookings: 8, average_rating: 4.8, total_services_completed: 415, specializations: ['grooming'] },
  { id: 'st4', full_name: 'Ryan O\'Brien', email: 'ryan@petdash.com', phone: '+1234567893', role: 'part_time', title: 'Dog Trainer', hourly_rate: 25, max_daily_bookings: 4, average_rating: 4.6, total_services_completed: 180, specializations: ['training'] },
];

export const mockAnalytics = {
  total_revenue: 12450,
  total_bookings: 186,
  total_customers: 48,
  avg_booking_value: 67,
  daily_revenue: [
    { date: '2026-02-06', revenue: 320 }, { date: '2026-02-07', revenue: 450 },
    { date: '2026-02-08', revenue: 280 }, { date: '2026-02-09', revenue: 390 },
    { date: '2026-02-10', revenue: 510 }, { date: '2026-02-11', revenue: 420 },
    { date: '2026-02-12', revenue: 350 }, { date: '2026-02-13', revenue: 480 },
    { date: '2026-02-14', revenue: 560 }, { date: '2026-02-15', revenue: 310 },
    { date: '2026-02-16', revenue: 440 }, { date: '2026-02-17', revenue: 370 },
    { date: '2026-02-18', revenue: 520 }, { date: '2026-02-19', revenue: 490 },
    { date: '2026-02-20', revenue: 380 }, { date: '2026-02-21', revenue: 410 },
    { date: '2026-02-22', revenue: 340 }, { date: '2026-02-23', revenue: 460 },
    { date: '2026-02-24', revenue: 530 }, { date: '2026-02-25', revenue: 290 },
    { date: '2026-02-26', revenue: 400 }, { date: '2026-02-27', revenue: 470 },
    { date: '2026-02-28', revenue: 380 }, { date: '2026-03-01', revenue: 510 },
    { date: '2026-03-02', revenue: 320 }, { date: '2026-03-03', revenue: 450 },
    { date: '2026-03-04', revenue: 380 }, { date: '2026-03-05', revenue: 520 },
    { date: '2026-03-06', revenue: 410 }, { date: '2026-03-07', revenue: 290 },
  ],
  daily_bookings: [
    { date: '2026-02-06', bookings: 5 }, { date: '2026-02-07', bookings: 7 },
    { date: '2026-02-08', bookings: 4 }, { date: '2026-02-09', bookings: 6 },
    { date: '2026-02-10', bookings: 8 }, { date: '2026-02-11', bookings: 6 },
    { date: '2026-02-12', bookings: 5 }, { date: '2026-02-13', bookings: 7 },
    { date: '2026-02-14', bookings: 9 }, { date: '2026-02-15', bookings: 5 },
    { date: '2026-02-16', bookings: 6 }, { date: '2026-02-17', bookings: 5 },
    { date: '2026-02-18', bookings: 8 }, { date: '2026-02-19', bookings: 7 },
    { date: '2026-02-20', bookings: 6 }, { date: '2026-02-21', bookings: 6 },
    { date: '2026-02-22', bookings: 5 }, { date: '2026-02-23', bookings: 7 },
    { date: '2026-02-24', bookings: 8 }, { date: '2026-02-25', bookings: 4 },
    { date: '2026-02-26', bookings: 6 }, { date: '2026-02-27', bookings: 7 },
    { date: '2026-02-28', bookings: 6 }, { date: '2026-03-01', bookings: 8 },
    { date: '2026-03-02', bookings: 5 }, { date: '2026-03-03', bookings: 7 },
    { date: '2026-03-04', bookings: 6 }, { date: '2026-03-05', bookings: 8 },
    { date: '2026-03-06', bookings: 6 }, { date: '2026-03-07', bookings: 4 },
  ],
  status_distribution: { completed: 120, confirmed: 30, pending: 15, cancelled: 12, in_progress: 9 },
  day_of_week: [
    { day: 'Mon', bookings: 28 }, { day: 'Tue', bookings: 32 },
    { day: 'Wed', bookings: 26 }, { day: 'Thu', bookings: 35 },
    { day: 'Fri', bookings: 30 }, { day: 'Sat', bookings: 22 },
    { day: 'Sun', bookings: 13 },
  ],
  top_services: [
    { name: 'Full Grooming', revenue: 4250, bookings: 65 },
    { name: 'Training Session', revenue: 2880, bookings: 24 },
    { name: 'Dental Cleaning', revenue: 1900, bookings: 20 },
    { name: 'Boarding', revenue: 1750, bookings: 35 },
    { name: 'Bath & Blow Dry', revenue: 1350, bookings: 30 },
    { name: 'Nail Trimming', revenue: 320, bookings: 12 },
  ],
  top_customers: [
    { name: 'Sarah Miller', email: 'sarah@email.com', revenue: 2450, bookings: 32 },
    { name: 'John Davis', email: 'john@email.com', revenue: 1820, bookings: 24 },
    { name: 'Mike Park', email: 'mike@email.com', revenue: 1560, bookings: 18 },
    { name: 'Emily Rose', email: 'emily@email.com', revenue: 890, bookings: 12 },
    { name: 'Anna Kim', email: 'anna@email.com', revenue: 720, bookings: 9 },
  ],
};

export const mockInventory = [
  { id: 'inv1', name: 'Premium Dog Shampoo', category: 'grooming_supplies', quantity_in_stock: 24, reorder_point: 10, cost_per_unit: 8.50, retail_price: 15.99, supplier_name: 'PetCare Pro' },
  { id: 'inv2', name: 'Professional Clippers', category: 'equipment', quantity_in_stock: 5, reorder_point: 2, cost_per_unit: 120, retail_price: null, supplier_name: 'GroomTech' },
  { id: 'inv3', name: 'Dog Treats (Training)', category: 'retail', quantity_in_stock: 48, reorder_point: 20, cost_per_unit: 3.50, retail_price: 7.99, supplier_name: 'PetSnacks Inc' },
  { id: 'inv4', name: 'Dental Cleaning Kit', category: 'medical', quantity_in_stock: 3, reorder_point: 5, cost_per_unit: 45, retail_price: null, supplier_name: 'VetSupply Co' },
  { id: 'inv5', name: 'Floor Disinfectant', category: 'cleaning', quantity_in_stock: 12, reorder_point: 6, cost_per_unit: 12, retail_price: null, supplier_name: 'CleanPro' },
  { id: 'inv6', name: 'Cat Conditioner', category: 'grooming_supplies', quantity_in_stock: 8, reorder_point: 10, cost_per_unit: 11, retail_price: 18.99, supplier_name: 'PetCare Pro' },
];

export const mockCampaigns = [
  { id: 'c1', name: 'Spring Grooming Special', type: 'seasonal', description: '20% off all grooming services', discount_type: 'percentage', discount_value: 20, promo_code: 'SPRING20', target_audience: 'all', start_date: '2026-03-01', end_date: '2026-03-31', max_redemptions: 100, redemptions: 23, views: 450, status: 'active' },
  { id: 'c2', name: 'New Customer Welcome', type: 'first_time', description: 'First visit 15% off', discount_type: 'percentage', discount_value: 15, promo_code: 'WELCOME15', target_audience: 'new', start_date: '2026-01-01', end_date: '2026-12-31', max_redemptions: null, redemptions: 45, views: 820, status: 'active' },
  { id: 'c3', name: 'Refer a Friend', type: 'referral', description: 'Get €10 for each referral', discount_type: 'fixed', discount_value: 10, promo_code: 'REFER10', target_audience: 'all', start_date: '2026-02-01', end_date: '2026-06-30', max_redemptions: 200, redemptions: 12, views: 310, status: 'active' },
];

export const mockMessages = [
  { customer_email: 'sarah@email.com', customer_name: 'Sarah Miller', last_message: 'Thanks! See you tomorrow for Bella\'s grooming.', last_message_time: '2026-03-08T14:30:00', unread_count: 0 },
  { customer_email: 'john@email.com', customer_name: 'John Davis', last_message: 'Can I reschedule Max\'s appointment?', last_message_time: '2026-03-08T12:15:00', unread_count: 1 },
  { customer_email: 'emily@email.com', customer_name: 'Emily Rose', last_message: 'What vaccinations does Luna need for boarding?', last_message_time: '2026-03-07T16:45:00', unread_count: 1 },
  { customer_email: 'mike@email.com', customer_name: 'Mike Park', last_message: 'Charlie did great in training today!', last_message_time: '2026-03-07T11:00:00', unread_count: 0 },
];

export const mockThread = [
  { id: 'm1', content: 'Hi! I\'d like to book Bella for grooming this Friday.', sender: 'customer', created_at: '2026-03-07T09:00:00' },
  { id: 'm2', content: 'Of course! We have a 9:00 AM slot available. Would that work?', sender: 'provider', created_at: '2026-03-07T09:15:00' },
  { id: 'm3', content: 'Perfect! Please book it.', sender: 'customer', created_at: '2026-03-07T09:20:00' },
  { id: 'm4', content: 'Done! You\'re all set for Friday at 9 AM. See you then!', sender: 'provider', created_at: '2026-03-07T09:25:00' },
  { id: 'm5', content: 'Thanks! See you tomorrow for Bella\'s grooming.', sender: 'customer', created_at: '2026-03-08T14:30:00' },
];
