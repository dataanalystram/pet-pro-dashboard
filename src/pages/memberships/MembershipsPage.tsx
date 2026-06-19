import { useMemo, useState } from "react";
import {
  Repeat, TrendingUp, Users, AlertTriangle, Plus, Crown, Sparkles,
  Calendar, DollarSign, ArrowUpRight, ArrowDownRight, MoreHorizontal,
  CheckCircle2, Clock, XCircle, Search, Filter, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell,
} from "recharts";
import { toast } from "sonner";

/* --------------------------------- Types --------------------------------- */
type Plan = {
  id: string;
  name: string;
  tier: "Starter" | "Standard" | "Premium" | "Elite";
  price: number;
  interval: "month" | "year";
  includes: string[];
  perks: string[];
  active_members: number;
  mrr: number;
  color: string;
  featured?: boolean;
};

type Member = {
  id: string;
  owner: string;
  pet: string;
  plan: string;
  status: "active" | "past_due" | "paused" | "canceled";
  mrr: number;
  joined: string;
  next_charge: string;
  lifetime_value: number;
  churn_risk: "low" | "medium" | "high";
};

/* --------------------------------- Mock data --------------------------------- */
const plans: Plan[] = [
  {
    id: "p1", name: "Spa Essentials", tier: "Starter", price: 49, interval: "month",
    includes: ["1 bath / month", "Nail trim", "Ear cleaning"],
    perks: ["10% off retail", "Priority booking window"],
    active_members: 38, mrr: 1862, color: "hsl(200 90% 60%)",
  },
  {
    id: "p2", name: "Groom Club", tier: "Standard", price: 89, interval: "month",
    includes: ["1 full groom / month", "Bath + brush", "Teeth cleaning"],
    perks: ["15% off retail", "Free pickup once / mo", "Birthday treat"],
    active_members: 74, mrr: 6586, color: "hsl(75 95% 50%)", featured: true,
  },
  {
    id: "p3", name: "Daycare Unlimited", tier: "Premium", price: 299, interval: "month",
    includes: ["Unlimited daycare", "2 baths / month", "Monthly nail trim"],
    perks: ["20% off retail", "Free training assessment", "Member-only events"],
    active_members: 41, mrr: 12259, color: "hsl(280 70% 60%)",
  },
  {
    id: "p4", name: "VIP Concierge", tier: "Elite", price: 499, interval: "month",
    includes: ["Unlimited daycare + grooming", "Boarding 4 nights / mo", "Vet wellness check"],
    perks: ["25% off retail", "Dedicated handler", "24/7 chat", "Suite upgrades"],
    active_members: 12, mrr: 5988, color: "hsl(45 95% 55%)",
  },
];

const members: Member[] = [
  { id: "m1", owner: "Sarah Mitchell", pet: "Bailey (Golden)", plan: "Groom Club", status: "active", mrr: 89, joined: "2025-02-14", next_charge: "2026-07-14", lifetime_value: 1602, churn_risk: "low" },
  { id: "m2", owner: "James Chen", pet: "Luna (Husky)", plan: "Daycare Unlimited", status: "active", mrr: 299, joined: "2024-11-02", next_charge: "2026-07-02", lifetime_value: 5681, churn_risk: "low" },
  { id: "m3", owner: "Priya Sharma", pet: "Coco (Pom)", plan: "Spa Essentials", status: "past_due", mrr: 49, joined: "2025-06-08", next_charge: "2026-06-08", lifetime_value: 588, churn_risk: "high" },
  { id: "m4", owner: "Marco Rossi", pet: "Zeus (Mastiff)", plan: "VIP Concierge", status: "active", mrr: 499, joined: "2024-03-21", next_charge: "2026-07-21", lifetime_value: 13473, churn_risk: "low" },
  { id: "m5", owner: "Aisha Khan", pet: "Mocha (Lab)", plan: "Groom Club", status: "paused", mrr: 89, joined: "2025-01-11", next_charge: "—", lifetime_value: 1335, churn_risk: "medium" },
  { id: "m6", owner: "David Park", pet: "Bento (Shiba)", plan: "Daycare Unlimited", status: "active", mrr: 299, joined: "2025-04-30", next_charge: "2026-07-30", lifetime_value: 4185, churn_risk: "low" },
  { id: "m7", owner: "Olivia Brooks", pet: "Pixel (Frenchie)", plan: "Spa Essentials", status: "canceled", mrr: 0, joined: "2024-09-15", next_charge: "—", lifetime_value: 686, churn_risk: "high" },
  { id: "m8", owner: "Hiro Tanaka", pet: "Niko (Akita)", plan: "Groom Club", status: "active", mrr: 89, joined: "2025-05-22", next_charge: "2026-07-22", lifetime_value: 1157, churn_risk: "medium" },
];

