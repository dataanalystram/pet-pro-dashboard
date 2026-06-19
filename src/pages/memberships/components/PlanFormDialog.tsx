import { useEffect, useState } from "react";
import { Crown, DollarSign, Sparkles, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { MembershipPlan } from "../hooks/useMembershipData";
import { useInsertPlan, useUpdatePlan, useDeletePlan } from "../hooks/useMembershipData";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  plan?: MembershipPlan | null;
};

const tiers: MembershipPlan["tier"][] = ["Starter", "Standard", "Premium", "Elite"];

const palette = [
  "hsl(200 90% 60%)",
  "hsl(75 95% 50%)",
  "hsl(280 70% 60%)",
  "hsl(45 95% 55%)",
  "hsl(0 80% 60%)",
  "hsl(160 75% 45%)",
];

export function PlanFormDialog({ open, onOpenChange, plan }: Props) {
  const isEdit = !!plan;
  const insert = useInsertPlan();
  const update = useUpdatePlan();
  const del = useDeletePlan();

  const [form, setForm] = useState({
    name: "",
    tier: "Standard" as MembershipPlan["tier"],
    description: "",
    price: 89,
    billing_interval: "month" as MembershipPlan["billing_interval"],
    includes: "",
    perks: "",
    trial_days: 14,
    max_pause_days: 30,
    family_discount_pct: 15,
    setup_fee: 0,
    color: "hsl(75 95% 50%)",
    featured: false,
    status: "active" as MembershipPlan["status"],
  });

  useEffect(() => {
    if (plan) {
      setForm({
        name: plan.name,
        tier: plan.tier,
        description: plan.description ?? "",
        price: Number(plan.price),
        billing_interval: plan.billing_interval,
        includes: (plan.includes ?? []).join("\n"),
        perks: (plan.perks ?? []).join("\n"),
        trial_days: plan.trial_days,
        max_pause_days: plan.max_pause_days,
        family_discount_pct: Number(plan.family_discount_pct),
        setup_fee: Number(plan.setup_fee),
        color: plan.color,
        featured: plan.featured,
        status: plan.status,
      });
    } else {
      setForm((f) => ({ ...f, name: "", description: "", includes: "", perks: "" }));
    }
  }, [plan, open]);

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Plan name is required");
    if (form.price < 0) return toast.error("Price must be ≥ 0");

    const payload = {
      ...form,
      includes: form.includes.split("\n").map((x) => x.trim()).filter(Boolean),
      perks: form.perks.split("\n").map((x) => x.trim()).filter(Boolean),
    };

    try {
      if (isEdit && plan) {
        await update.mutateAsync({ id: plan.id, ...payload });
        toast.success(`Plan "${form.name}" updated`);
      } else {
        await insert.mutateAsync(payload);
        toast.success(`Plan "${form.name}" launched`);
      }
      onOpenChange(false);
    } catch {
      /* toast handled */
    }
  };

  const handleDelete = async () => {
    if (!plan) return;
    if (!confirm(`Archive "${plan.name}"? Active members will keep their plan but no new sign-ups will be allowed.`)) return;
    try {
      await update.mutateAsync({ id: plan.id, status: "archived" });
      toast.success("Plan archived");
      onOpenChange(false);
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-[hsl(75_95%_45%)]" />
            {isEdit ? `Edit ${plan?.name}` : "Create membership plan"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update pricing, perks and lifecycle rules. Existing members keep their current rate (grandfathered) unless you manually re-price them."
              : "Build a recurring subscription that auto-bills your customers."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2 col-span-2">
              <Label>Plan name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Groom Club" className="rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label>Tier</Label>
              <Select value={form.tier} onValueChange={(v: any) => setForm({ ...form, tier: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tiers.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active — accepting sign-ups</SelectItem>
                  <SelectItem value="draft">Draft — hidden</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Short description</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Monthly grooming with VIP touches" className="rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Price</Label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="pl-9 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Billing interval</Label>
              <div className="flex rounded-xl bg-muted p-1">
                {(["week", "month", "year"] as const).map((i) => (
                  <button
                    key={i}
                    onClick={() => setForm({ ...form, billing_interval: i })}
                    className={`flex-1 text-[12px] font-semibold capitalize py-1.5 rounded-lg transition-all ${
                      form.billing_interval === i ? "bg-background shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    {i}ly
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Setup fee (one-time)</Label>
              <Input type="number" value={form.setup_fee} onChange={(e) => setForm({ ...form, setup_fee: Number(e.target.value) })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Trial days</Label>
              <Input type="number" value={form.trial_days} onChange={(e) => setForm({ ...form, trial_days: Number(e.target.value) })} className="rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Max pause days / year</Label>
              <Input type="number" value={form.max_pause_days} onChange={(e) => setForm({ ...form, max_pause_days: Number(e.target.value) })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Multi-pet family discount %</Label>
              <Input type="number" value={form.family_discount_pct} onChange={(e) => setForm({ ...form, family_discount_pct: Number(e.target.value) })} className="rounded-xl" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>What's included (one per line)</Label>
            <Textarea
              value={form.includes}
              onChange={(e) => setForm({ ...form, includes: e.target.value })}
              placeholder="1 full groom / month&#10;Bath + brush&#10;Teeth cleaning"
              className="rounded-xl min-h-[90px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Member perks (one per line)</Label>
            <Textarea
              value={form.perks}
              onChange={(e) => setForm({ ...form, perks: e.target.value })}
              placeholder="15% off retail&#10;Free pickup once / month&#10;Birthday treat"
              className="rounded-xl min-h-[90px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Color accent</Label>
            <div className="flex gap-2">
              {palette.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div>
              <div className="text-[13px] font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Mark as featured
              </div>
              <div className="text-[11px] text-muted-foreground">Adds a POPULAR badge and highlights this plan first</div>
            </div>
            <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          {isEdit ? (
            <Button variant="ghost" onClick={handleDelete} className="text-red-600 rounded-xl gap-1.5">
              <Trash2 className="w-4 h-4" /> Archive plan
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
            <Button
              onClick={submit}
              disabled={insert.isPending || update.isPending}
              className="rounded-xl bg-[hsl(0_0%_8%)] text-[hsl(75_95%_62%)] hover:bg-[hsl(0_0%_15%)]"
            >
              {isEdit ? "Save changes" : "Launch plan"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
