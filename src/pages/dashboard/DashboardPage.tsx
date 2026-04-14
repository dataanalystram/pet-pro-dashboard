import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays, differenceInDays } from 'date-fns';
import {
  DollarSign, Calendar, Users, ShoppingCart, Star, ArrowUpRight, ArrowDownRight,
  Clock, Package, MessageSquare, ThumbsDown, User, PawPrint, Zap, TrendingUp,
  Bell, ChevronRight, Plus, Sparkles, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadialBarChart, RadialBar,
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  useBookings, useCustomers, useOrders, useReviews, useInventory,
  useStaff, useCampaigns, useCampaignRedemptions, useBookingRequests, useMessages,
} from '@/hooks/use-supabase-data';
import { useNotifications } from '@/hooks/use-notifications';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

const statusColors: Record<string, string> = {
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

// ─── Premium Sparkline ──────────────────────────────────
function Sparkline({ data, color = 'hsl(var(--primary))', height = 40 }: { data: number[]; color?: string; height?: number }) {
  const chartData = data.map((v, i) => ({ v, i }));
  const gradientId = `spark-${color.replace(/[^a-z0-9]/gi, '')}-${Math.random().toString(36).slice(2, 6)}`;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Glass KPI Card ─────────────────────────────────────
function GlassKpiCard({ label, value, change, changeType, sparkData, icon: Icon, gradient, onClick }: {
  label: string; value: string; change: string; changeType: 'up' | 'down' | 'neutral';
  sparkData: number[]; icon: any; gradient: string; onClick?: () => void;
}) {
  const sparkColor = changeType === 'down' ? 'hsl(0, 84%, 60%)' : gradient.includes('emerald') ? 'hsl(142, 71%, 45%)' : gradient.includes('blue') ? 'hsl(221, 83%, 53%)' : gradient.includes('violet') ? 'hsl(270, 60%, 50%)' : gradient.includes('orange') ? 'hsl(25, 95%, 53%)' : 'hsl(38, 92%, 50%)';

  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-5 relative overflow-hidden group',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      {/* Subtle gradient orb */}
      <div className={cn('absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-30', gradient)} />

      <div className="flex items-center justify-between mb-3 relative">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', gradient)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className={cn('flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full', {
          'text-emerald-600 bg-emerald-500/10': changeType === 'up',
          'text-red-500 bg-red-500/10': changeType === 'down',
          'text-muted-foreground bg-muted': changeType === 'neutral',
        })}>
          {changeType === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
          {changeType === 'down' && <ArrowDownRight className="w-3.5 h-3.5" />}
          {change}
        </span>
      </div>

      <p className="text-3xl font-extrabold tracking-tight tabular-nums relative">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 relative">{label}</p>

      {/* Inline sparkline */}
      <div className="mt-3 relative">
        <Sparkline data={sparkData} color={sparkColor} height={36} />
      </div>

      {/* Hover arrow */}
      {onClick && (
        <ChevronRight className="absolute bottom-4 right-4 w-4 h-4 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-all group-hover:translate-x-0.5" />
      )}
    </div>
  );
}