const mrrTrend = [
  { m: "Jan", mrr: 14200, churned: 320 },
  { m: "Feb", mrr: 16850, churned: 410 },
  { m: "Mar", mrr: 19400, churned: 280 },
  { m: "Apr", mrr: 21100, churned: 520 },
  { m: "May", mrr: 23980, churned: 380 },
  { m: "Jun", mrr: 26695, churned: 290 },
];

const cohort = [
  { week: "W1", retained: 100 },
  { week: "W2", retained: 96 },
  { week: "W3", retained: 92 },
  { week: "W4", retained: 89 },
  { week: "W5", retained: 87 },
  { week: "W6", retained: 85 },
  { week: "W7", retained: 84 },
  { week: "W8", retained: 82 },
];

/* --------------------------------- Helpers --------------------------------- */
const fmt = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const statusColors: Record<Member["status"], string> = {
  active: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  past_due: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  paused: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  canceled: "bg-red-500/15 text-red-600 border-red-500/30",
};
const riskColors: Record<Member["churn_risk"], string> = {
  low: "text-emerald-600",
  medium: "text-orange-600",
  high: "text-red-600",
};

/* --------------------------------- Page --------------------------------- */
export default function MembershipsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Member["status"] | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);

  const totalMrr = useMemo(() => plans.reduce((s, p) => s + p.mrr, 0), []);
  const totalMembers = useMemo(() => plans.reduce((s, p) => s + p.active_members, 0), []);
  const arpu = totalMembers > 0 ? Math.round((totalMrr / totalMembers) * 100) / 100 : 0;
  const churnRate = 3.2;
  const arr = totalMrr * 12;

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        m.owner.toLowerCase().includes(search.toLowerCase()) ||
        m.pet.toLowerCase().includes(search.toLowerCase()) ||
        m.plan.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || m.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  const atRisk = members.filter((m) => m.churn_risk === "high").length;

  return (
    <div className="premium-dashboard p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-[hsl(75_95%_62%)] text-[hsl(0_0%_8%)] hover:bg-[hsl(75_95%_62%)] font-bold text-[10px] tracking-wider px-2 py-0.5">
              <Crown className="w-3 h-3 mr-1" /> PRO FEATURE
            </Badge>
            <span className="text-xs text-muted-foreground font-medium">Recurring Revenue Engine</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Memberships</h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-xl">
            Turn one-off appointments into predictable monthly revenue with subscription plans, prepaid packages and member-only perks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl gap-2">
            <Zap className="w-4 h-4" /> Promote plans
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gap-2 bg-[hsl(0_0%_8%)] text-[hsl(75_95%_62%)] hover:bg-[hsl(0_0%_15%)]">
                <Plus className="w-4 h-4" /> Create plan
              </Button>
            </DialogTrigger>
            <CreatePlanDialog onClose={() => setCreateOpen(false)} />
          </Dialog>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={DollarSign} label="Monthly Recurring Revenue" value={fmt(totalMrr)} delta="+18.2%" trend="up" sub="vs last month" />
        <KpiCard icon={TrendingUp} label="Annualized Run Rate" value={fmt(arr)} delta="+22.4%" trend="up" sub="projected ARR" />
        <KpiCard icon={Users} label="Active Members" value={totalMembers.toString()} delta="+14" trend="up" sub={`${fmt(arpu)} ARPU`} />
        <KpiCard icon={AlertTriangle} label="Churn Rate" value={`${churnRate}%`} delta="-0.4pp" trend="up" sub={`${atRisk} at risk`} highlight={atRisk > 0} />
      </section>

      {/* Charts row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="glass-card lg:col-span-2 p-5 rounded-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-base">MRR Growth</h3>
              <p className="text-xs text-muted-foreground">Last 6 months · gross vs churned</p>
            </div>
            <Badge variant="outline" className="rounded-lg text-[10px]">+87.9% YoY</Badge>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={mrrTrend}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(75 95% 50%)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="hsl(75 95% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                formatter={(v: number) => fmt(v)}
              />
              <Area type="monotone" dataKey="mrr" stroke="hsl(75 95% 45%)" strokeWidth={2.5} fill="url(#mrrGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass-card p-5 rounded-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-base">Cohort Retention</h3>
              <p className="text-xs text-muted-foreground">8-week rolling cohort</p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600">82% W8</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={cohort}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} domain={[70, 100]} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                formatter={(v: number) => `${v}%`}
              />
              <Bar dataKey="retained" radius={[6, 6, 0, 0]}>
                {cohort.map((_, i) => (
                  <Cell key={i} fill={`hsl(75 ${85 - i * 4}% ${55 - i * 1.5}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </section>

      {/* Plans + Members tabs */}
      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="rounded-xl bg-muted/50 p-1">
          <TabsTrigger value="plans" className="rounded-lg">Plans ({plans.length})</TabsTrigger>
          <TabsTrigger value="members" className="rounded-lg">Members ({members.length})</TabsTrigger>
          <TabsTrigger value="risk" className="rounded-lg">Churn Watch ({atRisk})</TabsTrigger>
        </TabsList>

        {/* Plans */}
        <TabsContent value="plans" className="mt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {plans.map((p) => (
              <PlanCard key={p.id} plan={p} />
            ))}
          </div>
        </TabsContent>

        {/* Members */}
        <TabsContent value="members" className="mt-5">
          <Card className="glass-card rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search owner, pet or plan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 rounded-xl bg-background"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                {(["all", "active", "past_due", "paused", "canceled"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg capitalize transition-all ${
                      statusFilter === s
                        ? "bg-[hsl(0_0%_8%)] text-[hsl(75_95%_62%)]"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left font-semibold px-4 py-3">Member</th>
                    <th className="text-left font-semibold px-4 py-3">Plan</th>
                    <th className="text-left font-semibold px-4 py-3">Status</th>
                    <th className="text-right font-semibold px-4 py-3">MRR</th>
                    <th className="text-right font-semibold px-4 py-3">LTV</th>
                    <th className="text-left font-semibold px-4 py-3">Next charge</th>
                    <th className="text-left font-semibold px-4 py-3">Risk</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[13px]">{m.owner}</div>
                        <div className="text-[11px] text-muted-foreground">{m.pet}</div>
                      </td>
                      <td className="px-4 py-3 text-[12px] font-medium">{m.plan}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`${statusColors[m.status]} capitalize text-[10px] font-semibold`}>
                          {m.status === "active" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {m.status === "past_due" && <Clock className="w-3 h-3 mr-1" />}
                          {m.status === "paused" && <Clock className="w-3 h-3 mr-1" />}
                          {m.status === "canceled" && <XCircle className="w-3 h-3 mr-1" />}
                          {m.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[13px]">{fmt(m.mrr)}</td>
                      <td className="px-4 py-3 text-right text-[12px] text-muted-foreground">{fmt(m.lifetime_value)}</td>
                      <td className="px-4 py-3 text-[12px] text-muted-foreground">{m.next_charge}</td>
                      <td className={`px-4 py-3 text-[12px] font-semibold capitalize ${riskColors[m.churn_risk]}`}>
                        {m.churn_risk}
                      </td>
                      <td className="px-4 py-3">
                        <button className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center">
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">
                        No members match this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Churn watch */}
        <TabsContent value="risk" className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {members.filter((m) => m.churn_risk !== "low").map((m) => (
              <Card key={m.id} className="glass-card rounded-2xl p-5 flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  m.churn_risk === "high" ? "bg-red-500/15 text-red-600" : "bg-orange-500/15 text-orange-600"
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-[14px]">{m.owner}</div>
                      <div className="text-[12px] text-muted-foreground">{m.pet} · {m.plan}</div>
                    </div>
                    <Badge variant="outline" className={`${riskColors[m.churn_risk]} border-current/30 text-[10px] capitalize`}>
                      {m.churn_risk} risk
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-[11px]">
                    <div>
                      <div className="text-muted-foreground">Status</div>
                      <div className="font-semibold capitalize">{m.status.replace("_", " ")}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">LTV at stake</div>
                      <div className="font-semibold">{fmt(m.lifetime_value)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">MRR</div>
                      <div className="font-semibold">{fmt(m.mrr)}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" className="rounded-lg h-8 text-[11px] bg-[hsl(0_0%_8%)] text-[hsl(75_95%_62%)] hover:bg-[hsl(0_0%_15%)]" onClick={() => toast.success("Win-back offer sent")}>
                      Send win-back offer
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg h-8 text-[11px]" onClick={() => toast("Reached out via message")}>
                      Message owner
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* --------------------------------- Components --------------------------------- */
function KpiCard({
  icon: Icon, label, value, delta, trend, sub, highlight,
}: {
  icon: typeof DollarSign; label: string; value: string; delta: string; trend: "up" | "down"; sub: string; highlight?: boolean;
}) {
  return (
    <Card className={`glass-card rounded-2xl p-5 ${highlight ? "ring-1 ring-orange-500/30" : ""}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg ${
          trend === "up" ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/15 text-red-600"
        }`}>
          {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {delta}
        </div>
      </div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{label}</div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
    </Card>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <Card className={`glass-card rounded-2xl p-5 relative overflow-hidden flex flex-col ${plan.featured ? "ring-2 ring-[hsl(75_95%_62%)]" : ""}`}>
      {plan.featured && (
        <div className="absolute top-3 right-3">
          <Badge className="bg-[hsl(75_95%_62%)] text-[hsl(0_0%_8%)] hover:bg-[hsl(75_95%_62%)] text-[9px] font-bold tracking-wider">
            <Sparkles className="w-3 h-3 mr-1" /> POPULAR
          </Badge>
        </div>
      )}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full" style={{ background: plan.color }} />
        <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">{plan.tier}</span>
      </div>
      <h3 className="text-lg font-bold">{plan.name}</h3>
      <div className="flex items-baseline gap-1 mt-2">
        <span className="text-3xl font-extrabold tracking-tight">${plan.price}</span>
        <span className="text-xs text-muted-foreground">/{plan.interval}</span>
      </div>

      <div className="mt-4 space-y-2 flex-1">
        <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Includes</div>
        {plan.includes.map((i) => (
          <div key={i} className="flex items-start gap-2 text-[12px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>{i}</span>
          </div>
        ))}
        <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground pt-2">Perks</div>
        {plan.perks.map((p) => (
          <div key={p} className="flex items-start gap-2 text-[12px] text-muted-foreground">
            <Sparkles className="w-3 h-3 text-[hsl(75_95%_45%)] flex-shrink-0 mt-1" />
            <span>{p}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Active</div>
          <div className="font-bold text-sm">{plan.active_members} members</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">MRR</div>
          <div className="font-bold text-sm text-[hsl(75_95%_40%)]">{fmt(plan.mrr)}</div>
        </div>
      </div>
    </Card>
  );
}

function CreatePlanDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [trialEnabled, setTrialEnabled] = useState(false);
  const [perks, setPerks] = useState("");

  const handleCreate = () => {
    if (!name || !price) {
      toast.error("Name and price are required");
      return;
    }
    toast.success(`Plan "${name}" created`);
    onClose();
  };

  return (
    <DialogContent className="sm:max-w-[520px] rounded-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-[hsl(75_95%_45%)]" />
          Create membership plan
        </DialogTitle>
        <DialogDescription>
          Set up a recurring subscription that auto-bills your customers monthly or yearly.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label>Plan name</Label>
          <Input placeholder="e.g. Groom Club" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Price</Label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number" placeholder="89" value={price} onChange={(e) => setPrice(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Interval</Label>
            <div className="flex rounded-xl bg-muted p-1">
              {(["month", "year"] as const).map((i) => (
                <button
                  key={i}
                  onClick={() => setInterval(i)}
                  className={`flex-1 text-[12px] font-semibold capitalize py-1.5 rounded-lg transition-all ${
                    interval === i ? "bg-background shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {i}ly
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Perks & benefits</Label>
          <Textarea
            placeholder="One per line — e.g. 15% off retail&#10;Free pickup once / month"
            value={perks} onChange={(e) => setPerks(e.target.value)}
            className="rounded-xl min-h-[90px]"
          />
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
          <div>
            <div className="text-[13px] font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" /> 14-day free trial
            </div>
            <div className="text-[11px] text-muted-foreground">Let customers try the plan before being charged</div>
          </div>
          <Switch checked={trialEnabled} onCheckedChange={setTrialEnabled} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
        <Button onClick={handleCreate} className="rounded-xl bg-[hsl(0_0%_8%)] text-[hsl(75_95%_62%)] hover:bg-[hsl(0_0%_15%)]">
          Launch plan
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
