/**
 * PetDash — Typed Supabase API Service Layer
 * 
 * This file provides typed, reusable query functions for all tables.
 * Use these in React Query hooks or directly in components/edge functions.
 * 
 * Designed for easy integration with a future Pet Owner Dashboard:
 * - All customer-facing queries filter by `customer_email`
 * - All service provider queries return full datasets
 * - Functions are pure async — no React dependencies
 */

import { supabase } from './client';
import type { Tables, TablesInsert } from './types';

// ─── Services ───────────────────────────────────────────────

export async function fetchServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function fetchActiveServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('display_order');
  if (error) throw error;
  return data;
}

export async function fetchServiceById(id: string) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchFeaturedServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .eq('featured', true)
    .order('display_order');
  if (error) throw error;
  return data;
}

// ─── Bookings ───────────────────────────────────────────────

export async function fetchBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('start_time', { ascending: false });
  if (error) throw error;
  return data;
}

/** Pet Owner: fetch bookings by customer email */
export async function fetchBookingsByEmail(email: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('customer_email', email)
    .order('start_time', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchBookingsByDate(date: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('booking_date', date)
    .order('start_time');
  if (error) throw error;
  return data;
}

// ─── Booking Requests ───────────────────────────────────────

export async function fetchBookingRequests() {
  const { data, error } = await supabase
    .from('booking_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/** Pet Owner: fetch their booking requests */
export async function fetchRequestsByEmail(email: string) {
  const { data, error } = await supabase
    .from('booking_requests')
    .select('*')
    .eq('customer_email', email)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/** Public: submit a new booking request */
export async function createBookingRequest(data: TablesInsert<'booking_requests'>) {
  const { data: result, error } = await supabase
    .from('booking_requests')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

// ─── Customers ──────────────────────────────────────────────

export async function fetchCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('total_spent', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchCustomerByEmail(email: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('customer_email', email)
    .single();
  if (error) throw error;
  return data;
}

// ─── Orders ─────────────────────────────────────────────────

export async function fetchOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/** Pet Owner: fetch their orders */
export async function fetchOrdersByEmail(email: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_email', email)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ─── Reviews ────────────────────────────────────────────────

export async function fetchReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/** Pet Owner: fetch their reviews */
export async function fetchReviewsByEmail(email: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('customer_email', email)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/** Public: fetch published reviews for a service */
export async function fetchPublishedReviewsForService(serviceId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('service_id', serviceId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/** Public: submit a new review */
export async function createReview(data: TablesInsert<'reviews'>) {
  const { data: result, error } = await supabase
    .from('reviews')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

// ─── Messages ───────────────────────────────────────────────

export async function fetchMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at');
  if (error) throw error;
  return data;
}

/** Pet Owner: fetch their message thread */
export async function fetchMessagesByEmail(email: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('customer_email', email)
    .order('created_at');
  if (error) throw error;
  return data;
}

export async function sendMessage(data: TablesInsert<'messages'>) {
  const { data: result, error } = await supabase
    .from('messages')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

// ─── Campaigns / Promos ─────────────────────────────────────

export async function fetchCampaigns() {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/** Public: fetch active promotions for pet owners */
export async function fetchActivePromos() {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('is_enabled', true)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/** Public: validate and look up a promo code */
export async function redeemPromoCode(code: string) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('promo_code', code.toUpperCase())
    .eq('is_enabled', true)
    .eq('status', 'active')
    .single();
  if (error) throw error;
  return data;
}

export async function fetchCampaignRedemptions(campaignId?: string) {
  let query = supabase
    .from('campaign_redemptions')
    .select('*')
    .order('redeemed_at', { ascending: false });
  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ─── Staff ──────────────────────────────────────────────────

export async function fetchStaff() {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('full_name');
  if (error) throw error;
  return data;
}

export async function fetchActiveStaff() {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('status', 'active')
    .order('full_name');
  if (error) throw error;
  return data;
}

/** Fetch staff assigned to a specific service (for booking flows) */
export async function fetchStaffForService(serviceId: string) {
  const { data, error } = await supabase
    .from('service_staff')
    .select('*, staff(*)')
    .eq('service_id', serviceId);
  if (error) throw error;
  return data;
}

// ─── Inventory ──────────────────────────────────────────────

export async function fetchInventory() {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function fetchAvailableProducts() {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('status', 'in_stock')
    .gt('quantity_in_stock', 0)
    .order('name');
  if (error) throw error;
  return data;
}

// ─── Notifications ──────────────────────────────────────────

export async function fetchNotifications(limit = 50) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// ─── Booking Notifications ──────────────────────────────────

export async function fetchBookingNotifications(bookingId?: string) {
  let query = supabase
    .from('booking_notifications')
    .select('*')
    .order('created_at', { ascending: false });
  if (bookingId) {
    query = query.eq('booking_id', bookingId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ─── Service Staff (Junction) ───────────────────────────────

export async function fetchServiceStaff(serviceId?: string) {
  let query = supabase
    .from('service_staff')
    .select('*')
    .order('created_at');
  if (serviceId) {
    query = query.eq('service_id', serviceId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ─── Staff Time Off ─────────────────────────────────────────

export async function fetchStaffTimeOff(staffId?: string) {
  let query = supabase
    .from('staff_time_off')
    .select('*')
    .order('start_date', { ascending: false });
  if (staffId) {
    query = query.eq('staff_id', staffId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
