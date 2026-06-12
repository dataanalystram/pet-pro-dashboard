import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Minus, Sparkles, Zap, Crown, Rocket, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { PLANS, Plan, BillingCycle, priceFor, PlanId } from "@/lib/plans";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

const PLAN_ICONS: Record<PlanId, React.ComponentType<{ className?: string }>> = {
  starter: Sparkles,
  growth: Zap,
  pro: Rocket,
  scale: Crown,
};

const COMPARE_ROWS: Array<{ label: string; values: Record<PlanId, string | boolean> }> = [
  { label: "Staff seats", values: { starter: "1", growth: "5", pro: "15", scale: "Unlimited" } },
  { label: "Monthly bookings", values: { starter: "50", growth: "Unlimited", pro: "Unlimited", scale: "Unlimited" } },
  { label: "Locations", values: { starter: "1", growth: "1", pro: "3", scale: "Unlimited" } },
  { label: "Inventory items", values: { starter: "25", growth: "250", pro: "Unlimited", scale: "Unlimited" } },
  { label: "Online booking & reviews", values: { starter: true, growth: true, pro: true, scale: true } },
  { label: "Marketing & promo codes", values: { starter: false, growth: true, pro: true, scale: true } },
  { label: "Inventory & orders", values: { starter: false, growth: true, pro: true, scale: true } },
  { label: "Executive dashboard", values: { starter: false, growth: false, pro: true, scale: true } },
  { label: "Customer LTV & churn risk", values: { starter: false, growth: false, pro: true, scale: true } },
  { label: "API access & webhooks", values: { starter: false, growth: false, pro: false, scale: true } },
  { label: "SSO / SAML", values: { starter: false, growth: false, pro: false, scale: true } },
  { label: "Dedicated success manager", values: { starter: false, growth: false, pro: false, scale: true } },
];

const FAQS = [
  { q: "Can I switch plans later?", a: "Yes — upgrade, downgrade, or cancel any time. We prorate the difference automatically." },
  { q: "Is there a free trial?", a: "Every paid plan includes a 14-day trial. No card required to start." },
  { q: "How does PetDash compare to MoeGo or Gingr?", a: "We bundle CRM, marketing automation, inventory, and analytics at roughly 40–60% of comparable pricing." },
  { q: "Do you support multiple locations?", a: "Pro covers up to 3 locations. Scale is unlimited with consolidated reporting." },
];

export default function PricingPage() {
  const [cycle, setCycle] = useState<BillingCycle>("annual");
  const sub = useSubscription();

  const handleSelect = (plan: Plan) => {
    if (plan.id === "scale") {
      toast.info("Our team will reach out within 1 business day.");
      return;
    }
    sub.subscribe(plan.id, cycle);
    toast.success(
      plan.monthlyPrice === 0
        ? `You're on the ${plan.name} plan.`
        : `${plan.name} trial started — 14 days, no card needed.`,
    );
  };

  return (
    <div className="relative min-h-full">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[520px] w-[860px] rounded-full bg-primary/20 blur-[140px]" />
        <div className="absolute top-40 -right-20 h-[380px] w-[380px] rounded-full bg-[hsl(var(--brand-mist))]/25 blur-[120px]" />
        <div className="absolute bottom-20 -left-20 h-[360px] w-[360px] rounded-full bg-[hsl(var(--brand-glow))]/20 blur-[120px]" />
      </div>

      <div className="relative space-y-16 pb-20">
        <Hero cycle={cycle} setCycle={setCycle} />
        <PlanGrid cycle={cycle} currentPlan={sub.planId} onSelect={handleSelect} />
        <SocialProof />
        <CompareTable />
        <Faq />
        <FinalCta />
      </div>
    </div>
  );
}

