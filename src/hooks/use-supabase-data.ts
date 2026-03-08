import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type TableName = 'services' | 'customers' | 'staff' | 'bookings' | 'booking_requests' | 'inventory' | 'campaigns' | 'messages' | 'reviews' | 'service_staff' | 'staff_time_off' | 'notifications' | 'orders';

function useSupabaseQuery<T>(table: TableName, options?: { orderBy?: string; ascending?: boolean }) {
  return useQuery({
    queryKey: [table],
    queryFn: async () => {
      let query = (supabase.from(table) as any).select('*');
      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? true });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as T[];
    },
  });
}

export function useServices() { return useSupabaseQuery<Tables<'services'>>('services', { orderBy: 'name' }); }
export function useCustomers() { return useSupabaseQuery<Tables<'customers'>>('customers', { orderBy: 'total_spent', ascending: false }); }
export function useStaff() { return useSupabaseQuery<Tables<'staff'>>('staff', { orderBy: 'full_name' }); }
export function useBookings() { return useSupabaseQuery<Tables<'bookings'>>('bookings', { orderBy: 'start_time', ascending: false }); }
export function useBookingRequests() { return useSupabaseQuery<Tables<'booking_requests'>>('booking_requests', { orderBy: 'created_at', ascending: false }); }
export function useInventory() { return useSupabaseQuery<Tables<'inventory'>>('inventory', { orderBy: 'name' }); }
export function useCampaigns() { return useSupabaseQuery<Tables<'campaigns'>>('campaigns', { orderBy: 'created_at', ascending: false }); }
export function useMessages() { return useSupabaseQuery<Tables<'messages'>>('messages', { orderBy: 'created_at', ascending: true }); }
export function useReviews() { return useSupabaseQuery<Tables<'reviews'>>('reviews', { orderBy: 'created_at', ascending: false }); }
export function useServiceStaff() { return useSupabaseQuery<Tables<'service_staff'>>('service_staff', { orderBy: 'created_at' }); }
export function useStaffTimeOff() { return useSupabaseQuery<Tables<'staff_time_off'>>('staff_time_off', { orderBy: 'start_date', ascending: false }); }
export function useOrders() { return useSupabaseQuery<Tables<'orders'>>('orders', { orderBy: 'created_at', ascending: false }); }

export function useInsert(table: TableName) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Record<string, any>) => {
      const { data, error } = await (supabase.from(table) as any).insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdate(table: TableName) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await (supabase.from(table) as any).update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDelete(table: TableName) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from(table) as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
    onError: (e: Error) => toast.error(e.message),
  });
}
