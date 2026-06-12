import { Link } from "react-router-dom";
import { CheckCircle2, CalendarClock, CreditCard, ArrowUpRight, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { getPlan, priceFor } from "@/lib/plans";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function BillingPage() {
  const sub = useSubscription();
  const plan = getPlan(sub.planId);
  const price = priceFor(plan, sub.cycle);

  const handleCancel = () => {
    sub.cancel();
    toast.success("Subscription reset to Starter.");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Billing</h1>
        <p className="text-muted-foreground mt-1">Manage your plan, invoices, and payment method.</p>
      </header>

      <div className="rounded-3xl border border-border/60 bg-card/80 backdrop-blur-xl p-7 shadow-[var(--shadow-md)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">{plan.name} plan</h2>
              <Badge variant="secondary" className="rounded-full">
                {sub.status === "trialing" ? "Trialing" : sub.status === "active" ? "Active" : sub.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{plan.tagline}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-foreground">€{price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            <div className="text-xs text-muted-foreground capitalize">Billed {sub.cycle}</div>
          </div>
        </div>

        {sub.trialEndsAt && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <CalendarClock className="w-5 h-5 text-primary" />
            <div className="text-sm">
              <div className="font-medium text-foreground">Trial active</div>
              <div className="text-muted-foreground">
                Ends {formatDistanceToNow(new Date(sub.trialEndsAt), { addSuffix: true })}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="rounded-2xl">
            <Link to="/pricing">
              <ArrowUpRight className="w-4 h-4 mr-1.5" />
              Change plan
            </Link>
          </Button>
          {sub.planId !== "starter" && (
            <Button variant="outline" onClick={handleCancel} className="rounded-2xl">
              <XCircle className="w-4 h-4 mr-1.5" />
              Cancel subscription
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <InfoCard
          icon={CreditCard}
          title="Payment method"
          body="No payment method on file. You can connect one when you're ready."
          cta="Connect later"
        />
        <InfoCard
          icon={CheckCircle2}
          title="Invoices"
          body="Receipts and tax invoices will appear here after your first paid cycle."
          cta="View history"
        />
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon, title, body, cta,
}: { icon: React.ComponentType<{ className?: string }>; title: string; body: string; cta: string }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center">
          <Icon className="w-5 h-5 text-accent-foreground" />
        </div>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground mt-3">{body}</p>
      <Button variant="ghost" size="sm" className="mt-3 px-0 text-primary hover:bg-transparent hover:text-primary/80">
        {cta} →
      </Button>
    </div>
  );
}
