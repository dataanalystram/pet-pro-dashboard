import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays, differenceInDays, isToday, parseISO } from 'date-fns';
import {
  DollarSign, Calendar, Users, ShoppingCart, Star, ArrowRight, ArrowUpRight, ArrowDownRight,
  Clock, AlertTriangle, Package, MessageSquare, ThumbsDown, User, PawPrint, Zap, TrendingUp,
  Bell, ChevronRight, Plus,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  useBookings, useCustomers, useOrders, useReviews, useInventory,
  useStaff, useCampaigns, useCampaignRedemptions, useBookingRequests, useMessages,
} from '@/hooks/use-supabase-data';
import { useNotifications } from '@/hooks/use-notifications';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

// ─── Helpers ────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function fmtCompact(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

const statusBar: Record<string, string> = {
  pending: 'bg-amber-400',
  confirmed: 'bg-blue-400',
  in_progress: 'bg-violet-400',
  completed: 'bg-emerald-400',
  cancelled: 'bg-destructive',
};

const statusBadge: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200/60',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200/60',
  in_progress: 'bg-violet-50 text-violet-700 border-violet-200/60',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  cancelled: 'bg-red-50 text-red-700 border-red-200/60',
};

// ─── Sparkline ──────────────────────────────────────────
function Sparkline({ data, color = 'hsl(var(--primary))' }: { data: number[]; color?: string }) {
  const chartData = data.map((v, i) => ({ v, i }));
  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#spark-${color.replace(/[^a-z0-9]/gi, '')})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── KPI Card ───────────────────────────────────────────
function KpiCard({ label, value, change, changeType, sparkData, icon: Icon, iconBg }: {
  label: string; value: string; change: string; changeType: 'up' | 'down' | 'neutral';
  sparkData: number[]; icon: any; iconBg: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
            <Icon className="w-5 h-5" />
          </div>
          <Sparkline data={sparkData} color={changeType === 'down' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} />
        </div>
        <p className="text-2xl font-bold tracking-tight mt-3">{value}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <span className={cn('flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-md', {
            'text-emerald-600 bg-emerald-50': changeType === 'up',
            'text-red-600 bg-red-50': changeType === 'down',
            'text-muted-foreground bg-muted': changeType === 'neutral',
          })}>
            {changeType === 'up' && <ArrowUpRight className="w-3 h-3" />}
            {changeType === 'down' && <ArrowDownRight className="w-3 h-3" />}
            {change}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Section Header ─────────────────────────────────────
function SectionHeader({ title, count, action, onAction }: { title: string; count?: number; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {count !== undefined && (
          <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{count}</span>
        )}
      </div>
      {action && onAction && (
        <button onClick={onAction} className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
          {action} <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: bookings = [], isLoading: l1 } = useBookings();
  const { data: customers = [], isLoading: l2 } = useCustomers();
  const { data: orders = [], isLoading: l3 } = useOrders();
  const { data: reviews = [], isLoading: l4 } = useReviews();
  const { data: inventory = [], isLoading: l5 } = useInventory();
  const { data: staff = [], isLoading: l6 } = useStaff();
  const { data: campaigns = [] } = useCampaigns();
  const { data: redemptions = [] } = useCampaignRedemptions();
  const { data: requests = [] } = useBookingRequests();
  const { data: messages = [] } = useMessages();
  const { data: notifications = [] } = useNotifications();

  const isLoading = l1 || l2 || l3 || l4 || l5 || l6;

  // ─── Computed Metrics ───────────────────────────────────
  const metrics = useMemo(() => {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const d30 = subDays(now, 30);
    const d60 = subDays(now, 60);
    const d7 = subDays(now, 7);
    const d14 = subDays(now, 14);

    // Revenue 30d (bookings + orders)
    const bookingRev30 = bookings.filter(b => new Date(b.booking_date) >= d30).reduce((s, b) => s + Number(b.total_price), 0);
    const orderRev30 = orders.filter(o => new Date(o.created_at) >= d30).reduce((s, o) => s + Number(o.total), 0);
    const totalRev30 = bookingRev30 + orderRev30;
    const bookingRevPrev = bookings.filter(b => { const d = new Date(b.booking_date); return d >= d60 && d < d30; }).reduce((s, b) => s + Number(b.total_price), 0);
    const orderRevPrev = orders.filter(o => { const d = new Date(o.created_at); return d >= d60 && d < d30; }).reduce((s, o) => s + Number(o.total), 0);
    const totalRevPrev = bookingRevPrev + orderRevPrev;
    const revChange = totalRevPrev > 0 ? ((totalRev30 - totalRevPrev) / totalRevPrev * 100) : 0;

    // Bookings 30d
    const bookings30 = bookings.filter(b => new Date(b.booking_date) >= d30).length;
    const bookingsPrev = bookings.filter(b => { const d = new Date(b.booking_date); return d >= d60 && d < d30; }).length;
    const bookChange = bookingsPrev > 0 ? ((bookings30 - bookingsPrev) / bookingsPrev * 100) : 0;

    // New Customers 30d
    const newCust30 = customers.filter(c => c.created_at && new Date(c.created_at) >= d30).length;
    const newCustPrev = customers.filter(c => { const d = new Date(c.created_at); return d >= d60 && d < d30; }).length;
    const custChange = newCustPrev > 0 ? ((newCust30 - newCustPrev) / newCustPrev * 100) : 0;

    // Orders 30d
    const orders30 = orders.filter(o => new Date(o.created_at) >= d30).length;
    const ordersPrev = orders.filter(o => { const d = new Date(o.created_at); return d >= d60 && d < d30; }).length;
    const ordChange = ordersPrev > 0 ? ((orders30 - ordersPrev) / ordersPrev * 100) : 0;

    // Avg Rating
    const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

    // 7-day sparkline data for each KPI
    const revSpark = Array.from({ length: 7 }, (_, i) => {
      const day = format(subDays(now, 6 - i), 'yyyy-MM-dd');
      const bRev = bookings.filter(b => b.booking_date === day).reduce((s, b) => s + Number(b.total_price), 0);
      const oRev = orders.filter(o => format(new Date(o.created_at), 'yyyy-MM-dd') === day).reduce((s, o) => s + Number(o.total), 0);
      return bRev + oRev;
    });
    const bookSpark = Array.from({ length: 7 }, (_, i) => {
      const day = format(subDays(now, 6 - i), 'yyyy-MM-dd');
      return bookings.filter(b => b.booking_date === day).length;
    });
    const custSpark = Array.from({ length: 7 }, (_, i) => {
      const day = format(subDays(now, 6 - i), 'yyyy-MM-dd');
      return customers.filter(c => format(new Date(c.created_at), 'yyyy-MM-dd') === day).length;
    });
    const ordSpark = Array.from({ length: 7 }, (_, i) => {
      const day = format(subDays(now, 6 - i), 'yyyy-MM-dd');
      return orders.filter(o => format(new Date(o.created_at), 'yyyy-MM-dd') === day).length;
    });
    const ratSpark = Array.from({ length: 7 }, (_, i) => {
      const day = format(subDays(now, 6 - i), 'yyyy-MM-dd');
      const dayReviews = reviews.filter(r => format(new Date(r.created_at), 'yyyy-MM-dd') === day);
      return dayReviews.length > 0 ? dayReviews.reduce((s, r) => s + r.rating, 0) / dayReviews.length : avgRating;
    });

    // 30-day revenue trend (daily)
    const revenueTrend = Array.from({ length: 30 }, (_, i) => {
      const day = subDays(now, 29 - i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const bRev = bookings.filter(b => b.booking_date === dayStr).reduce((s, b) => s + Number(b.total_price), 0);
      const oRev = orders.filter(o => format(new Date(o.created_at), 'yyyy-MM-dd') === dayStr).reduce((s, o) => s + Number(o.total), 0);
      return { date: format(day, 'MMM d'), bookings: bRev, orders: oRev, total: bRev + oRev };
    });

    // Customer health
    const activeCustomers = customers.filter(c => c.last_booking_date && differenceInDays(now, new Date(c.last_booking_date)) <= 60).length;
    const atRiskCustomers = customers.filter(c => c.last_booking_date && differenceInDays(now, new Date(c.last_booking_date)) > 60).length;
    const newCustomers = customers.filter(c => differenceInDays(now, new Date(c.created_at)) <= 30).length;
    const noBookingCustomers = customers.filter(c => !c.last_booking_date).length;
    const healthData = [
      { name: 'Active', value: activeCustomers, fill: 'hsl(var(--success))' },
      { name: 'At Risk', value: atRiskCustomers, fill: 'hsl(var(--warning))' },
      { name: 'New', value: newCustomers, fill: 'hsl(var(--primary))' },
      { name: 'No Activity', value: noBookingCustomers, fill: 'hsl(var(--muted))' },
    ].filter(h => h.value > 0);

    // Today's bookings
    const todayBookings = bookings
      .filter(b => b.booking_date === today)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    // Action items
    const pendingRequests = requests.filter(r => r.status === 'pending').length;
    const lowStockItems = inventory.filter(i => i.quantity_in_stock <= i.reorder_point && i.status === 'active').length;
    const unreadMessages = messages.filter(m => m.sender === 'customer').length; // approximate
    const negativeReviews = reviews.filter(r => r.rating <= 2 && !r.admin_response).length;

    // Service performance (top 6 by revenue)
    const svcMap: Record<string, { name: string; revenue: number; count: number }> = {};
    bookings.filter(b => new Date(b.booking_date) >= d30).forEach(b => {
      const key = b.service_name;
      if (!svcMap[key]) svcMap[key] = { name: key, revenue: 0, count: 0 };
      svcMap[key].revenue += Number(b.total_price);
      svcMap[key].count += 1;
    });
    const servicePerf = Object.values(svcMap).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

    // Staff utilization today
    const staffUtil = staff.filter(s => s.status === 'active').map(s => {
      const todayCount = todayBookings.filter(b => b.assigned_staff_id === s.id).length;
      const capacity = s.max_daily_bookings || 8;
      return { name: s.full_name.split(' ')[0], bookings: todayCount, capacity, pct: Math.round((todayCount / capacity) * 100) };
    }).sort((a, b) => b.pct - a.pct).slice(0, 5);

    // Top customers
    const topCustomers = [...customers].sort((a, b) => Number(b.total_spent) - Number(a.total_spent)).slice(0, 5);

    // Campaign perf
    const activeCampaigns = campaigns.filter(c => c.status === 'active' && c.is_enabled);
    const totalRedemptions = redemptions.length;
    const totalDiscountGiven = redemptions.reduce((s, r) => s + Number(r.discount_applied), 0);

    // Recent notifications
    const recentNotifs = (notifications || []).slice(0, 8);

    return {
      totalRev30, revChange, bookings30, bookChange, newCust30, custChange, orders30, ordChange, avgRating,
      revSpark, bookSpark, custSpark, ordSpark, ratSpark,
      revenueTrend, healthData, todayBookings, pendingRequests, lowStockItems, unreadMessages, negativeReviews,
      servicePerf, staffUtil, topCustomers, activeCampaigns, totalRedemptions, totalDiscountGiven, recentNotifs,
      totalCustomers: customers.length,
    };
  }, [bookings, customers, orders, reviews, inventory, staff, campaigns, redemptions, requests, messages, notifications]);

  // ─── Loading State ──────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-[1440px]">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <Skeleton className="h-72 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-[1440px]">
      {/* ─── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{getGreeting()} 👋</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} — Executive overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate('/appointments')}>
            <Calendar className="w-4 h-4 mr-1.5" /> Schedule
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/requests')}>
            <Clock className="w-4 h-4 mr-1.5" /> Requests
            {metrics.pendingRequests > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-5 min-w-5 text-[10px] px-1.5">{metrics.pendingRequests}</Badge>
            )}
          </Button>
          <Button size="sm" onClick={() => navigate('/appointments')}>
            <Plus className="w-4 h-4 mr-1.5" /> New Booking
          </Button>
        </div>
      </div>

      {/* ─── KPI Row ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard
          icon={DollarSign} iconBg="bg-emerald-100 text-emerald-600"
          label="Revenue (30d)" value={fmtCurrency(metrics.totalRev30)}
          change={`${metrics.revChange >= 0 ? '+' : ''}${metrics.revChange.toFixed(0)}%`}
          changeType={metrics.revChange >= 0 ? 'up' : 'down'}
          sparkData={metrics.revSpark}
        />
        <KpiCard
          icon={Calendar} iconBg="bg-blue-100 text-blue-600"
          label="Bookings (30d)" value={fmtCompact(metrics.bookings30)}
          change={`${metrics.bookChange >= 0 ? '+' : ''}${metrics.bookChange.toFixed(0)}%`}
          changeType={metrics.bookChange >= 0 ? 'up' : 'down'}
          sparkData={metrics.bookSpark}
        />
        <KpiCard
          icon={Users} iconBg="bg-violet-100 text-violet-600"
          label="New Customers (30d)" value={fmtCompact(metrics.newCust30)}
          change={`${metrics.custChange >= 0 ? '+' : ''}${metrics.custChange.toFixed(0)}%`}
          changeType={metrics.custChange >= 0 ? 'up' : 'down'}
          sparkData={metrics.custSpark}
        />
        <KpiCard
          icon={ShoppingCart} iconBg="bg-orange-100 text-orange-600"
          label="Orders (30d)" value={fmtCompact(metrics.orders30)}
          change={`${metrics.ordChange >= 0 ? '+' : ''}${metrics.ordChange.toFixed(0)}%`}
          changeType={metrics.ordChange >= 0 ? 'up' : 'down'}
          sparkData={metrics.ordSpark}
        />
        <KpiCard
          icon={Star} iconBg="bg-amber-100 text-amber-600"
          label="Avg Rating" value={metrics.avgRating.toFixed(1)}
          change={`${reviews.length} reviews`}
          changeType="neutral"
          sparkData={metrics.ratSpark}
        />
      </div>

      {/* ─── Revenue Trend + Customer Health ─────────────── */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <SectionHeader title="Revenue Trend" count={undefined} action={undefined} />
          <CardContent className="p-4 pt-2">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.revenueTrend} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} width={48} />
                  <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-popover text-popover-foreground border rounded-lg px-3 py-2 text-xs shadow-lg">
                        <p className="font-semibold mb-1">{label}</p>
                        <p>Bookings: {fmtCurrency(payload[0]?.value as number)}</p>
                        <p>Orders: {fmtCurrency(payload[1]?.value as number)}</p>
                      </div>
                    );
                  }} />
                  <Area type="monotone" dataKey="bookings" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revGrad)" />
                  <Area type="monotone" dataKey="orders" stroke="hsl(var(--success))" strokeWidth={1.5} fill="url(#ordGrad)" strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-2 px-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-primary" /> Booking Revenue</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-emerald-500 border-dashed" style={{ borderTop: '1.5px dashed' }} /> Order Revenue</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <SectionHeader title="Customer Health" action="Customers" onAction={() => navigate('/customers')} />
          <CardContent className="p-4 flex flex-col items-center">
            <div className="h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metrics.healthData} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={3} strokeWidth={0}>
                    {metrics.healthData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-popover text-popover-foreground border rounded-lg px-3 py-2 text-xs shadow-lg">
                        <p className="font-semibold">{d.name}: {d.value}</p>
                      </div>
                    );
                  }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs w-full mt-1">
              {metrics.healthData.map(h => (
                <div key={h.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: h.fill }} />
                  <span className="text-muted-foreground">{h.name}</span>
                  <span className="ml-auto font-semibold">{h.value}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">{metrics.totalCustomers} total customers</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Today's Schedule + Action Items ──────────────── */}
      <div className="grid lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <SectionHeader title="Today's Schedule" count={metrics.todayBookings.length} action="Calendar" onAction={() => navigate('/appointments')} />
          {metrics.todayBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No bookings today</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Your schedule is clear</p>
            </div>
          ) : (
            <div className="divide-y max-h-[340px] overflow-y-auto">
              {metrics.todayBookings.map(b => {
                const timeStr = b.start_time ? new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
                return (
                  <div key={b.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                    <span className="text-xs font-mono text-muted-foreground w-12 flex-shrink-0">{timeStr}</span>
                    <div className={cn('w-0.5 self-stretch rounded-full flex-shrink-0', statusBar[b.status] || 'bg-muted')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{b.service_name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <User className="w-3 h-3" /><span className="truncate">{b.customer_name}</span>
                        <span className="text-border">·</span>
                        <PawPrint className="w-3 h-3" /><span>{b.pet_name}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn('text-[10px] hidden sm:inline-flex', statusBadge[b.status])}>
                      {b.status?.replace('_', ' ')}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <SectionHeader title="Action Items" />
          <CardContent className="p-0 divide-y">
            {[
              { label: 'Pending Requests', count: metrics.pendingRequests, icon: Clock, color: 'text-amber-600 bg-amber-50', path: '/requests' },
              { label: 'Low Stock Items', count: metrics.lowStockItems, icon: Package, color: 'text-red-600 bg-red-50', path: '/inventory' },
              { label: 'Negative Reviews', count: metrics.negativeReviews, icon: ThumbsDown, color: 'text-orange-600 bg-orange-50', path: '/reviews' },
              { label: 'Unread Messages', count: metrics.unreadMessages, icon: MessageSquare, color: 'text-blue-600 bg-blue-50', path: '/messages' },
            ].map(item => (
              <button key={item.label} onClick={() => navigate(item.path)}
                className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-muted/40 transition-colors text-left">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', item.color)}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.count === 0 ? 'All clear' : `${item.count} need attention`}</p>
                </div>
                {item.count > 0 && (
                  <Badge variant="destructive" className="h-6 min-w-6 text-[11px]">{item.count}</Badge>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ─── Service Performance + Staff Utilization ──────── */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <SectionHeader title="Service Performance (30d)" action="Services" onAction={() => navigate('/services')} />
          <CardContent className="p-4 pt-2">
            {metrics.servicePerf.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No booking data yet</p>
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.servicePerf} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-popover text-popover-foreground border rounded-lg px-3 py-2 text-xs shadow-lg">
                          <p className="font-semibold">{d.name}</p>
                          <p>Revenue: {fmtCurrency(d.revenue)}</p>
                          <p>{d.count} bookings</p>
                        </div>
                      );
                    }} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <SectionHeader title="Staff Utilization" action="Staff" onAction={() => navigate('/staff')} />
          <CardContent className="p-4 space-y-3">
            {metrics.staffUtil.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No staff data</p>
            ) : (
              metrics.staffUtil.map(s => (
                <div key={s.name}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-muted-foreground">{s.bookings}/{s.capacity}</span>
                  </div>
                  <Progress value={s.pct} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Top Customers + Campaign Performance ─────────── */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <SectionHeader title="Top Customers" action="All Customers" onAction={() => navigate('/customers')} />
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-2.5 px-4 font-medium">Customer</th>
                    <th className="text-right py-2.5 px-4 font-medium">LTV</th>
                    <th className="text-right py-2.5 px-4 font-medium hidden sm:table-cell">Bookings</th>
                    <th className="text-right py-2.5 px-4 font-medium hidden md:table-cell">Last Visit</th>
                    <th className="text-right py-2.5 px-4 font-medium">Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {metrics.topCustomers.map(c => (
                    <tr key={c.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                            {c.customer_name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{c.customer_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{c.customer_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-2.5 px-4 font-semibold">{fmtCurrency(Number(c.total_spent))}</td>
                      <td className="text-right py-2.5 px-4 hidden sm:table-cell">{c.total_bookings}</td>
                      <td className="text-right py-2.5 px-4 text-muted-foreground text-xs hidden md:table-cell">
                        {c.last_booking_date ? format(new Date(c.last_booking_date), 'MMM d') : '—'}
                      </td>
                      <td className="text-right py-2.5 px-4">
                        <Badge variant={c.tier === 'vip' ? 'default' : 'secondary'} className="text-[10px] capitalize">{c.tier}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <SectionHeader title="Campaign Performance" action="Marketing" onAction={() => navigate('/marketing')} />
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold">{metrics.activeCampaigns.length}</p>
                <p className="text-[11px] text-muted-foreground">Active</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold">{metrics.totalRedemptions}</p>
                <p className="text-[11px] text-muted-foreground">Redemptions</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {metrics.activeCampaigns.slice(0, 3).map(c => (
                <div key={c.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground">{c.redemptions}{c.max_redemptions ? `/${c.max_redemptions}` : ''} used</p>
                  </div>
                  {c.promo_code && (
                    <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">{c.promo_code}</code>
                  )}
                </div>
              ))}
              {metrics.activeCampaigns.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No active campaigns</p>
              )}
            </div>
            <div className="pt-2 border-t text-center">
              <p className="text-xs text-muted-foreground">Total discounts given: <span className="font-semibold text-foreground">{fmtCurrency(metrics.totalDiscountGiven)}</span></p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Activity Feed ───────────────────────────────── */}
      <Card>
        <SectionHeader title="Recent Activity" action="All Notifications" onAction={() => {}} />
        <CardContent className="p-0">
          {metrics.recentNotifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Bell className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            <div className="divide-y">
              {metrics.recentNotifs.map(n => (
                <div key={n.id} className={cn('flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors', !n.is_read && 'bg-accent/30')}>
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', {
                    'bg-amber-50 text-amber-600': n.type.includes('request'),
                    'bg-red-50 text-red-600': n.type.includes('negative') || n.type.includes('no_show'),
                    'bg-emerald-50 text-emerald-600': n.type.includes('completed') || n.type.includes('confirmed'),
                    'bg-blue-50 text-blue-600': n.type.includes('rescheduled') || n.type.includes('campaign'),
                    'bg-muted text-muted-foreground': !n.type.includes('request') && !n.type.includes('negative') && !n.type.includes('completed') && !n.type.includes('confirmed') && !n.type.includes('rescheduled') && !n.type.includes('campaign') && !n.type.includes('no_show'),
                  })}>
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.message}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground/60 flex-shrink-0 mt-0.5">
                    {format(new Date(n.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
