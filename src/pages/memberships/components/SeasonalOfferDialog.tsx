import { useEffect, useState } from "react";
import { Sparkles, CalendarDays } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { type SeasonalOffer, type MembershipPlan, useInsertOffer, useUpdateOffer } from "../hooks/useMembershipData";

const SEASONS = [
  { id: "christmas", label: "🎄 Christmas / Holiday", color: "hsl(0 80% 55%)" },
  { id: "diwali", label: "🪔 Diwali", color: "hsl(35 95% 55%)" },
  { id: "chinese-new-year", label: "🧧 Lunar New Year", color: "hsl(0 75% 50%)" },
  { id: "summer", label: "☀️ Summer Splash", color: "hsl(195 85% 55%)" },
  { id: "back-to-school", label: "🎒 Back-to-School", color: "hsl(220 70% 55%)" },
  { id: "halloween", label: "🎃 Halloween", color: "hsl(25 90% 55%)" },
  { id: "valentines", label: "💝 Valentine's", color: "hsl(340 80% 60%)" },
  { id: "black-friday", label: "🛍️ Black Friday", color: "hsl(0 0% 12%)" },
  { id: "spring", label: "🌸 Spring Shed", color: "hsl(140 60% 55%)" },
  { id: "monsoon", label: "🌧️ Monsoon Wellness", color: "hsl(210 60% 45%)" },
];

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (d: number) => { const dt = new Date(); dt.setDate(dt.getDate() + d); return dt.toISOString().slice(0, 10); };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  offer?: SeasonalOffer | null;
  plans: MembershipPlan[];
};

export function SeasonalOfferDialog({ open, onOpenChange, offer, plans }: Props) {
  const insert = useInsertOffer();
  const update = useUpdateOffer();
  const [form, setForm] = useState({
    name: "", season: "christmas", description: "",
    start_date: today(), end_date: plusDays(14),
    plan_id: "" as string, plan_name: "",
    discount_pct: 15, bonus_perks: "",
    target_audience: "all" as SeasonalOffer["target_audience"],
    max_redemptions: 100,
    capacity_cap: 50,
    status: "scheduled" as SeasonalOffer["status"],
    banner_color: "hsl(0 80% 55%)",
  });

  useEffect(() => {
    if (offer) setForm({
      name: offer.name, season: offer.season, description: offer.description ?? "",
      start_date: offer.start_date, end_date: offer.end_date,
      plan_id: offer.plan_id ?? "", plan_name: offer.plan_name ?? "",
      discount_pct: Number(offer.discount_pct), bonus_perks: (offer.bonus_perks ?? []).join("\n"),
      target_audience: offer.target_audience, max_redemptions: offer.max_redemptions ?? 100,
      capacity_cap: offer.capacity_cap ?? 50, status: offer.status, banner_color: offer.banner_color,
    });
    else setForm((f) => ({ ...f, name: "", description: "", bonus_perks: "" }));
  }, [offer, open]);

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Offer name is required");
    if (new Date(form.end_date) <= new Date(form.start_date)) return toast.error("End date must be after start date");

    const linkedPlan = plans.find((p) => p.id === form.plan_id);
    const payload = {
      ...form,
      plan_id: form.plan_id || null,
      plan_name: linkedPlan?.name ?? form.plan_name ?? null,
      bonus_perks: form.bonus_perks.split("\n").map((x) => x.trim()).filter(Boolean),
      max_redemptions: form.max_redemptions || null,
      capacity_cap: form.capacity_cap || null,
    };
    try {
      if (offer) await update.mutateAsync({ id: offer.id, ...payload });
      else await insert.mutateAsync(payload);
      toast.success(offer ? "Offer updated" : "Seasonal offer scheduled");
      onOpenChange(false);
    } catch {}
  };

  const seasonCfg = SEASONS.find((s) => s.id === form.season);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[hsl(75_95%_45%)]" />
            {offer ? "Edit seasonal offer" : "Plan a festival / seasonal offer"}
          </DialogTitle>
          <DialogDescription>
            Drive a revenue spike around holidays and high-demand seasons. Auto-launches, caps redemptions and tracks ROI.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2 col-span-2">
              <Label>Offer name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Holiday Glow-Up" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Season / festival</Label>
              <Select
                value={form.season}
                onValueChange={(v) => {
                  const s = SEASONS.find((x) => x.id === v);
                  setForm({ ...form, season: v, banner_color: s?.color ?? form.banner_color });
                }}
              >
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEASONS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled — auto-launch on start date</SelectItem>
                  <SelectItem value="live">Live now</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Marketing description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Festive grooming with seasonal scents and a complimentary photo." className="rounded-xl min-h-[70px]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> Start</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> End</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Discount on plan</Label>
              <div className="flex items-center gap-2">
                <Input type="number" value={form.discount_pct} onChange={(e) => setForm({ ...form, discount_pct: Number(e.target.value) })} className="rounded-xl" />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Linked plan</Label>
              <Select value={form.plan_id} onValueChange={(v) => setForm({ ...form, plan_id: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Any / Apply broadly" /></SelectTrigger>
                <SelectContent>
                  {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Bonus festive perks (one per line)</Label>
            <Textarea value={form.bonus_perks} onChange={(e) => setForm({ ...form, bonus_perks: e.target.value })} placeholder="Holiday bow tie&#10;Free festive photo&#10;Treat box" className="rounded-xl min-h-[80px]" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select value={form.target_audience} onValueChange={(v: any) => setForm({ ...form, target_audience: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="new">New customers only</SelectItem>
                  <SelectItem value="existing">Existing members</SelectItem>
                  <SelectItem value="lapsed">Lapsed / canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max redemptions</Label>
              <Input type="number" value={form.max_redemptions} onChange={(e) => setForm({ ...form, max_redemptions: Number(e.target.value) })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Daily capacity cap</Label>
              <Input type="number" value={form.capacity_cap} onChange={(e) => setForm({ ...form, capacity_cap: Number(e.target.value) })} className="rounded-xl" />
            </div>
          </div>

          <div className="rounded-xl border border-border/60 p-3 flex items-center gap-3" style={{ background: `${seasonCfg?.color}10`, borderColor: `${seasonCfg?.color}40` }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: seasonCfg?.color, color: "white" }}>
              ✨
            </div>
            <div className="text-[11px] text-muted-foreground">
              <strong className="text-foreground">Festival readiness tip:</strong> Cap daily bookings to protect staff sanity. Add buffer slots and pre-fill staff time-off blocks. Stock up retail SKUs 30 days before launch.
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
          <Button onClick={submit} className="rounded-xl bg-[hsl(0_0%_8%)] text-[hsl(75_95%_62%)] hover:bg-[hsl(0_0%_15%)]">
            {offer ? "Save offer" : "Schedule offer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
