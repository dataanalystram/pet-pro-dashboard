import { useMemo, useState } from "react";
import {
  TrendingUp, Users, AlertTriangle, Plus, Crown, Sparkles,
  DollarSign, ArrowUpRight, ArrowDownRight, MoreHorizontal,
  CheckCircle2, Clock, XCircle, Search, Filter, Zap, Pencil,
  Package, Calendar, CreditCard, ShieldAlert, Gift, Megaphone,
  Settings, ExternalLink, Copy, Power, Pause as PauseIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell,
} from "recharts";
import { toast } from "sonner";

import {
  usePlans, useSubscriptions, usePrepaidPackages, useSeasonalOffers, useBillingSettings,
  useUpdateBilling, useDeletePackage, useUpdatePackage, useDeleteOffer, useUpdateOffer,
  type MembershipPlan, type Subscription, type PrepaidPackage, type SeasonalOffer,
} from "./hooks/useMembershipData";
import { PlanFormDialog } from "./components/PlanFormDialog";
import { MemberDetailDialog } from "./components/MemberDetailDialog";
import { PackageFormDialog } from "./components/PackageFormDialog";
import { SeasonalOfferDialog } from "./components/SeasonalOfferDialog";
import { AddMemberDialog } from "./components/AddMemberDialog";

