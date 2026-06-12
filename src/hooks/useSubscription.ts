import { useEffect, useState, useCallback } from "react";
import { PlanId, BillingCycle, planAllows, PlanFeatureKey } from "@/lib/plans";

const STORAGE_KEY = "petdash.subscription.v1";

export interface SubscriptionState {
  planId: PlanId;
  cycle: BillingCycle;
  trialEndsAt: string | null;
  status: "trialing" | "active" | "canceled" | "none";
}

const DEFAULT: SubscriptionState = {
  planId: "starter",
  cycle: "monthly",
  trialEndsAt: null,
  status: "active",
};

function read(): SubscriptionState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

function write(s: SubscriptionState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("petdash:subscription-changed"));
}

export function useSubscription() {
  const [sub, setSub] = useState<SubscriptionState>(read);

  useEffect(() => {
    const sync = () => setSub(read());
    window.addEventListener("petdash:subscription-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("petdash:subscription-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const subscribe = useCallback((planId: PlanId, cycle: BillingCycle) => {
    const trial = new Date();
    trial.setDate(trial.getDate() + 14);
    const next: SubscriptionState = {
      planId,
      cycle,
      trialEndsAt: planId === "starter" ? null : trial.toISOString(),
      status: planId === "starter" ? "active" : "trialing",
    };
    write(next);
    setSub(next);
  }, []);

  const cancel = useCallback(() => {
    const next: SubscriptionState = { ...DEFAULT };
    write(next);
    setSub(next);
  }, []);

  const can = useCallback(
    (key: PlanFeatureKey) => planAllows(sub.planId, key),
    [sub.planId],
  );

  return { ...sub, subscribe, cancel, can };
}
