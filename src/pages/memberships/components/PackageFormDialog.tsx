import { useEffect, useState } from "react";
import { Package, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { type PrepaidPackage, useInsertPackage, useUpdatePackage } from "../hooks/useMembershipData";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pkg?: PrepaidPackage | null;
};

export function PackageFormDialog({ open, onOpenChange, pkg }: Props) {
  const insert = useInsertPackage();
  const update = useUpdatePackage();
  const [form, setForm] = useState({
    name: "", service_name: "", sessions: 5, price: 375,
    expires_in_days: 365, transferable: false, active: true,
  });

  useEffect(() => {
    if (pkg) setForm({
      name: pkg.name, service_name: pkg.service_name, sessions: pkg.sessions,
      price: Number(pkg.price), expires_in_days: pkg.expires_in_days,
      transferable: pkg.transferable, active: pkg.active,
    });
    else setForm({ name: "", service_name: "", sessions: 5, price: 375, expires_in_days: 365, transferable: false, active: true });
  }, [pkg, open]);

  const perSession = form.sessions > 0 ? Math.round((form.price / form.sessions) * 100) / 100 : 0;

  const submit = async () => {
    if (!form.name.trim() || !form.service_name.trim()) return toast.error("Name and service are required");
    const payload = { ...form, per_session_price: perSession };
    try {
      if (pkg) await update.mutateAsync({ id: pkg.id, ...payload });
      else await insert.mutateAsync(payload);
      toast.success(pkg ? "Package updated" : "Package created");
      onOpenChange(false);
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[hsl(75_95%_45%)]" />
            {pkg ? "Edit package" : "Create prepaid package"}
          </DialogTitle>
          <DialogDescription>
            Prepaid bundles drive upfront cash and lock in repeat visits — perfect for customers who aren't ready for a subscription.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label>Package name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="10-Pack Daycare" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Linked service</Label>
            <Input value={form.service_name} onChange={(e) => setForm({ ...form, service_name: e.target.value })} placeholder="Daycare day pass" className="rounded-xl" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Sessions</Label>
              <Input type="number" value={form.sessions} onChange={(e) => setForm({ ...form, sessions: Number(e.target.value) })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Price</Label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="pl-9 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Expires (days)</Label>
              <Input type="number" value={form.expires_in_days} onChange={(e) => setForm({ ...form, expires_in_days: Number(e.target.value) })} className="rounded-xl" />
            </div>
          </div>
          <div className="rounded-xl bg-muted/50 p-3 text-[12px] flex justify-between">
            <span className="text-muted-foreground">Per session</span>
            <span className="font-bold">${perSession}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div>
              <div className="text-[13px] font-semibold">Transferable between pets</div>
              <div className="text-[11px] text-muted-foreground">Allow households with multiple pets to share sessions</div>
            </div>
            <Switch checked={form.transferable} onCheckedChange={(v) => setForm({ ...form, transferable: v })} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div>
              <div className="text-[13px] font-semibold">Active (on sale)</div>
              <div className="text-[11px] text-muted-foreground">Visible on your booking page</div>
            </div>
            <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
          <Button onClick={submit} className="rounded-xl bg-[hsl(0_0%_8%)] text-[hsl(75_95%_62%)] hover:bg-[hsl(0_0%_15%)]">
            {pkg ? "Save" : "Create package"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
