import { useState } from "react";
import {
  User, Pause, Play, X as XIcon, CreditCard, RefreshCw, MessageSquare, ArrowUpCircle,
  RotateCcw, AlertTriangle, CheckCircle2, Clock,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  type Subscription, type MembershipPlan,
  useUpdateSubscription, useLogEvent, useMembershipEvents,
} from "../hooks/useMembershipData";

const fmt = (n: number | string) => `$${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  member: Subscription | null;
  plans: MembershipPlan[];
};

export function MemberDetailDialog({ open, onOpenChange, member, plans }: Props) {
  const update = useUpdateSubscription();
  const logEvent = useLogEvent();
  const { data: events = [] } = useMembershipEvents(member?.id);

  const [pauseDays, setPauseDays] = useState(14);
  const [refundAmt, setRefundAmt] = useState("");
  const [chargeAmt, setChargeAmt] = useState("");
  const [upgradePlanId, setUpgradePlanId] = useState<string>("");

  if (!member) return null;

  const addDays = (d: number) => {
    const dt = new Date();
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().slice(0, 10);
  };

  const doAction = async (
    type: string,
    updates: Partial<Subscription>,
    note: string,
    amount = 0,
  ) => {
    try {
      await update.mutateAsync({ id: member.id, ...updates });
      await logEvent.mutateAsync({ subscription_id: member.id, event_type: type, amount, note });
      toast.success(note);
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    }
  };

  const handlePause = () =>
    doAction(
      "paused",
      { status: "paused", paused_until: addDays(pauseDays) },
      `Membership paused for ${pauseDays} days`,
    );

  const handleResume = () =>
    doAction("resumed", { status: "active", paused_until: null }, "Membership resumed");

  const handleCancel = () => {
    if (!confirm("Cancel this membership? They will lose access at the end of the current period.")) return;
    doAction(
      "canceled",
      { status: "canceled", canceled_at: new Date().toISOString().slice(0, 10), mrr: 0 },
      "Membership canceled",
    );
  };

  const handleReactivate = () =>
    doAction(
      "reactivated",
      { status: "active", canceled_at: null, current_period_end: addDays(30) },
      "Membership reactivated",
    );

  const handleChargeNow = async () => {
    const amt = Number(chargeAmt || member.mrr);
    await doAction("charge", { total_charged: Number(member.total_charged) + amt, lifetime_value: Number(member.lifetime_value) + amt }, `Manual charge of ${fmt(amt)}`, amt);
    setChargeAmt("");
  };

  const handleRefund = async () => {
    const amt = Number(refundAmt);
    if (!amt) return toast.error("Enter a refund amount");
    await doAction("refund", { total_charged: Math.max(0, Number(member.total_charged) - amt) }, `Refunded ${fmt(amt)}`, -amt);
    setRefundAmt("");
  };

  const handleRetry = () =>
    doAction("retry_payment", { status: "active" }, "Payment retry succeeded", Number(member.mrr));

  const handleUpgrade = async () => {
    if (!upgradePlanId) return toast.error("Pick a plan");
    const p = plans.find((x) => x.id === upgradePlanId);
    if (!p) return;
    await doAction(
      "upgraded",
      { plan_id: p.id, plan_name: p.name, mrr: Number(p.price) },
      `Upgraded to ${p.name}`,
    );
  };

  const handleWinBack = () =>
    logEvent.mutate(
      { subscription_id: member.id, event_type: "winback_sent", amount: 0, note: "Win-back offer (20% off 3 months) sent" },
      { onSuccess: () => toast.success("Win-back offer sent via email + SMS") },
    );

  const statusTone: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    trialing: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    past_due: "bg-orange-500/15 text-orange-600 border-orange-500/30",
    paused: "bg-slate-500/15 text-slate-600 border-slate-500/30",
    canceled: "bg-red-500/15 text-red-600 border-red-500/30",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-[hsl(75_95%_62%)] text-[hsl(0_0%_8%)] flex items-center justify-center font-bold">
              {member.owner_name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
            </div>
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                {member.owner_name}
                <Badge variant="outline" className={`${statusTone[member.status]} text-[10px] font-semibold capitalize`}>
                  {member.status.replace("_", " ")}
                </Badge>
              </DialogTitle>
              <DialogDescription className="flex flex-wrap gap-x-3 gap-y-0.5 text-[12px]">
                <span>{member.pet_name}</span>
                <span>·</span>
                <span>{member.plan_name}</span>
                {member.payment_method_last4 && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> •••• {member.payment_method_last4}</span>
                  </>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-3 mt-2">
          <Stat label="MRR" value={fmt(member.mrr)} />
          <Stat label="Lifetime value" value={fmt(member.lifetime_value)} />
          <Stat label="Total charged" value={fmt(member.total_charged)} />
          <Stat label="Started" value={member.started_at} />
        </div>

        {member.status === "past_due" && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30">
            <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-orange-800 dark:text-orange-300">Payment failed</div>
              <div className="text-[11px] text-orange-700 dark:text-orange-200/80">
                Card was declined. We'll auto-retry per your dunning rules. You can retry manually now.
              </div>
            </div>
            <Button size="sm" className="rounded-lg h-8 text-[11px] bg-orange-600 hover:bg-orange-700 text-white" onClick={handleRetry}>
              <RefreshCw className="w-3 h-3 mr-1" /> Retry charge
            </Button>
          </div>
        )}

        <Tabs defaultValue="actions" className="mt-3">
          <TabsList className="rounded-xl bg-muted/50 p-1">
            <TabsTrigger value="actions" className="rounded-lg text-xs">Actions</TabsTrigger>
            <TabsTrigger value="billing" className="rounded-lg text-xs">Billing</TabsTrigger>
            <TabsTrigger value="timeline" className="rounded-lg text-xs">Timeline ({events.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="actions" className="mt-4 space-y-3">
            {/* Lifecycle actions */}
            <div className="grid grid-cols-2 gap-3">
              {member.status !== "paused" && member.status !== "canceled" && (
                <ActionCard
                  icon={Pause} title="Pause membership"
                  desc="Freeze billing temporarily. Common when owner is traveling or pet is sick."
                >
                  <div className="flex gap-2 items-center">
                    <Input type="number" value={pauseDays} onChange={(e) => setPauseDays(Number(e.target.value))} className="rounded-lg h-9 w-20" />
                    <span className="text-[11px] text-muted-foreground">days</span>
                    <Button size="sm" className="rounded-lg ml-auto h-8" onClick={handlePause}>Pause</Button>
                  </div>
                </ActionCard>
              )}

              {member.status === "paused" && (
                <ActionCard icon={Play} title="Resume membership" desc={`Paused until ${member.paused_until ?? "—"}`}>
                  <Button size="sm" className="rounded-lg h-8 w-full" onClick={handleResume}>Resume now</Button>
                </ActionCard>
              )}

              {member.status !== "canceled" && (
                <ActionCard icon={XIcon} title="Cancel membership" desc="Ends at the current period end. Access continues until then.">
                  <Button size="sm" variant="destructive" className="rounded-lg h-8 w-full" onClick={handleCancel}>Cancel subscription</Button>
                </ActionCard>
              )}

              {member.status === "canceled" && (
                <ActionCard icon={RotateCcw} title="Reactivate" desc="Bring this member back at their previous rate.">
                  <Button size="sm" className="rounded-lg h-8 w-full" onClick={handleReactivate}>Reactivate</Button>
                </ActionCard>
              )}

              <ActionCard icon={ArrowUpCircle} title="Change plan" desc="Upgrade or downgrade. Proration applied per billing rules.">
                <div className="flex gap-2">
                  <Select value={upgradePlanId} onValueChange={setUpgradePlanId}>
                    <SelectTrigger className="rounded-lg h-9"><SelectValue placeholder="Pick plan" /></SelectTrigger>
                    <SelectContent>
                      {plans.filter((p) => p.id !== member.plan_id && p.status === "active").map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name} — {fmt(p.price)}/mo</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="rounded-lg h-9" onClick={handleUpgrade}>Switch</Button>
                </div>
              </ActionCard>

              <ActionCard icon={MessageSquare} title="Win-back offer" desc="Send 20% off next 3 months via email + SMS.">
                <Button size="sm" variant="outline" className="rounded-lg h-8 w-full" onClick={handleWinBack}>Send offer</Button>
              </ActionCard>

              <ActionCard icon={MessageSquare} title="Message owner" desc={member.owner_email ?? "No email on file"}>
                <Button
                  size="sm" variant="outline" className="rounded-lg h-8 w-full"
                  onClick={() => toast.success("Opening message thread")}
                >
                  Open thread
                </Button>
              </ActionCard>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="mt-4 space-y-3">
            <ActionCard icon={CreditCard} title="Charge now" desc="Bill the customer for any amount (one-off).">
              <div className="flex gap-2">
                <Input type="number" placeholder={String(member.mrr)} value={chargeAmt} onChange={(e) => setChargeAmt(e.target.value)} className="rounded-lg h-9" />
                <Button size="sm" className="rounded-lg h-9" onClick={handleChargeNow}>Charge</Button>
              </div>
            </ActionCard>

            <ActionCard icon={RotateCcw} title="Issue refund" desc="Returns funds within your refund window.">
              <div className="flex gap-2">
                <Input type="number" placeholder="0.00" value={refundAmt} onChange={(e) => setRefundAmt(e.target.value)} className="rounded-lg h-9" />
                <Button size="sm" variant="outline" className="rounded-lg h-9" onClick={handleRefund}>Refund</Button>
              </div>
            </ActionCard>

            <ActionCard icon={CreditCard} title="Update payment method" desc="Send a secure link to add a new card.">
              <Button size="sm" variant="outline" className="rounded-lg h-8 w-full" onClick={() => toast.success("Update-card link sent")}>
                Email update link
              </Button>
            </ActionCard>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            {events.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">No events yet — actions you take will appear here.</div>
            ) : (
              <ul className="space-y-2">
                {events.map((e) => (
                  <li key={e.id} className="flex items-start gap-3 p-3 rounded-xl border border-border/60">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      {e.event_type.includes("charge") || e.event_type === "upgraded" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
                       e.event_type === "refund" ? <RotateCcw className="w-4 h-4 text-orange-600" /> :
                       e.event_type === "canceled" ? <XIcon className="w-4 h-4 text-red-600" /> :
                       e.event_type === "paused" ? <Pause className="w-4 h-4 text-slate-600" /> :
                       <Clock className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold capitalize">{e.event_type.replace("_", " ")}</div>
                      <div className="text-[11px] text-muted-foreground">{e.note}</div>
                    </div>
                    <div className="text-right">
                      {e.amount !== 0 && (
                        <div className={`text-[13px] font-bold ${Number(e.amount) > 0 ? "text-emerald-600" : "text-orange-600"}`}>
                          {Number(e.amount) > 0 ? "+" : ""}{fmt(e.amount)}
                        </div>
                      )}
                      <div className="text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleString()}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="font-bold text-sm mt-0.5">{value}</div>
    </div>
  );
}

function ActionCard({
  icon: Icon, title, desc, children,
}: { icon: any; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="p-3 rounded-xl border border-border/60 bg-card">
      <div className="flex items-start gap-2 mb-2">
        <Icon className="w-4 h-4 mt-0.5 text-muted-foreground" />
        <div className="flex-1">
          <div className="text-[13px] font-semibold">{title}</div>
          <div className="text-[11px] text-muted-foreground">{desc}</div>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