// ─── Glass Section Card ─────────────────────────────────
function GlassSection({ title, count, action, onAction, children, className }: {
  title: string; count?: number; action?: string; onAction?: () => void; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn('glass-card rounded-2xl overflow-hidden', className)}>
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-bold tracking-tight">{title}</h2>
          {count !== undefined && (
            <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">{count}</span>
          )}
        </div>
        {action && onAction && (
          <button onClick={onAction} className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
            {action} <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Custom Tooltip ─────────────────────────────────────
function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl px-4 py-3 text-xs shadow-xl border-0" style={{ backdropFilter: 'blur(16px)' }}>
      <p className="font-bold text-foreground mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="capitalize">{p.dataKey}:</span>
          <span className="font-semibold text-foreground ml-auto">{formatter ? formatter(p.value) : p.value}</span>
        </div>
      ))}
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

    // Revenue
    const bookingRev30 = bookings.filter(b => new Date(b.booking_date) >= d30).reduce((s, b) => s + Number(b.total_price), 0);
    const orderRev30 = orders.filter(o => new Date(o.created_at) >= d30).reduce((s, o) => s + Number(o.total), 0);
    const totalRev30 = bookingRev30 + orderRev30;
    const bookingRevPrev = bookings.filter(b => { const d = new Date(b.booking_date); return d >= d60 && d < d30; }).reduce((s, b) => s + Number(b.total_price), 0);
    const orderRevPrev = orders.filter(o => { const d = new Date(o.created_at); return d >= d60 && d < d30; }).reduce((s, o) => s + Number(o.total), 0);
    const revChange = (bookingRevPrev + orderRevPrev) > 0 ? ((totalRev30 - bookingRevPrev - orderRevPrev) / (bookingRevPrev + orderRevPrev) * 100) : 0;

    // Bookings
    const bookings30 = bookings.filter(b => new Date(b.booking_date) >= d30).length;
    const bookingsPrev = bookings.filter(b => { const d = new Date(b.booking_date); return d >= d60 && d < d30; }).length;
    const bookChange = bookingsPrev > 0 ? ((bookings30 - bookingsPrev) / bookingsPrev * 100) : 0;

    // Customers
    const newCust30 = customers.filter(c => c.created_at && new Date(c.created_at) >= d30).length;
    const newCustPrev = customers.filter(c => { const d = new Date(c.created_at); return d >= d60 && d < d30; }).length;
    const custChange = newCustPrev > 0 ? ((newCust30 - newCustPrev) / newCustPrev * 100) : 0;

    // Orders
    const orders30 = orders.filter(o => new Date(o.created_at) >= d30).length;
    const ordersPrev = orders.filter(o => { const d = new Date(o.created_at); return d >= d60 && d < d30; }).length;
    const ordChange = ordersPrev > 0 ? ((orders30 - ordersPrev) / ordersPrev * 100) : 0;

    // Rating
    const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

    // Sparklines (7d)
    const spark = (filter: (day: string) => number) =>
      Array.from({ length: 7 }, (_, i) => filter(format(subDays(now, 6 - i), 'yyyy-MM-dd')));

    const revSpark = spark(day => {
      const bR = bookings.filter(b => b.booking_date === day).reduce((s, b) => s + Number(b.total_price), 0);
      const oR = orders.filter(o => format(new Date(o.created_at), 'yyyy-MM-dd') === day).reduce((s, o) => s + Number(o.total), 0);
      return bR + oR;
    });
    const bookSpark = spark(day => bookings.filter(b => b.booking_date === day).length);
    const custSpark = spark(day => customers.filter(c => format(new Date(c.created_at), 'yyyy-MM-dd') === day).length);
    const ordSpark = spark(day => orders.filter(o => format(new Date(o.created_at), 'yyyy-MM-dd') === day).length);
    const ratSpark = spark(day => {
      const dr = reviews.filter(r => format(new Date(r.created_at), 'yyyy-MM-dd') === day);
      return dr.length > 0 ? dr.reduce((s, r) => s + r.rating, 0) / dr.length : avgRating;
    });

    // Revenue trend (30d)
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
      { name: 'Active', value: activeCustomers, fill: 'hsl(142, 71%, 45%)' },
      { name: 'At Risk', value: atRiskCustomers, fill: 'hsl(38, 92%, 50%)' },
      { name: 'New', value: newCustomers, fill: 'hsl(221, 83%, 53%)' },
      { name: 'Inactive', value: noBookingCustomers, fill: 'hsl(220, 14%, 80%)' },
    ].filter(h => h.value > 0);

    // Today's bookings
    const todayBookings = bookings
      .filter(b => b.booking_date === today)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    // Action items
    const pendingRequests = requests.filter(r => r.status === 'pending').length;
    const lowStockItems = inventory.filter(i => i.quantity_in_stock <= i.reorder_point && i.status === 'active').length;
    const unreadMessages = messages.filter(m => m.sender === 'customer').length;
    const negativeReviews = reviews.filter(r => r.rating <= 2 && !r.admin_response).length;

    // Service performance
    const svcMap: Record<string, { name: string; revenue: number; count: number }> = {};
    bookings.filter(b => new Date(b.booking_date) >= d30).forEach(b => {
      if (!svcMap[b.service_name]) svcMap[b.service_name] = { name: b.service_name, revenue: 0, count: 0 };
      svcMap[b.service_name].revenue += Number(b.total_price);
      svcMap[b.service_name].count += 1;
    });
    const servicePerf = Object.values(svcMap).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

    // Staff utilization
    const staffUtil = staff.filter(s => s.status === 'active').map(s => {
      const todayCount = todayBookings.filter(b => b.assigned_staff_id === s.id).length;
      const capacity = s.max_daily_bookings || 8;
      return { name: s.full_name.split(' ')[0], bookings: todayCount, capacity, pct: Math.round((todayCount / capacity) * 100) };
    }).sort((a, b) => b.pct - a.pct).slice(0, 5);

    // Top customers
    const topCustomers = [...customers].sort((a, b) => Number(b.total_spent) - Number(a.total_spent)).slice(0, 5);

    // Campaigns
    const activeCampaigns = campaigns.filter(c => c.status === 'active' && c.is_enabled);
    const totalRedemptions = redemptions.length;
    const totalDiscountGiven = redemptions.reduce((s, r) => s + Number(r.discount_applied), 0);

    // Notifications
    const recentNotifs = (notifications || []).slice(0, 6);

    // Completion rate today
    const todayCompleted = todayBookings.filter(b => b.status === 'completed').length;
    const completionRate = todayBookings.length > 0 ? Math.round((todayCompleted / todayBookings.length) * 100) : 0;

    return {
      totalRev30, revChange, bookings30, bookChange, newCust30, custChange, orders30, ordChange, avgRating,
      revSpark, bookSpark, custSpark, ordSpark, ratSpark,
      revenueTrend, healthData, todayBookings, pendingRequests, lowStockItems, unreadMessages, negativeReviews,
      servicePerf, staffUtil, topCustomers, activeCampaigns, totalRedemptions, totalDiscountGiven, recentNotifs,
      totalCustomers: customers.length, completionRate, todayCompleted,
    };
  }, [bookings, customers, orders, reviews, inventory, staff, campaigns, redemptions, requests, messages, notifications]);

  // ─── Loading Skeleton ──────────────────────────────────
  if (isLoading) {
    return (
      <div className="gradient-mesh min-h-screen p-1">
        <div className="space-y-6 max-w-[1440px] mx-auto">
          <div className="h-16 shimmer rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-44 shimmer rounded-2xl" />)}
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="h-80 lg:col-span-2 shimmer rounded-2xl" />
            <div className="h-80 shimmer rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const actionItems = [
    { label: 'Pending Requests', count: metrics.pendingRequests, icon: Clock, gradient: 'bg-gradient-to-br from-amber-400 to-orange-500', path: '/requests' },
    { label: 'Low Stock Items', count: metrics.lowStockItems, icon: Package, gradient: 'bg-gradient-to-br from-red-400 to-rose-500', path: '/inventory' },
    { label: 'Negative Reviews', count: metrics.negativeReviews, icon: ThumbsDown, gradient: 'bg-gradient-to-br from-orange-400 to-amber-500', path: '/reviews' },
    { label: 'Messages', count: metrics.unreadMessages, icon: MessageSquare, gradient: 'bg-gradient-to-br from-blue-400 to-indigo-500', path: '/messages' },
  ];

  const totalActionItems = actionItems.reduce((s, a) => s + a.count, 0);

  return (
    <div className="gradient-mesh min-h-screen -m-4 sm:-m-6 p-4 sm:p-6">
      <div className="space-y-6 max-w-[1440px] mx-auto stagger-children">

        {/* ─── Hero Header ─────────────────────────────────── */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          {/* Animated gradient orbs */}
          <div className="gradient-orb w-32 h-32 bg-primary/30 -top-10 -right-10" />
          <div className="gradient-orb w-24 h-24 bg-success/20 bottom-0 left-1/4" style={{ animationDelay: '3s' }} />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Executive Dashboard</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{getGreeting()} 👋</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(), 'EEEE, MMMM d, yyyy')} — Here's your business at a glance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="glass-card border-0 hover:bg-primary/5" onClick={() => navigate('/appointments')}>
                <Calendar className="w-4 h-4 mr-1.5" /> Schedule
              </Button>
              <Button size="sm" variant="outline" className="glass-card border-0 hover:bg-primary/5" onClick={() => navigate('/requests')}>
                <Clock className="w-4 h-4 mr-1.5" /> Requests
                {metrics.pendingRequests > 0 && (
                  <Badge variant="destructive" className="ml-1.5 h-5 min-w-5 text-[10px] px-1.5 animate-scale-in">{metrics.pendingRequests}</Badge>
                )}
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/25" onClick={() => navigate('/appointments')}>
                <Plus className="w-4 h-4 mr-1.5" /> New Booking
              </Button>
            </div>
          </div>
        </div>

        {/* ─── KPI Cards ────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <GlassKpiCard
            icon={DollarSign} gradient="bg-gradient-to-br from-emerald-500 to-green-600"
            label="Revenue (30d)" value={fmtCurrency(metrics.totalRev30)}
            change={`${metrics.revChange >= 0 ? '+' : ''}${metrics.revChange.toFixed(0)}%`}
            changeType={metrics.revChange >= 0 ? 'up' : 'down'}
            sparkData={metrics.revSpark}
            onClick={() => navigate('/analytics')}
          />
          <GlassKpiCard
            icon={Calendar} gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
            label="Bookings (30d)" value={fmtCompact(metrics.bookings30)}
            change={`${metrics.bookChange >= 0 ? '+' : ''}${metrics.bookChange.toFixed(0)}%`}
            changeType={metrics.bookChange >= 0 ? 'up' : 'down'}
            sparkData={metrics.bookSpark}
            onClick={() => navigate('/appointments')}
          />
          <GlassKpiCard
            icon={Users} gradient="bg-gradient-to-br from-violet-500 to-purple-600"
            label="New Customers" value={fmtCompact(metrics.newCust30)}
            change={`${metrics.custChange >= 0 ? '+' : ''}${metrics.custChange.toFixed(0)}%`}
            changeType={metrics.custChange >= 0 ? 'up' : 'down'}
            sparkData={metrics.custSpark}
            onClick={() => navigate('/customers')}
          />
          <GlassKpiCard
            icon={ShoppingCart} gradient="bg-gradient-to-br from-orange-500 to-red-500"
            label="Orders (30d)" value={fmtCompact(metrics.orders30)}
            change={`${metrics.ordChange >= 0 ? '+' : ''}${metrics.ordChange.toFixed(0)}%`}
            changeType={metrics.ordChange >= 0 ? 'up' : 'down'}
            sparkData={metrics.ordSpark}
            onClick={() => navigate('/orders')}
          />
          <GlassKpiCard
            icon={Star} gradient="bg-gradient-to-br from-amber-500 to-yellow-500"
            label="Avg Rating" value={metrics.avgRating.toFixed(1)}
            change={`${reviews.length} reviews`}
            changeType="neutral"
            sparkData={metrics.ratSpark}
            onClick={() => navigate('/reviews')}
          />
        </div>

        {/* ─── Revenue Trend + Customer Health ─────────────── */}
        <div className="grid lg:grid-cols-3 gap-4">
          <GlassSection title="Revenue Trend" action="Analytics" onAction={() => navigate('/analytics')} className="lg:col-span-2">
            <div className="px-5 pb-5">
              <div className="h-[260px] cursor-pointer" onClick={() => navigate('/analytics')}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.revenueTrend} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.25} />
                        <stop offset="50%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.08} />
                        <stop offset="100%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ordGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(220, 13%, 91%)" strokeOpacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} axisLine={false} tickLine={false} interval={4} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={48} />
                    <Tooltip content={<ChartTooltip formatter={(v: number) => fmtCurrency(v)} />} />
                    <Area type="monotone" dataKey="bookings" stroke="hsl(221, 83%, 53%)" strokeWidth={2.5} fill="url(#revGrad2)" name="Bookings" />
                    <Area type="monotone" dataKey="orders" stroke="hsl(142, 71%, 45%)" strokeWidth={2} fill="url(#ordGrad2)" strokeDasharray="6 4" name="Orders" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-2"><span className="w-3 h-[3px] rounded-full bg-primary" /> Booking Revenue</span>
                <span className="flex items-center gap-2"><span className="w-3 h-[3px] rounded-full bg-success opacity-70" style={{ borderTop: '2px dashed' }} /> Order Revenue</span>
              </div>
            </div>
          </GlassSection>

          <GlassSection title="Customer Health" action="Customers" onAction={() => navigate('/customers')}>
            <div className="px-5 pb-5">
              <div className="h-[160px] cursor-pointer" onClick={() => navigate('/customers')}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={metrics.healthData} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={4} strokeWidth={0} cornerRadius={4}>
                      {metrics.healthData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs mt-2">
                {metrics.healthData.map(h => (
                  <div key={h.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: h.fill }} />
                    <span className="text-muted-foreground">{h.name}</span>
                    <span className="ml-auto font-bold tabular-nums">{h.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground text-center mt-3">{metrics.totalCustomers} total customers</p>
            </div>
          </GlassSection>
        </div>

        {/* ─── Today's Schedule + Action Items ──────────────── */}
        <div className="grid lg:grid-cols-5 gap-4">
          <GlassSection title="Today's Schedule" count={metrics.todayBookings.length} action="Calendar" onAction={() => navigate('/appointments')} className="lg:col-span-3">
            {metrics.todayBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-5">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4">
                  <Calendar className="w-7 h-7 text-primary/40" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">No bookings today</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Your schedule is clear — enjoy!</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50 max-h-[360px] overflow-y-auto">
                {metrics.todayBookings.map((b, idx) => {
                  const timeStr = b.start_time ? new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
                  return (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-primary/[0.03] transition-all cursor-pointer group/row"
                      onClick={() => navigate('/appointments')}
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <span className="text-xs font-mono text-muted-foreground w-14 flex-shrink-0 tabular-nums">{timeStr}</span>
                      <div className={cn('w-1 self-stretch rounded-full flex-shrink-0 transition-all group-hover/row:w-1.5', statusColors[b.status] || 'bg-muted')} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{b.service_name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <User className="w-3 h-3" /><span className="truncate">{b.customer_name}</span>
                          <span className="text-border">·</span>
                          <PawPrint className="w-3 h-3" /><span>{b.pet_name}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn('text-[10px] hidden sm:inline-flex font-semibold', statusBadge[b.status])}>
                        {b.status?.replace('_', ' ')}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/0 group-hover/row:text-muted-foreground/50 transition-all" />
                    </div>
                  );
                })}
              </div>
            )}
          </GlassSection>

          <GlassSection title="Action Center" count={totalActionItems > 0 ? totalActionItems : undefined} className="lg:col-span-2">
            <div className="px-2 pb-3 space-y-1">
              {actionItems.map(item => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-primary/[0.04] transition-all text-left group/action"
                >
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm', item.gradient)}>
                    <item.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">{item.count === 0 ? 'All clear ✓' : `${item.count} need attention`}</p>
                  </div>
                  {item.count > 0 && (
                    <span className="h-6 min-w-6 flex items-center justify-center text-[11px] font-bold text-white bg-destructive rounded-full px-2 animate-scale-in">
                      {item.count}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover/action:text-muted-foreground/60 transition-all group-hover/action:translate-x-0.5" />
                </button>
              ))}
            </div>

            {/* Completion ring */}
            <div className="border-t border-border/50 px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 relative flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={[{ value: metrics.completionRate }]} startAngle={90} endAngle={-270}>
                      <RadialBar dataKey="value" fill="hsl(142, 71%, 45%)" cornerRadius={10} background={{ fill: 'hsl(220, 14%, 94%)' }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold tabular-nums">
                    {metrics.completionRate}%
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold">Today's Progress</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {metrics.todayCompleted}/{metrics.todayBookings.length} completed
                  </p>
                </div>
              </div>
            </div>
          </GlassSection>
        </div>

        {/* ─── Service Performance + Staff Utilization ──────── */}
        <div className="grid lg:grid-cols-3 gap-4">
          <GlassSection title="Service Performance" action="Services" onAction={() => navigate('/services')} className="lg:col-span-2">
            <div className="px-5 pb-5">
              {metrics.servicePerf.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No booking data yet</p>
              ) : (
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.servicePerf} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="hsl(221, 83%, 53%)" />
                          <stop offset="100%" stopColor="hsl(270, 60%, 55%)" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(220, 13%, 91%)" strokeOpacity={0.5} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} axisLine={false} tickLine={false} width={100} />
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="glass-card rounded-xl px-4 py-3 text-xs shadow-xl">
                            <p className="font-bold">{d.name}</p>
                            <p className="text-muted-foreground mt-1">Revenue: <span className="text-foreground font-semibold">{fmtCurrency(d.revenue)}</span></p>
                            <p className="text-muted-foreground">{d.count} bookings</p>
                          </div>
                        );
                      }} />
                      <Bar dataKey="revenue" fill="url(#barGrad)" radius={[0, 6, 6, 0]} barSize={22} className="cursor-pointer" onClick={() => navigate('/services')} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </GlassSection>

          <GlassSection title="Staff Utilization" action="Staff" onAction={() => navigate('/staff')}>
            <div className="px-5 pb-5 space-y-4">
              {metrics.staffUtil.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No staff data</p>
              ) : (
                metrics.staffUtil.map(s => (
                  <div key={s.name} className="group/staff">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-[10px] font-bold text-primary">
                          {s.name.charAt(0)}
                        </div>
                        <span className="font-semibold">{s.name}</span>
                      </div>
                      <span className="text-muted-foreground tabular-nums">{s.bookings}/{s.capacity}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-700', {
                          'bg-gradient-to-r from-emerald-400 to-emerald-500': s.pct < 70,
                          'bg-gradient-to-r from-amber-400 to-orange-500': s.pct >= 70 && s.pct < 90,
                          'bg-gradient-to-r from-red-400 to-rose-500': s.pct >= 90,
                        })}
                        style={{ width: `${Math.min(s.pct, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassSection>
        </div>

        {/* ─── Top Customers + Campaigns ──────────────────── */}
        <div className="grid lg:grid-cols-3 gap-4">
          <GlassSection title="Top Customers" action="All Customers" onAction={() => navigate('/customers')} className="lg:col-span-2">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-xs text-muted-foreground">
                    <th className="text-left py-3 px-5 font-semibold">Customer</th>
                    <th className="text-right py-3 px-4 font-semibold">LTV</th>
                    <th className="text-right py-3 px-4 font-semibold hidden sm:table-cell">Bookings</th>
                    <th className="text-right py-3 px-4 font-semibold hidden md:table-cell">Last Visit</th>
                    <th className="text-right py-3 px-5 font-semibold">Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {metrics.topCustomers.map((c, i) => (
                    <tr key={c.id} className="hover:bg-primary/[0.03] transition-all cursor-pointer group/row" onClick={() => navigate('/customers')}>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                            {c.customer_name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{c.customer_name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{c.customer_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 font-bold tabular-nums">{fmtCurrency(Number(c.total_spent))}</td>
                      <td className="text-right py-3 px-4 hidden sm:table-cell tabular-nums">{c.total_bookings}</td>
                      <td className="text-right py-3 px-4 text-muted-foreground text-xs hidden md:table-cell">
                        {c.last_booking_date ? format(new Date(c.last_booking_date), 'MMM d') : '—'}
                      </td>
                      <td className="text-right py-3 px-5">
                        <Badge
                          variant={c.tier === 'vip' ? 'default' : 'secondary'}
                          className={cn('text-[10px] capitalize font-semibold', c.tier === 'vip' && 'bg-gradient-to-r from-amber-500 to-yellow-500 border-0 shadow-sm')}
                        >
                          {c.tier}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassSection>

          <GlassSection title="Campaigns" action="Marketing" onAction={() => navigate('/marketing')}>
            <div className="px-5 pb-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card rounded-xl p-3.5 text-center">
                  <p className="text-xl font-extrabold tabular-nums">{metrics.activeCampaigns.length}</p>
                  <p className="text-[11px] text-muted-foreground font-medium">Active</p>
                </div>
                <div className="glass-card rounded-xl p-3.5 text-center">
                  <p className="text-xl font-extrabold tabular-nums">{metrics.totalRedemptions}</p>
                  <p className="text-[11px] text-muted-foreground font-medium">Redeemed</p>
                </div>
              </div>
              <div className="space-y-2">
                {metrics.activeCampaigns.slice(0, 3).map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/[0.04] transition-all cursor-pointer group/camp" onClick={() => navigate('/marketing')}>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">{c.redemptions}{c.max_redemptions ? `/${c.max_redemptions}` : ''} used</p>
                    </div>
                    {c.promo_code && (
                      <code className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-md font-mono font-semibold">{c.promo_code}</code>
                    )}
                  </div>
                ))}
                {metrics.activeCampaigns.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">No active campaigns</p>
                )}
              </div>
              <div className="pt-3 border-t border-border/50 text-center">
                <p className="text-xs text-muted-foreground">Total discounts: <span className="font-bold text-foreground">{fmtCurrency(metrics.totalDiscountGiven)}</span></p>
              </div>
            </div>
          </GlassSection>
        </div>

        {/* ─── Activity Feed ───────────────────────────────── */}
        <GlassSection title="Recent Activity" count={metrics.recentNotifs.length}>
          {metrics.recentNotifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-3">
                <Activity className="w-6 h-6 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {metrics.recentNotifs.map((n, idx) => (
                <div
                  key={n.id}
                  className={cn(
                    'flex items-start gap-3 px-5 py-3.5 hover:bg-primary/[0.03] transition-all',
                    !n.is_read && 'bg-primary/[0.02]'
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', {
                    'bg-gradient-to-br from-amber-400 to-orange-500': n.type.includes('request'),
                    'bg-gradient-to-br from-red-400 to-rose-500': n.type.includes('negative') || n.type.includes('no_show'),
                    'bg-gradient-to-br from-emerald-400 to-green-500': n.type.includes('completed') || n.type.includes('confirmed'),
                    'bg-gradient-to-br from-blue-400 to-indigo-500': n.type.includes('rescheduled') || n.type.includes('campaign'),
                    'bg-gradient-to-br from-slate-300 to-slate-400': !n.type.includes('request') && !n.type.includes('negative') && !n.type.includes('completed') && !n.type.includes('confirmed') && !n.type.includes('rescheduled') && !n.type.includes('campaign') && !n.type.includes('no_show'),
                  })}>
                    <Bell className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.message}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground/50 flex-shrink-0 mt-0.5 tabular-nums">
                    {format(new Date(n.created_at), 'MMM d, h:mm a')}
                  </span>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
                </div>
              ))}
            </div>
          )}
        </GlassSection>
      </div>
    </div>
  );
}