function Hero({ cycle, setCycle }: { cycle: BillingCycle; setCycle: (c: BillingCycle) => void }) {
  return (
    <section className="text-center pt-10 animate-fade-in">
      <Badge variant="secondary" className="rounded-full px-3 py-1 bg-accent/60 text-accent-foreground border border-primary/15 backdrop-blur">
        <Sparkles className="w-3 h-3 mr-1.5" />
        Built for ambitious pet businesses
      </Badge>
      <h1 className="mt-5 text-4xl md:text-6xl font-bold tracking-tight text-foreground">
        Pricing that pays for itself <br className="hidden md:block" />
        <span className="bg-gradient-to-r from-primary via-[hsl(var(--brand-glow))] to-[hsl(var(--brand-mist))] bg-clip-text text-transparent">
          in the first week.
        </span>
      </h1>
      <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
        One platform for bookings, CRM, marketing, inventory, and analytics — at a fraction of what
        MoeGo, Gingr, and Time To Pet charge. Start free, scale on your terms.
      </p>

      <div className="mt-9 inline-flex items-center gap-3 rounded-full border border-border/60 bg-card/70 backdrop-blur-xl px-2 py-2 shadow-[var(--shadow-md)]">
        <button
          onClick={() => setCycle("monthly")}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
            cycle === "monthly" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Monthly
        </button>
        <button
          onClick={() => setCycle("annual")}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2",
            cycle === "annual" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Annual
          <span className={cn(
            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
            cycle === "annual" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-success/15 text-success",
          )}>
            Save 17%
          </span>
        </button>
      </div>
    </section>
  );
}