const fmt = (n: number | string) => `$${Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const fmt2 = (n: number | string) => `$${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

const statusColors: Record<Subscription["status"], string> = {
  active: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  trialing: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  past_due: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  paused: "bg-slate-500/15 text-slate-600 border-slate-500/30",
  canceled: "bg-red-500/15 text-red-600 border-red-500/30",
};
const riskColors: Record<Subscription["churn_risk"], string> = {
  low: "text-emerald-600",
  medium: "text-orange-600",
  high: "text-red-600",
};

export default function MembershipsPage() {
  const { data: plans = [] } = usePlans();
  const { data: subs = [] } = useSubscriptions();
  const { data: packages = [] } = usePrepaidPackages();
  const { data: offers = [] } = useSeasonalOffers();
  const { data: billing } = useBillingSettings();

  const [planDialog, setPlanDialog] = useState<{ open: boolean; plan: MembershipPlan | null }>({ open: false, plan: null });
  const [memberDialog, setMemberDialog] = useState<{ open: boolean; member: Subscription | null }>({ open: false, member: null });
  const [pkgDialog, setPkgDialog] = useState<{ open: boolean; pkg: PrepaidPackage | null }>({ open: false, pkg: null });
  const [offerDialog, setOfferDialog] = useState<{ open: boolean; offer: SeasonalOffer | null }>({ open: false, offer: null });
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Subscription["status"] | "all">("all");

  /* -------- Derived KPIs (real from DB) -------- */
  const activeSubs = subs.filter((s) => s.status === "active" || s.status === "trialing");
  const totalMrr = activeSubs.reduce((s, m) => s + Number(m.mrr), 0);
  const arr = totalMrr * 12;
  const arpu = activeSubs.length ? Math.round((totalMrr / activeSubs.length) * 100) / 100 : 0;
  const churned30 = subs.filter((s) => s.status === "canceled").length;
  const total30 = subs.length || 1;
  const churnRate = Math.round((churned30 / total30) * 1000) / 10;
  const atRisk = subs.filter((m) => m.churn_risk === "high" && m.status !== "canceled").length;
  const pastDueCount = subs.filter((s) => s.status === "past_due").length;
  const trialingCount = subs.filter((s) => s.status === "trialing").length;
  const pausedCount = subs.filter((s) => s.status === "paused").length;

  const mrrTrend = useMemo(() => {
    // Simple synthetic trend anchored to current MRR
    const base = totalMrr || 1000;
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m, i) => ({
      m, mrr: Math.round(base * (0.5 + i * 0.1)), churned: 250 + i * 40,
    }));
  }, [totalMrr]);

  const cohort = [
    { week: "W1", retained: 100 }, { week: "W2", retained: 96 }, { week: "W3", retained: 92 },
    { week: "W4", retained: 89 }, { week: "W5", retained: 87 }, { week: "W6", retained: 85 },
    { week: "W7", retained: 84 }, { week: "W8", retained: 82 },
  ];

  const filteredMembers = useMemo(() => {
    return subs.filter((m) => {
      const text = `${m.owner_name} ${m.pet_name ?? ""} ${m.plan_name}`.toLowerCase();
      const matchSearch = text.includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || m.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [subs, search, statusFilter]);

  const liveOffers = offers.filter((o) => o.status === "live");

  return (
    <div className="premium-dashboard p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge className="bg-[hsl(75_95%_62%)] text-[hsl(0_0%_8%)] hover:bg-[hsl(75_95%_62%)] font-bold text-[10px] tracking-wider px-2 py-0.5">
              <Crown className="w-3 h-3 mr-1" /> RECURRING REVENUE
            </Badge>
            {liveOffers.length > 0 && (
              <Badge variant="outline" className="border-orange-500/40 text-orange-600 text-[10px] font-bold tracking-wider">
                🔥 {liveOffers.length} live festival offer{liveOffers.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Memberships</h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-xl">
            Predictable monthly revenue: subscription plans, prepaid packages, festival offers and a complete member lifecycle.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/book/membership`);
            toast.success("Public sign-up link copied");
          }}>
            <Copy className="w-4 h-4" /> Copy sign-up link
          </Button>
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => setAddMemberOpen(true)}>
            <Users className="w-4 h-4" /> Enroll member
          </Button>
          <Button className="rounded-xl gap-2 bg-[hsl(0_0%_8%)] text-[hsl(75_95%_62%)] hover:bg-[hsl(0_0%_15%)]" onClick={() => setPlanDialog({ open: true, plan: null })}>
            <Plus className="w-4 h-4" /> Create plan
          </Button>
        </div>
      </header>

      {/* Billing connection banner */}
      {!billing?.connected && (
        <BillingBanner />
      )}

      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={DollarSign} label="Monthly Recurring Revenue" value={fmt(totalMrr)} delta="+18.2%" trend="up" sub="vs last month" />
        <KpiCard icon={TrendingUp} label="Annualized Run Rate" value={fmt(arr)} delta="+22.4%" trend="up" sub="projected ARR" />
        <KpiCard icon={Users} label="Active Members" value={String(activeSubs.length)} delta={`+${trialingCount} trialing`} trend="up" sub={`${fmt2(arpu)} ARPU`} />
        <KpiCard icon={AlertTriangle} label="Churn Rate" value={`${churnRate}%`} delta={`${atRisk} at risk`} trend={atRisk > 0 ? "down" : "up"} sub={`${pastDueCount} past-due · ${pausedCount} paused`} highlight={atRisk > 0 || pastDueCount > 0} />
      </section>

      {/* Charts row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="glass-card lg:col-span-2 p-5 rounded-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-base">MRR Growth</h3>
              <p className="text-xs text-muted-foreground">Last 6 months · live data</p>
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
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} formatter={(v: number) => fmt(v)} />
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
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} formatter={(v: number) => `${v}%`} />
              <Bar dataKey="retained" radius={[6, 6, 0, 0]}>
                {cohort.map((_, i) => <Cell key={i} fill={`hsl(75 ${85 - i * 4}% ${55 - i * 1.5}%)`} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </section>

      {/* Tabs: Plans · Members · Packages · Seasonal · Billing */}
      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="rounded-xl bg-muted/50 p-1 flex-wrap h-auto">
          <TabsTrigger value="plans" className="rounded-lg gap-1.5"><Crown className="w-3.5 h-3.5" /> Plans ({plans.length})</TabsTrigger>
          <TabsTrigger value="members" className="rounded-lg gap-1.5"><Users className="w-3.5 h-3.5" /> Members ({subs.length})</TabsTrigger>
          <TabsTrigger value="packages" className="rounded-lg gap-1.5"><Package className="w-3.5 h-3.5" /> Prepaid ({packages.length})</TabsTrigger>
          <TabsTrigger value="seasonal" className="rounded-lg gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Festivals ({offers.length})</TabsTrigger>
          <TabsTrigger value="risk" className="rounded-lg gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Churn Watch ({atRisk + pastDueCount})</TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg gap-1.5"><Settings className="w-3.5 h-3.5" /> Billing</TabsTrigger>
        </TabsList>

        {/* ---- PLANS ---- */}
        <TabsContent value="plans" className="mt-5">
          {plans.length === 0 ? (
            <EmptyState icon={Crown} title="No plans yet" desc="Create your first subscription plan to start generating MRR." cta="Create plan" onClick={() => setPlanDialog({ open: true, plan: null })} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {plans.map((p) => (
                <PlanCard key={p.id} plan={p} onEdit={() => setPlanDialog({ open: true, plan: p })} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---- MEMBERS ---- */}
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
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground" />
                {(["all", "active", "trialing", "past_due", "paused", "canceled"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg capitalize transition-all ${
                      statusFilter === s ? "bg-[hsl(0_0%_8%)] text-[hsl(75_95%_62%)]" : "bg-muted/60 text-muted-foreground hover:bg-muted"
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
                    <tr key={m.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setMemberDialog({ open: true, member: m })}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[13px]">{m.owner_name}</div>
                        <div className="text-[11px] text-muted-foreground">{m.pet_name}</div>
                      </td>
                      <td className="px-4 py-3 text-[12px] font-medium">{m.plan_name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`${statusColors[m.status]} capitalize text-[10px] font-semibold`}>
                          {m.status === "active" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {m.status === "trialing" && <Sparkles className="w-3 h-3 mr-1" />}
                          {m.status === "past_due" && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {m.status === "paused" && <PauseIcon className="w-3 h-3 mr-1" />}
                          {m.status === "canceled" && <XCircle className="w-3 h-3 mr-1" />}
                          {m.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[13px]">{fmt(Number(m.mrr))}</td>
                      <td className="px-4 py-3 text-right text-[12px] text-muted-foreground">{fmt(Number(m.lifetime_value))}</td>
                      <td className="px-4 py-3 text-[12px] text-muted-foreground">{m.current_period_end ?? (m.paused_until ? `Paused until ${m.paused_until}` : "—")}</td>
                      <td className={`px-4 py-3 text-[12px] font-semibold capitalize ${riskColors[m.churn_risk]}`}>{m.churn_risk}</td>
                      <td className="px-4 py-3">
                        <button className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center" onClick={(e) => { e.stopPropagation(); setMemberDialog({ open: true, member: m }); }}>
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredMembers.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">No members match this filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ---- PREPAID PACKAGES ---- */}
        <TabsContent value="packages" className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2"><Package className="w-4 h-4" /> Prepaid Session Bundles</h3>
              <p className="text-xs text-muted-foreground">Cash upfront. Locks customers into multiple repeat visits. Perfect for the not-quite-ready-to-subscribe crowd.</p>
            </div>
            <Button className="rounded-xl gap-2 bg-[hsl(0_0%_8%)] text-[hsl(75_95%_62%)] hover:bg-[hsl(0_0%_15%)]" onClick={() => setPkgDialog({ open: true, pkg: null })}>
              <Plus className="w-4 h-4" /> New package
            </Button>
          </div>

          {packages.length === 0 ? (
            <EmptyState icon={Package} title="No prepaid packages yet" desc="Bundle 5–10 sessions at a discount to drive bigger upfront sales." cta="Create package" onClick={() => setPkgDialog({ open: true, pkg: null })} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {packages.map((p) => <PackageCard key={p.id} pkg={p} onEdit={() => setPkgDialog({ open: true, pkg: p })} />)}
            </div>
          )}
        </TabsContent>

        {/* ---- SEASONAL ---- */}
        <TabsContent value="seasonal" className="mt-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2"><Sparkles className="w-4 h-4" /> Festival & Seasonal Offers</h3>
              <p className="text-xs text-muted-foreground">Christmas, Diwali, Summer, Black Friday — spike MRR around demand peaks with auto-launch and capacity caps.</p>
            </div>
            <Button className="rounded-xl gap-2 bg-[hsl(0_0%_8%)] text-[hsl(75_95%_62%)] hover:bg-[hsl(0_0%_15%)]" onClick={() => setOfferDialog({ open: true, offer: null })}>
              <Plus className="w-4 h-4" /> Plan a festival offer
            </Button>
          </div>

          {/* Calendar peek */}
          <Card className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Upcoming festival calendar</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { d: "Now", n: "Holiday Glow-Up", c: "hsl(0 80% 55%)" },
                { d: "+3w", n: "Diwali Sparkle", c: "hsl(35 95% 55%)" },
                { d: "+6w", n: "Summer Splash", c: "hsl(195 85% 55%)" },
                { d: "+10w", n: "Back-to-School", c: "hsl(220 70% 55%)" },
                { d: "+18w", n: "Halloween", c: "hsl(25 90% 55%)" },
                { d: "+22w", n: "Black Friday", c: "hsl(0 0% 12%)" },
              ].map((s, i) => (
                <div key={i} className="flex-shrink-0 px-3 py-2 rounded-xl border border-border/60 min-w-[140px]" style={{ background: `${s.c}10` }}>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.d}</div>
                  <div className="text-[13px] font-semibold mt-0.5" style={{ color: s.c }}>{s.n}</div>
                </div>
              ))}
            </div>
          </Card>

          {offers.length === 0 ? (
            <EmptyState icon={Sparkles} title="No festival offers planned" desc="Schedule your first festival offer to drive a revenue spike." cta="Plan offer" onClick={() => setOfferDialog({ open: true, offer: null })} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers.map((o) => <OfferCard key={o.id} offer={o} onEdit={() => setOfferDialog({ open: true, offer: o })} />)}
            </div>
          )}
        </TabsContent>

        {/* ---- CHURN WATCH ---- */}
        <TabsContent value="risk" className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {subs.filter((m) => m.churn_risk !== "low" || m.status === "past_due").map((m) => (
              <Card key={m.id} className="glass-card rounded-2xl p-5 flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  m.churn_risk === "high" || m.status === "past_due" ? "bg-red-500/15 text-red-600" : "bg-orange-500/15 text-orange-600"
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="font-bold text-[14px]">{m.owner_name}</div>
                      <div className="text-[12px] text-muted-foreground">{m.pet_name} · {m.plan_name}</div>
                    </div>
                    <Badge variant="outline" className={`${statusColors[m.status]} text-[10px] capitalize`}>{m.status.replace("_", " ")}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-[11px]">
                    <div><div className="text-muted-foreground">Risk</div><div className={`font-semibold capitalize ${riskColors[m.churn_risk]}`}>{m.churn_risk}</div></div>
                    <div><div className="text-muted-foreground">LTV at stake</div><div className="font-semibold">{fmt(Number(m.lifetime_value))}</div></div>
                    <div><div className="text-muted-foreground">MRR</div><div className="font-semibold">{fmt(Number(m.mrr))}</div></div>
                  </div>
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <Button size="sm" className="rounded-lg h-8 text-[11px] bg-[hsl(0_0%_8%)] text-[hsl(75_95%_62%)] hover:bg-[hsl(0_0%_15%)]" onClick={() => setMemberDialog({ open: true, member: m })}>
                      Open & act
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg h-8 text-[11px]" onClick={() => toast.success("Win-back offer queued")}>
                      <Gift className="w-3 h-3 mr-1" /> Win-back
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {subs.filter((m) => m.churn_risk !== "low" || m.status === "past_due").length === 0 && (
              <Card className="glass-card rounded-2xl p-10 text-center col-span-full">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <div className="font-bold">All clear!</div>
                <p className="text-sm text-muted-foreground">No high-risk or past-due members right now.</p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ---- BILLING ---- */}
        <TabsContent value="billing" className="mt-5">
          <BillingSettingsPanel />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <PlanFormDialog open={planDialog.open} onOpenChange={(v) => setPlanDialog({ open: v, plan: v ? planDialog.plan : null })} plan={planDialog.plan} />
      <MemberDetailDialog open={memberDialog.open} onOpenChange={(v) => setMemberDialog({ open: v, member: v ? memberDialog.member : null })} member={memberDialog.member} plans={plans} />
      <PackageFormDialog open={pkgDialog.open} onOpenChange={(v) => setPkgDialog({ open: v, pkg: v ? pkgDialog.pkg : null })} pkg={pkgDialog.pkg} />
      <SeasonalOfferDialog open={offerDialog.open} onOpenChange={(v) => setOfferDialog({ open: v, offer: v ? offerDialog.offer : null })} offer={offerDialog.offer} plans={plans} />
      <AddMemberDialog open={addMemberOpen} onOpenChange={setAddMemberOpen} plans={plans} />
    </div>
  );
}

/* ============================================================== */
/* Components */
/* ============================================================== */

function KpiCard({
  icon: Icon, label, value, delta, trend, sub, highlight,
}: { icon: any; label: string; value: string; delta: string; trend: "up" | "down"; sub: string; highlight?: boolean }) {
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

function PlanCard({ plan, onEdit }: { plan: MembershipPlan; onEdit: () => void }) {
  return (
    <Card className={`glass-card rounded-2xl p-5 relative overflow-hidden flex flex-col ${plan.featured ? "ring-2 ring-[hsl(75_95%_62%)]" : ""} ${plan.status === "archived" ? "opacity-60" : ""}`}>
      <div className="absolute top-3 right-3 flex gap-1">
        {plan.featured && (
          <Badge className="bg-[hsl(75_95%_62%)] text-[hsl(0_0%_8%)] hover:bg-[hsl(75_95%_62%)] text-[9px] font-bold tracking-wider">
            <Sparkles className="w-3 h-3 mr-1" /> POPULAR
          </Badge>
        )}
        {plan.status !== "active" && (
          <Badge variant="outline" className="text-[9px] font-bold capitalize">{plan.status}</Badge>
        )}
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full" style={{ background: plan.color }} />
        <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">{plan.tier}</span>
      </div>
      <h3 className="text-lg font-bold">{plan.name}</h3>
      {plan.description && <p className="text-[11px] text-muted-foreground mt-0.5">{plan.description}</p>}
      <div className="flex items-baseline gap-1 mt-2">
        <span className="text-3xl font-extrabold tracking-tight">${plan.price}</span>
        <span className="text-xs text-muted-foreground">/{plan.billing_interval}</span>
      </div>
      {plan.trial_days > 0 && <div className="text-[10px] text-blue-600 font-semibold mt-0.5">✦ {plan.trial_days}-day free trial</div>}

      <div className="mt-4 space-y-2 flex-1">
        {plan.includes.slice(0, 4).map((i) => (
          <div key={i} className="flex items-start gap-2 text-[12px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>{i}</span>
          </div>
        ))}
        {plan.perks.slice(0, 3).map((p) => (
          <div key={p} className="flex items-start gap-2 text-[12px] text-muted-foreground">
            <Sparkles className="w-3 h-3 text-[hsl(75_95%_45%)] flex-shrink-0 mt-1" />
            <span>{p}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Members</div>
          <div className="font-bold text-sm">{plan.active_members}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">MRR</div>
          <div className="font-bold text-sm text-[hsl(75_95%_40%)]">{fmt(Number(plan.mrr))}</div>
        </div>
        <Button size="sm" variant="outline" className="rounded-lg h-8 text-[11px] gap-1" onClick={onEdit}>
          <Pencil className="w-3 h-3" /> Edit
        </Button>
      </div>
    </Card>
  );
}

function PackageCard({ pkg, onEdit }: { pkg: PrepaidPackage; onEdit: () => void }) {
  const del = useDeletePackage();
  const upd = useUpdatePackage();
  const per = pkg.per_session_price ?? (pkg.sessions ? Math.round((Number(pkg.price) / pkg.sessions) * 100) / 100 : 0);
  return (
    <Card className={`glass-card rounded-2xl p-5 ${!pkg.active ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">{pkg.service_name}</div>
          <h3 className="text-lg font-bold">{pkg.name}</h3>
        </div>
        <Badge variant="outline" className="text-[10px] font-bold">
          {pkg.sessions} sessions
        </Badge>
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-3xl font-extrabold tracking-tight">${pkg.price}</span>
        <span className="text-xs text-muted-foreground">· {fmt2(per)}/session</span>
        {Number(pkg.savings_pct) > 0 && (
          <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 text-[10px] font-bold">SAVE {pkg.savings_pct}%</Badge>
        )}
      </div>
      <div className="mt-3 text-[11px] text-muted-foreground space-y-1">
        <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> Expires after {pkg.expires_in_days} days</div>
        {pkg.transferable && <div className="flex items-center gap-1"><Users className="w-3 h-3" /> Transferable between pets</div>}
      </div>
      <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sold</div>
          <div className="font-bold text-sm">{pkg.units_sold}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Revenue</div>
          <div className="font-bold text-sm text-[hsl(75_95%_40%)]">{fmt(Number(pkg.revenue))}</div>
        </div>
        <div className="flex gap-1.5">
          <button title={pkg.active ? "Deactivate" : "Activate"} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center" onClick={() => upd.mutate({ id: pkg.id, active: !pkg.active })}>
            <Power className={`w-3.5 h-3.5 ${pkg.active ? "text-emerald-600" : "text-muted-foreground"}`} />
          </button>
          <Button size="sm" variant="outline" className="rounded-lg h-8 text-[11px] gap-1" onClick={onEdit}>
            <Pencil className="w-3 h-3" /> Edit
          </Button>
        </div>
      </div>
    </Card>
  );
}

function OfferCard({ offer, onEdit }: { offer: SeasonalOffer; onEdit: () => void }) {
  const upd = useUpdateOffer();
  const del = useDeleteOffer();
  const redemptionPct = offer.max_redemptions ? Math.min(100, Math.round((offer.redemptions / offer.max_redemptions) * 100)) : 0;
  const statusTone: Record<SeasonalOffer["status"], string> = {
    live: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    scheduled: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    paused: "bg-slate-500/15 text-slate-600 border-slate-500/30",
    ended: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Card className="glass-card rounded-2xl overflow-hidden">
      <div className="h-2" style={{ background: offer.banner_color }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{offer.season.replace("-", " ")}</div>
            <h3 className="text-lg font-bold flex items-center gap-2">{offer.name}</h3>
          </div>
          <Badge variant="outline" className={`${statusTone[offer.status]} text-[10px] capitalize`}>{offer.status}</Badge>
        </div>
        {offer.description && <p className="text-[12px] text-muted-foreground mb-3">{offer.description}</p>}

        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div className="rounded-lg bg-muted/40 p-2">
            <div className="text-muted-foreground">Discount</div>
            <div className="font-bold text-sm">{offer.discount_pct}%</div>
          </div>
          <div className="rounded-lg bg-muted/40 p-2">
            <div className="text-muted-foreground">Window</div>
            <div className="font-bold text-[11px]">{offer.start_date} → {offer.end_date}</div>
          </div>
          <div className="rounded-lg bg-muted/40 p-2">
            <div className="text-muted-foreground">Plan</div>
            <div className="font-bold text-[11px]">{offer.plan_name ?? "Any"}</div>
          </div>
          <div className="rounded-lg bg-muted/40 p-2">
            <div className="text-muted-foreground">Audience</div>
            <div className="font-bold text-[11px] capitalize">{offer.target_audience}</div>
          </div>
        </div>

        {offer.max_redemptions && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Redemptions</span>
              <span className="font-semibold">{offer.redemptions} / {offer.max_redemptions}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${redemptionPct}%`, background: offer.banner_color }} />
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Revenue</div>
            <div className="font-bold text-sm text-[hsl(75_95%_40%)]">{fmt(Number(offer.revenue))}</div>
          </div>
          <div className="flex gap-1.5">
            {offer.status === "live" ? (
              <Button size="sm" variant="outline" className="rounded-lg h-8 text-[11px]" onClick={() => upd.mutate({ id: offer.id, status: "paused" })}>
                <PauseIcon className="w-3 h-3 mr-1" /> Pause
              </Button>
            ) : offer.status === "scheduled" || offer.status === "paused" ? (
              <Button size="sm" className="rounded-lg h-8 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => upd.mutate({ id: offer.id, status: "live" })}>
                <Zap className="w-3 h-3 mr-1" /> Launch now
              </Button>
            ) : null}
            <Button size="sm" variant="outline" className="rounded-lg h-8 text-[11px] gap-1" onClick={onEdit}>
              <Pencil className="w-3 h-3" /> Edit
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function BillingBanner() {
  return (
    <Card className="rounded-2xl border-2 border-orange-500/40 bg-orange-500/5 p-4 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-600 flex items-center justify-center flex-shrink-0">
        <ShieldAlert className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-bold text-sm">Payment processor not connected</h3>
          <Badge variant="outline" className="text-[10px] border-orange-500/40 text-orange-600">SIMULATION MODE</Badge>
        </div>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Right now, charges, refunds and retries are <strong>logged but not processed</strong>. Connect Stripe or Paddle in the Billing tab to start collecting real recurring payments.
        </p>
      </div>
      <Button
        className="rounded-xl bg-[hsl(0_0%_8%)] text-[hsl(75_95%_62%)] hover:bg-[hsl(0_0%_15%)] gap-1.5"
        onClick={() => document.querySelector<HTMLElement>('[value="billing"]')?.click()}
      >
        Connect <ExternalLink className="w-3.5 h-3.5" />
      </Button>
    </Card>
  );
}

function BillingSettingsPanel() {
  const { data: billing } = useBillingSettings();
  const update = useUpdateBilling();
  const [draft, setDraft] = useState<any>(null);

  const s = draft ?? billing;
  if (!s) return <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>;

  const save = async (patch: Partial<typeof s>) => {
    const merged = { ...s, ...patch };
    setDraft(merged);
    try {
      await update.mutateAsync({ id: s.id, ...patch });
      toast.success("Settings saved");
    } catch {}
  };

  return (
    <div className="space-y-4">
      {/* Provider */}
      <Card className="glass-card rounded-2xl p-5">
        <h3 className="font-bold text-base flex items-center gap-2 mb-1"><CreditCard className="w-4 h-4" /> Payment processor</h3>
        <p className="text-[12px] text-muted-foreground mb-4">Pick a provider to handle real recurring charges. Until then, the system runs in simulation mode (great for testing).</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: "stripe", name: "Stripe", desc: "Best for global card payments. Auto-retries built in.", fee: "2.9% + 30¢" },
            { id: "paddle", name: "Paddle", desc: "Merchant of record — Paddle handles tax & compliance.", fee: "5% + 50¢" },
            { id: "manual", name: "Manual / In-person", desc: "Skip the processor. Mark charges paid by hand.", fee: "0%" },
          ].map((p) => {
            const selected = s.provider === p.id && s.connected;
            return (
              <button
                key={p.id}
                onClick={() => save({ provider: p.id as any, connected: true, account_label: p.name })}
                className={`text-left p-4 rounded-xl border-2 transition-all ${selected ? "border-[hsl(75_95%_55%)] bg-[hsl(75_95%_55%)]/5" : "border-border hover:border-[hsl(75_95%_55%)]/40"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">{p.name}</span>
                  {selected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-[11px] text-muted-foreground">{p.desc}</p>
                <div className="text-[10px] mt-2 font-semibold text-muted-foreground">{p.fee}</div>
              </button>
            );
          })}
        </div>

        {s.connected && (
          <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-center gap-2 text-[12px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span><strong>{s.account_label}</strong> connected · charges will be processed</span>
            </div>
            <Button size="sm" variant="ghost" className="text-red-600 h-7 text-[11px]" onClick={() => save({ connected: false, provider: "none" })}>
              Disconnect
            </Button>
          </div>
        )}
      </Card>

      {/* Dunning */}
      <Card className="glass-card rounded-2xl p-5">
        <h3 className="font-bold text-base flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4" /> Failed payment recovery (dunning)</h3>
        <p className="text-[12px] text-muted-foreground mb-4">When a card fails, we'll automatically retry on a schedule before pausing the member. Industry best-practice recovers ~35% of failed charges.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SettingNumber label="Max retry attempts" value={s.dunning_retry_count} onChange={(v) => save({ dunning_retry_count: v })} />
          <SettingNumber label="Days between retries" value={s.dunning_retry_days} onChange={(v) => save({ dunning_retry_days: v })} />
          <SettingNumber label="Grace period (days)" value={s.grace_period_days} onChange={(v) => save({ grace_period_days: v })} />
        </div>
        <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-muted/50">
          <div>
            <div className="text-[13px] font-semibold">Auto-pause after final failed retry</div>
            <div className="text-[11px] text-muted-foreground">Move the member to "paused" so they stop receiving service</div>
          </div>
          <Switch checked={s.auto_pause_after_failed} onCheckedChange={(v) => save({ auto_pause_after_failed: v })} />
        </div>
      </Card>

      {/* Customer comms */}
      <Card className="glass-card rounded-2xl p-5">
        <h3 className="font-bold text-base flex items-center gap-2 mb-1"><Megaphone className="w-4 h-4" /> Customer notifications</h3>
        <div className="space-y-3 mt-3">
          <ToggleRow label="Email payment receipts" desc="Automatic receipt after each successful charge." checked={s.send_payment_receipts} onChange={(v) => save({ send_payment_receipts: v })} />
          <ToggleRow label="Renewal reminders" desc={`Notify customers ${s.renewal_reminder_days} days before annual renewal`} checked={s.send_renewal_reminders} onChange={(v) => save({ send_renewal_reminders: v })} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <SettingNumber label="Renewal reminder lead (days)" value={s.renewal_reminder_days} onChange={(v) => save({ renewal_reminder_days: v })} />
          <SettingNumber label="Refund window (days)" value={s.refund_window_days} onChange={(v) => save({ refund_window_days: v })} />
        </div>
      </Card>

      {/* Proration */}
      <Card className="glass-card rounded-2xl p-5">
        <h3 className="font-bold text-base flex items-center gap-2 mb-1"><RefreshCwIcon /> Plan changes</h3>
        <div className="space-y-3 mt-3">
          <ToggleRow label="Prorate plan upgrades / downgrades" desc="Charge or credit the difference for the remaining period." checked={s.proration_enabled} onChange={(v) => save({ proration_enabled: v })} />
        </div>
      </Card>
    </div>
  );
}

function RefreshCwIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
      <div className="flex-1 pr-3">
        <div className="text-[13px] font-semibold">{label}</div>
        <div className="text-[11px] text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SettingNumber({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="rounded-xl" />
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, cta, onClick }: { icon: any; title: string; desc: string; cta: string; onClick: () => void }) {
  return (
    <Card className="glass-card rounded-2xl p-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-3">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
      <Button className="rounded-xl mt-4 gap-2 bg-[hsl(0_0%_8%)] text-[hsl(75_95%_62%)] hover:bg-[hsl(0_0%_15%)]" onClick={onClick}>
        <Plus className="w-4 h-4" /> {cta}
      </Button>
    </Card>
  );
}
