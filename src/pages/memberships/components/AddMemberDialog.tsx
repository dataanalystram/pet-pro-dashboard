import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { type MembershipPlan, useInsertSubscription, useLogEvent } from "../hooks/useMembershipData";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  plans: MembershipPlan[];
};

export function AddMemberDialog({ open, onOpenChange, plans }: Props) {
  const insert = useInsertSubscription();
  const logEvent = useLogEvent();

  const [form, setForm] = useState({
    owner_name: "", owner_email: "", owner_phone: "",
    pet_name: "", pet_count: 1, plan_id: "", payment_method_last4: "",
    start_trial: false,
  });

  useEffect(() => {
    if (open && plans.length && !form.plan_id) {
      setForm((f) => ({ ...f, plan_id: plans[0].id }));
    }
  }, [open, plans]);

  const plan = plans.find((p) => p.id === form.plan_id);

  const submit = async () => {
    if (!form.owner_name.trim()) return toast.error("Owner name is required");
    if (!plan) return toast.error("Pick a plan");

    const mrr = form.pet_count > 1
      ? Math.round((Number(plan.price) + Number(plan.price) * (form.pet_count - 1) * (1 - Number(plan.family_discount_pct) / 100)) * 100) / 100
      : Number(plan.price);

    const today = new Date();
    const periodEnd = new Date(today);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    const trialEnd = plan.trial_days > 0 && form.start_trial
      ? (() => { const d = new Date(today); d.setDate(d.getDate() + plan.trial_days); return d.toISOString().slice(0, 10); })()
      : null;

    const payload = {
      plan_id: plan.id,
      plan_name: plan.name,
      owner_name: form.owner_name,
      owner_email: form.owner_email || null,
      owner_phone: form.owner_phone || null,
      pet_name: form.pet_name || null,
      pet_count: form.pet_count,
      status: trialEnd ? "trialing" : "active",
      mrr,
      started_at: today.toISOString().slice(0, 10),
      current_period_end: periodEnd.toISOString().slice(0, 10),
      trial_ends_at: trialEnd,
      payment_method_last4: form.payment_method_last4 || null,
      churn_risk: "low" as const,
    };

    try {
      const sub = await insert.mutateAsync(payload);
      await logEvent.mutateAsync({
        subscription_id: sub.id, event_type: trialEnd ? "trial_started" : "subscribed",
        amount: trialEnd ? 0 : mrr,
        note: trialEnd ? `Trial started — ${plan.trial_days} days` : `Subscribed to ${plan.name}`,
      });
      toast.success(`${form.owner_name} enrolled in ${plan.name}`);
      onOpenChange(false);
      setForm({ owner_name: "", owner_email: "", owner_phone: "", pet_name: "", pet_count: 1, plan_id: plan.id, payment_method_last4: "", start_trial: false });
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[hsl(75_95%_45%)]" /> Enroll a new member
          </DialogTitle>
          <DialogDescription>Add an in-store sign-up directly. Customer self-serve sign-ups happen through your booking page.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2 col-span-2">
              <Label>Owner name</Label>
              <Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.owner_phone} onChange={(e) => setForm({ ...form, owner_phone: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Pet name</Label>
              <Input value={form.pet_name} onChange={(e) => setForm({ ...form, pet_name: e.target.value })} placeholder="Bailey (Golden)" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label># of pets</Label>
              <Input type="number" min={1} value={form.pet_count} onChange={(e) => setForm({ ...form, pet_count: Math.max(1, Number(e.target.value)) })} className="rounded-xl" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Plan</Label>
              <Select value={form.plan_id} onValueChange={(v) => setForm({ ...form, plan_id: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {plans.filter((p) => p.status === "active").map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} — ${p.price}/{p.billing_interval}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Card last 4 (optional)</Label>
              <Input value={form.payment_method_last4} onChange={(e) => setForm({ ...form, payment_method_last4: e.target.value.slice(0, 4) })} placeholder="4242" className="rounded-xl" />
            </div>
          </div>

          {plan && (
            <div className="rounded-xl bg-muted/50 p-3 space-y-1 text-[12px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Plan rate</span><span className="font-semibold">${plan.price}/{plan.billing_interval}</span></div>
              {form.pet_count > 1 && (
                <div className="flex justify-between"><span className="text-muted-foreground">{form.pet_count - 1} extra pet × {plan.family_discount_pct}% family discount</span><span className="font-semibold">applied</span></div>
              )}
              <div className="flex justify-between border-t border-border/60 pt-1.5 mt-1.5">
                <span className="text-muted-foreground">Effective MRR</span>
                <span className="font-bold text-[hsl(75_95%_40%)]">
                  ${form.pet_count > 1
                    ? (Math.round((Number(plan.price) + Number(plan.price) * (form.pet_count - 1) * (1 - Number(plan.family_discount_pct) / 100)) * 100) / 100).toFixed(2)
                    : Number(plan.price).toFixed(2)}
                </span>
              </div>
              {plan.trial_days > 0 && (
                <label className="flex items-center gap-2 pt-2 cursor-pointer">
                  <input type="checkbox" checked={form.start_trial} onChange={(e) => setForm({ ...form, start_trial: e.target.checked })} />
                  <span>Start with {plan.trial_days}-day free trial</span>
                </label>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
          <Button onClick={submit} className="rounded-xl bg-[hsl(0_0%_8%)] text-[hsl(75_95%_62%)] hover:bg-[hsl(0_0%_15%)]">Enroll member</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
