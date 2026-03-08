import { useMemo } from 'react';
import {
  DollarSign, Calendar, Star, Clock,
  ArrowRight, User, PawPrint, TrendingUp, ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useBookings, useBookingRequests } from '@/hooks/use-supabase-data';
import { format, startOfWeek, eachDayOfInterval, endOfWeek } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200/60',
  confirmed: 'bg-blue-50 text-blue-700 border border-blue-200/60',
  in_progress: 'bg-violet-50 text-violet-700 border border-violet-200/60',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
  cancelled: 'bg-red-50 text-red-700 border border-red-200/60',
  no_show: 'bg-muted text-muted-foreground',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function MetricCard({ icon: Icon, label, value, sub, accent, trend }: { icon: any; label: string; value: string | number; sub?: string; accent: string; trend?: string }) {
  return (
    <div className="bg-card rounded-xl border p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", accent)}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
            <ArrowUpRight className="w-3 h-3" />{trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</p>}
    </div>
  );
}

function BookingRow({ booking }: { booking: any }) {
  const timeStr = booking.start_time ? new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group">
      <div className="text-xs font-mono text-muted-foreground w-12 flex-shrink-0">{timeStr}</div>
      <div className={cn("w-0.5 self-stretch rounded-full flex-shrink-0", {
        'bg-blue-400': booking.status === 'confirmed',
        'bg-violet-400': booking.status === 'in_progress',
        'bg-emerald-400': booking.status === 'completed',
        'bg-amber-400': booking.status === 'pending',
        'bg-red-400': booking.status === 'cancelled',
      })} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{booking.service_name || 'Service'}</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
          <User className="w-3 h-3 flex-shrink-0" /><span className="truncate">{booking.customer_name}</span>
          <span className="text-border">·</span>
          <PawPrint className="w-3 h-3 flex-shrink-0" /><span>{booking.pet_name}</span>
        </div>
      </div>
      <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-md hidden sm:inline-block", statusColors[booking.status] || 'bg-muted')}>
        {booking.status?.replace('_', ' ')}
      </span>
    </div>
  );
}

function RequestRow({ request }: { request: any }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-muted-foreground flex-shrink-0">
        <User className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{request.customer_name}</p>
        <p className="text-xs text-muted-foreground truncate">{request.service_name || 'Service'} · {request.preferred_date}</p>
      </div>
      {request.is_urgent && <span className="bg-red-50 text-red-600 border border-red-200/60 text-[10px] px-2 py-0.5 rounded-md font-medium">Urgent</span>}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: bookings = [], isLoading: loadingBookings } = useBookings();
  const { data: requests = [], isLoading: loadingRequests } = useBookingRequests();

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayBookings = useMemo(() => bookings.filter(b => b.booking_date === today), [bookings, today]);
  const pendingRequests = useMemo(() => requests.filter(r => r.status === 'pending'), [requests]);

  const todayRevenue = useMemo(() => todayBookings.reduce((sum, b) => sum + Number(b.total_price), 0), [todayBookings]);
  const todayCompleted = useMemo(() => todayBookings.filter(b => b.status === 'completed').length, [todayBookings]);

  const weekData = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayBookings = bookings.filter(b => b.booking_date === dateStr);
      return {
        label: format(day, 'EEE'),
        revenue: dayBookings.reduce((sum, b) => sum + Number(b.total_price), 0),
        bookings: dayBookings.length,
      };
    });
  }, [bookings]);

  if (loadingBookings || loadingRequests) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{getGreeting()} 👋</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here's what's happening with your business today</p>
        </div>
        <button onClick={() => navigate('/appointments')} className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
          <Calendar className="w-4 h-4" /> View Calendar
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard icon={DollarSign} label="Today's Revenue" value={`$${todayRevenue.toFixed(2)}`} accent="bg-emerald-100 text-emerald-600" trend="+12%" />
        <MetricCard icon={Calendar} label="Today's Bookings" value={`${todayCompleted}/${todayBookings.length}`} sub="completed" accent="bg-blue-100 text-blue-600" />
        <MetricCard icon={Star} label="Avg Rating" value="4.7" sub="142 reviews" accent="bg-amber-100 text-amber-600" />
        <MetricCard icon={Clock} label="Pending Requests" value={pendingRequests.length} sub="awaiting response" accent="bg-violet-100 text-violet-600" />
      </div>

      {/* Schedule + Requests */}
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-card rounded-xl border shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="text-sm font-semibold">Today's Schedule</h2>
            <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{todayBookings.length} bookings</span>
          </div>
          {todayBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No bookings today</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Your schedule is clear</p>
            </div>
          ) : (
            <div className="divide-y">
              {todayBookings.map((booking) => (
                <BookingRow key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-card rounded-xl border shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="text-sm font-semibold">Pending Requests</h2>
            <button onClick={() => navigate('/requests')} className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground/60 mt-1">No pending requests</p>
            </div>
          ) : (
            <div className="divide-y">
              {pendingRequests.map((req) => (
                <RequestRow key={req.id} request={req} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-card rounded-xl border shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">Weekly Revenue</h2>
          <span className="text-xs text-muted-foreground">This week</span>
        </div>
        <div className="p-4">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} width={50} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-foreground text-background px-3 py-2 rounded-lg text-xs shadow-lg">
                      <p className="font-semibold">${d.revenue.toFixed(2)}</p>
                      <p className="opacity-70">{d.bookings} bookings</p>
                    </div>
                  );
                }} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
