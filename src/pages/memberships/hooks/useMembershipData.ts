import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const sb = supabase as any;

/* ---------- Types (shaped to the DB tables) ---------- */
export type MembershipPlan = {
  id: string;
  name: string;
  tier: "Starter" | "Standard" | "Premium" | "Elite";
  description: string | null;
  price: number;
  currency: string;
  billing_interval: "month" | "year" | "week";
  includes: string[];
  perks: string[];
  trial_days: number;
  max_pause_days: number;
  family_discount_pct: number;
  setup_fee: number;
  color: string;
  featured: boolean;
  status: "active" | "draft" | "archived";
  seasonal_tag: string | null;
  active_members: number;
  mrr: number;
  created_at: string;
};

export type Subscription = {
  id: string;
  plan_id: string | null;
  plan_name: string;
  owner_name: string;
  owner_email: string | null;
  owner_phone: string | null;
  pet_name: string | null;
  pet_count: number;
  status: "active" | "trialing" | "past_due" | "paused" | "canceled";
  mrr: number;
  started_at: string;
  current_period_end: string | null;
  paused_until: string | null;
  canceled_at: string | null;
  trial_ends_at: string | null;
  total_charged: number;
  lifetime_value: number;
  churn_risk: "low" | "medium" | "high";
  payment_method_last4: string | null;
  notes: string | null;
};

export type MembershipEvent = {
  id: string;
  subscription_id: string;
  event_type: string;
  amount: number;
  note: string | null;
  created_at: string;
};

export type PrepaidPackage = {
  id: string;
  name: string;
  service_name: string;
  sessions: number;
  price: number;
  per_session_price: number | null;
  savings_pct: number;
  expires_in_days: number;
  transferable: boolean;
  active: boolean;
  units_sold: number;
  revenue: number;
};

export type SeasonalOffer = {
  id: string;
  name: string;
  season: string;
  description: string | null;
  start_date: string;
  end_date: string;
  plan_id: string | null;
  plan_name: string | null;
  discount_pct: number;
  bonus_perks: string[];
  target_audience: "all" | "new" | "existing" | "lapsed";
  max_redemptions: number | null;
  redemptions: number;
  revenue: number;
  capacity_cap: number | null;
  status: "scheduled" | "live" | "paused" | "ended";
  banner_color: string;
};

export type BillingSettings = {
  id: string;
  provider: "none" | "stripe" | "paddle" | "manual";
  connected: boolean;
  account_label: string | null;
  account_email: string | null;
  currency: string;
  dunning_retry_count: number;
  dunning_retry_days: number;
  grace_period_days: number;
  auto_pause_after_failed: boolean;
  send_payment_receipts: boolean;
  send_renewal_reminders: boolean;
  renewal_reminder_days: number;
  proration_enabled: boolean;
  refund_window_days: number;
  webhook_url: string | null;
};

/* ---------- Queries ---------- */
export const usePlans = () =>
  useQuery({
    queryKey: ["membership_plans"],
    queryFn: async () => {
      const { data, error } = await sb.from("membership_plans").select("*").order("price");
      if (error) throw error;
      return data as MembershipPlan[];
    },
  });

export const useSubscriptions = () =>
  useQuery({
    queryKey: ["membership_subscriptions"],
    queryFn: async () => {
      const { data, error } = await sb
        .from("membership_subscriptions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Subscription[];
    },
  });

export const useMembershipEvents = (subscriptionId?: string) =>
  useQuery({
    queryKey: ["membership_events", subscriptionId],
    queryFn: async () => {
      if (!subscriptionId) return [];
      const { data, error } = await sb
        .from("membership_events")
        .select("*")
        .eq("subscription_id", subscriptionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MembershipEvent[];
    },
    enabled: !!subscriptionId,
  });

export const usePrepaidPackages = () =>
  useQuery({
    queryKey: ["prepaid_packages"],
    queryFn: async () => {
      const { data, error } = await sb.from("prepaid_packages").select("*").order("price");
      if (error) throw error;
      return data as PrepaidPackage[];
    },
  });

export const useSeasonalOffers = () =>
  useQuery({
    queryKey: ["seasonal_offers"],
    queryFn: async () => {
      const { data, error } = await sb.from("seasonal_offers").select("*").order("start_date", { ascending: false });
      if (error) throw error;
      return data as SeasonalOffer[];
    },
  });

export const useBillingSettings = () =>
  useQuery({
    queryKey: ["billing_settings"],
    queryFn: async () => {
      const { data, error } = await sb.from("billing_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data as BillingSettings | null;
    },
  });

/* ---------- Mutations ---------- */
function useTableMutation(table: string, action: "insert" | "update" | "delete") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      if (action === "insert") {
        const { data, error } = await sb.from(table).insert(payload).select().single();
        if (error) throw error;
        return data;
      }
      if (action === "update") {
        const { id, ...rest } = payload;
        const { data, error } = await sb.from(table).update(rest).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
      const { error } = await sb.from(table).delete().eq("id", payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export const useInsertPlan = () => useTableMutation("membership_plans", "insert");
export const useUpdatePlan = () => useTableMutation("membership_plans", "update");
export const useDeletePlan = () => useTableMutation("membership_plans", "delete");

export const useInsertSubscription = () => useTableMutation("membership_subscriptions", "insert");
export const useUpdateSubscription = () => useTableMutation("membership_subscriptions", "update");
export const useDeleteSubscription = () => useTableMutation("membership_subscriptions", "delete");

export const useInsertPackage = () => useTableMutation("prepaid_packages", "insert");
export const useUpdatePackage = () => useTableMutation("prepaid_packages", "update");
export const useDeletePackage = () => useTableMutation("prepaid_packages", "delete");

export const useInsertOffer = () => useTableMutation("seasonal_offers", "insert");
export const useUpdateOffer = () => useTableMutation("seasonal_offers", "update");
export const useDeleteOffer = () => useTableMutation("seasonal_offers", "delete");

export const useUpdateBilling = () => useTableMutation("billing_settings", "update");

export const useLogEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { subscription_id: string; event_type: string; amount?: number; note?: string }) => {
      const { error } = await sb.from("membership_events").insert(payload);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["membership_events", vars.subscription_id] });
    },
  });
};