function PlanGrid({
  cycle, currentPlan, onSelect,
}: { cycle: BillingCycle; currentPlan: PlanId; onSelect: (p: Plan) => void }) {
  return (
    <section className="px-2">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4 max-w-7xl mx-auto">
        {PLANS.map((plan, i) => {
          const Icon = PLAN_ICONS[plan.id];
          const price = priceFor(plan, cycle);
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              style={{ animationDelay: `${i * 80}ms` }}
              className={cn(
                "group relative rounded-3xl p-[1px] animate-fade-in transition-all duration-300 hover:-translate-y-1",
                plan.recommended
                  ? "bg-gradient-to-b from-primary via-[hsl(var(--brand-glow))] to-[hsl(var(--brand-mist))] shadow-[0_30px_90px_-30px_hsl(var(--primary)/0.55)]"
                  : "bg-border/70 hover:bg-primary/30",
              )}
            >
              <div className="relative h-full rounded-[calc(1.5rem-1px)] bg-card/85 backdrop-blur-xl p-7 flex flex-col">
                {plan.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-[hsl(var(--brand-glow))] text-primary-foreground border-0 shadow-md px-3 py-1">
                    {plan.badge}
                  </Badge>
                )}

                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center",
                    plan.recommended ? "bg-primary/15 text-primary" : "bg-accent text-accent-foreground",
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground min-h-[40px]">{plan.tagline}</p>

                <div className="mt-5 flex items-end gap-1.5">
                  <span className="text-5xl font-bold tracking-tight text-foreground">€{price}</span>
                  <span className="text-sm text-muted-foreground mb-2">/ mo</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 h-4">
                  {cycle === "annual" && plan.monthlyPrice > 0
                    ? `Billed €${price * 12} yearly · save €${(plan.monthlyPrice - plan.annualPrice) * 12}`
                    : plan.monthlyPrice === 0 ? "Free forever" : "Billed monthly"}
                </p>

                <Button
                  onClick={() => onSelect(plan)}
                  disabled={isCurrent}
                  className={cn(
                    "mt-6 rounded-2xl h-11 font-medium transition-all duration-200",
                    plan.recommended
                      ? "bg-gradient-to-r from-primary to-[hsl(var(--brand-glow))] hover:opacity-95 text-primary-foreground shadow-md"
                      : "",
                  )}
                  variant={plan.recommended ? "default" : isCurrent ? "secondary" : "outline"}
                >
                  {isCurrent ? "Current plan" : plan.ctaLabel}
                  {!isCurrent && <ArrowRight className="w-4 h-4 ml-1.5" />}
                </Button>

                <ul className="mt-7 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f.label} className="flex items-start gap-2.5 text-sm">
                      <div className={cn(
                        "mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
                        f.included
                          ? f.highlight ? "bg-primary text-primary-foreground" : "bg-success/15 text-success"
                          : "bg-muted text-muted-foreground/60",
                      )}>
                        {f.included ? <Check className="w-2.5 h-2.5" strokeWidth={3.5} /> : <Minus className="w-2.5 h-2.5" />}
                      </div>
                      <span className={cn(
                        "leading-snug",
                        f.included ? "text-foreground" : "text-muted-foreground/70 line-through",
                        f.highlight && "font-medium",
                      )}>
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SocialProof() {
  const stats = [
    { v: "40–60%", l: "Cheaper than MoeGo & Gingr" },
    { v: "14 days", l: "Free trial on every paid plan" },
    { v: "5 min", l: "From signup to first booking" },
    { v: "99.9%", l: "Uptime on Scale plan" },
  ];
  return (
    <section className="max-w-6xl mx-auto px-4">
      <div className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl p-8 grid grid-cols-2 md:grid-cols-4 gap-6 shadow-[var(--shadow-md)]">
        {stats.map((s) => (
          <div key={s.l} className="text-center">
            <div className="text-3xl font-bold bg-gradient-to-br from-primary to-[hsl(var(--brand-glow))] bg-clip-text text-transparent">
              {s.v}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CompareTable() {
  return (
    <section className="max-w-6xl mx-auto px-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Compare every feature</h2>
        <p className="text-muted-foreground mt-2">Transparent. No hidden seat fees. No surprise add-ons.</p>
      </div>
      <div className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl overflow-hidden shadow-[var(--shadow-md)]">
        <div className="grid grid-cols-5 px-6 py-4 border-b border-border/60 bg-surface/70 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          <div className="col-span-1">Feature</div>
          {PLANS.map((p) => (
            <div key={p.id} className={cn("text-center", p.recommended && "text-primary")}>{p.name}</div>
          ))}
        </div>
        {COMPARE_ROWS.map((row, idx) => (
          <div
            key={row.label}
            className={cn(
              "grid grid-cols-5 px-6 py-3.5 text-sm items-center transition-colors hover:bg-accent/30",
              idx % 2 === 1 && "bg-surface/30",
            )}
          >
            <div className="text-foreground/80">{row.label}</div>
            {PLANS.map((p) => {
              const v = row.values[p.id];
              return (
                <div key={p.id} className="text-center">
                  {typeof v === "boolean" ? (
                    v ? <Check className="w-4 h-4 mx-auto text-success" strokeWidth={3} />
                      : <Minus className="w-4 h-4 mx-auto text-muted-foreground/40" />
                  ) : (
                    <span className="text-foreground font-medium">{v}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="max-w-4xl mx-auto px-4">
      <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
        Frequently asked questions
      </h2>
      <div className="grid md:grid-cols-2 gap-4">
        {FAQS.map((f, i) => (
          <div
            key={f.q}
            style={{ animationDelay: `${i * 60}ms` }}
            className="animate-fade-in rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl p-5 hover:border-primary/30 transition-colors"
          >
            <h3 className="font-semibold text-foreground flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              {f.q}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="max-w-5xl mx-auto px-4">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-[hsl(var(--brand-glow))] to-[hsl(var(--brand-mist))] p-10 md:p-14 text-center shadow-[0_40px_120px_-40px_hsl(var(--primary)/0.6)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,white/30,transparent_50%)] opacity-40" />
        <div className="relative">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
            Stop juggling 5 tools. Start growing.
          </h2>
          <p className="text-primary-foreground/85 mt-3 max-w-xl mx-auto">
            Join the operators replacing MoeGo, Mailchimp, Excel, and Calendly with one platform.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg" className="rounded-2xl bg-card text-foreground hover:bg-card/90 h-12 px-6">
              <Link to="/billing">Manage billing</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-2xl h-12 px-6 bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/">Back to dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
