// Market-validated tiers for pet-business SaaS.
// Benchmark: Gingr ($95+/mo), MoeGo ($99-$249), Time To Pet ($25-$60),
// Scout ($59+), PawLoyalty ($79+). We undercut on entry tiers while
// over-delivering on automation (CRM, marketing, analytics included).

export type PlanId = "starter" | "growth" | "pro" | "scale";
export type BillingCycle = "monthly" | "annual";

export interface PlanFeature {
  label: string;
  included: boolean;
  highlight?: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPrice: number; // EUR
  annualPrice: number;  // EUR billed monthly when on annual (2 months free)
  badge?: string;
  recommended?: boolean;
  ctaLabel: string;
  limits: {
    staff: number | "unlimited";
    bookingsPerMonth: number | "unlimited";
    locations: number | "unlimited";
    inventoryItems: number | "unlimited";
  };
  features: PlanFeature[];
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Solo groomers & walkers getting set up.",
    monthlyPrice: 0,
    annualPrice: 0,
    ctaLabel: "Start free",
    limits: { staff: 1, bookingsPerMonth: 50, locations: 1, inventoryItems: 25 },
    features: [
      { label: "Online booking page", included: true },
      { label: "Customer & pet profiles", included: true },
      { label: "Up to 50 bookings / month", included: true },
      { label: "Email notifications", included: true },
      { label: "Marketing campaigns", included: false },
      { label: "Inventory & orders", included: false },
      { label: "Advanced analytics", included: false },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "Small teams ready to win their neighbourhood.",
    monthlyPrice: 29,
    annualPrice: 24,
    badge: "Most popular",
    recommended: true,
    ctaLabel: "Start 14-day trial",
    limits: { staff: 5, bookingsPerMonth: "unlimited", locations: 1, inventoryItems: 250 },
    features: [
      { label: "Everything in Starter", included: true },
      { label: "Up to 5 staff seats", included: true, highlight: true },
      { label: "Unlimited bookings", included: true, highlight: true },
      { label: "Marketing campaigns & promo codes", included: true },
      { label: "Inventory & order fulfillment", included: true },
      { label: "Reviews automation", included: true },
      { label: "Standard analytics", included: true },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Multi-location operators scaling revenue.",
    monthlyPrice: 59,
    annualPrice: 49,
    ctaLabel: "Start 14-day trial",
    limits: { staff: 15, bookingsPerMonth: "unlimited", locations: 3, inventoryItems: "unlimited" },
    features: [
      { label: "Everything in Growth", included: true },
      { label: "Up to 15 staff seats", included: true, highlight: true },
      { label: "Up to 3 locations", included: true, highlight: true },
      { label: "Executive dashboard & cohort analytics", included: true },
      { label: "Customer CRM with LTV & churn risk", included: true },
      { label: "Recurring appointments & walk-in queue", included: true },
      { label: "Priority email & chat support", included: true },
    ],
  },
  {
    id: "scale",
    name: "Scale",
    tagline: "Franchise & enterprise pet brands.",
    monthlyPrice: 119,
    annualPrice: 99,
    ctaLabel: "Talk to sales",
    limits: { staff: "unlimited", bookingsPerMonth: "unlimited", locations: "unlimited", inventoryItems: "unlimited" },
    features: [
      { label: "Everything in Pro", included: true },
      { label: "Unlimited staff & locations", included: true, highlight: true },
      { label: "API access & webhooks", included: true },
      { label: "Custom roles & permissions", included: true },
      { label: "SSO / SAML", included: true },
      { label: "Dedicated success manager", included: true, highlight: true },
      { label: "99.9% uptime SLA", included: true },
    ],
  },
];

export const PLAN_FEATURE_KEYS = [
  "marketing",
  "inventory",
  "advanced_analytics",
  "multi_location",
  "api_access",
  "sso",
] as const;
export type PlanFeatureKey = (typeof PLAN_FEATURE_KEYS)[number];

export const FEATURE_MATRIX: Record<PlanFeatureKey, PlanId[]> = {
  marketing: ["growth", "pro", "scale"],
  inventory: ["growth", "pro", "scale"],
  advanced_analytics: ["pro", "scale"],
  multi_location: ["pro", "scale"],
  api_access: ["scale"],
  sso: ["scale"],
};

export function planAllows(plan: PlanId, key: PlanFeatureKey) {
  return FEATURE_MATRIX[key].includes(plan);
}

export function getPlan(id: PlanId) {
  return PLANS.find((p) => p.id === id)!;
}

export function priceFor(plan: Plan, cycle: BillingCycle) {
  return cycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
}
