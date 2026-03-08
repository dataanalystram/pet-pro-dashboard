# Paw Paradise - Multi-Product Platform PRD

## Overview
Paw Paradise is a unified platform with three independent products sharing auth, design system, and core framework.

**Last Updated**: December 2025

## Products

### 1. Service Provider Dashboard (Blue Theme) ✅
For pet service businesses — groomers, walkers, sitters, boarding, trainers
- Booking management & requests
- Customer CRM with tiers
- Staff scheduling
- Marketing campaigns
- Inventory management
- Revenue analytics
- **Demo**: demo@pawparadise.com / demo123

### 2. Vet Clinic Tool - PIMS (Teal Theme) ✅
Clinical practice management for licensed veterinary practices
- Dashboard with Appointment Flow Board (Scheduled → Completed)
- Patient management with client linking ✅ (Add Patient)
- SOAP Medical Records (Subjective, Objective, Assessment, Plan)
- Prescription management with dosage info
- Vaccination tracking with lot numbers, due dates
- Clinical inventory with low-stock alerts ✅ (Add Item)
- Billing & invoices
- Staff management with license numbers ✅ (Add Staff with color picker)
- Clients management ✅ (Add Client)
- Appointments ✅ (New Appointment)
- **Demo**: vet@pawparadise.com / demo123

### 3. Shelter Management System (Green Theme) ✅
Shelter & rescue operations management
- Dashboard with facility capacity, tasks, activity feed
- Animal management (card/list views, intake, detail pages) ✅ (New Intake wizard - 3 steps)
- Adoption Applications (Kanban pipeline: Submitted → Approved → Completed) ✅
- Volunteer management with hours tracking ✅ (Add Volunteer)
- Daily operations (task management with completion tracking) ✅ (Add Task)
- Medical center for animal records
- Donation tracking & fundraising ✅ (Record Donation)
- Activity log
- **Demo**: shelter@pawparadise.com / demo123

## Completed Features (December 2025)
- ✅ Multi-product authentication with One-Click Demo Login
- ✅ Product selector landing page with 3 product cards
- ✅ All 3 product logins working correctly
- ✅ Add/Create functionality for all key entities:
  - Vet: Staff, Patients, Clients, Appointments, Inventory
  - Shelter: Animals (3-step wizard), Volunteers, Tasks, Donations
  - Service Provider: Dashboard functional
- ✅ Responsive UI with Tailwind CSS
- ✅ Backend API tests: 100% pass rate (19/19 tests)

## Architecture
- **Auth**: Shared - users have product_type (service_provider, vet_clinic, shelter)
- **Routing**: /dashboard/* (provider), /vet/* (clinic), /shelter/* (shelter)
- **Product Switcher**: /select-product - unified UI to switch between products
- **Backend**: FastAPI + MongoDB (backend-agnostic, ready for Supabase migration)
- **Frontend**: React + Tailwind CSS + shadcn/ui

## Tech Stack
- Backend: FastAPI (Python) with MongoDB
- Frontend: React 18 + CRA + Tailwind CSS + shadcn/ui + Recharts
- Auth: JWT tokens with product_type support
- All routes prefixed with /api for Kubernetes ingress

## Backend Collections
### Vet Clinic
- vet_clinics, vet_staff, vet_clients, vet_patients
- vet_appointments, vet_medical_records (SOAP)
- vet_prescriptions, vet_vaccinations
- vet_inventory, vet_invoices

### Shelter
- shelters, shelter_animals, adoption_applications
- shelter_volunteers, shelter_daily_tasks
- shelter_medical_records, shelter_donations
- shelter_activity_log, shelter_campaigns

## P1 - Upcoming Tasks
- Drag-and-Drop for Kanban boards (Adoption Applications, Appointment Flow)
- CSV Import functionality for bulk data uploads
- Build out Service Provider core features

## P2 - Future/Backlog
- Build remaining placeholder pages (Billing, Prescriptions full CRUD)
- AI Clinical Scribe for SOAP notes
- Lab result integration (IDEXX, Zoetis)
- Treatment sheets for hospitalized patients
- Controlled substance logging
- Real-time WebSocket for appointment board
- Stripe payment integration
- Email/SMS notifications
- Supabase migration for persistence
